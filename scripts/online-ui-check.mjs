import { tavernSnapshot } from '../server/src/game/tavern.ts';
import { POTIONS, applyPotionEffect } from '../shared/src/items/potions.ts';
import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS, listSubclassesForClass } from '../shared/src/classes/subclasses.ts';
import { SUBCLASS_TREES, normalizeTreeRanks, normalizeBerserkLoadout, earnedTreePoints, spentTreePoints, treeBlockReason } from '../shared/src/classes/skillTrees.ts';
import { getHeroSkills, getSkillBlockReason } from '../shared/src/combat/classSkills.ts';
import { itemDefinition } from '../server/src/game/rules.ts';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createInitialBattleState } from '../server/src/modules/combat/battleRoom.ts';
import { readyForHero, playTurn } from '../server/src/game/rules.ts';
import { onlineRegions, newExpedition } from '../server/src/game/world.ts';
import { gameAssets, enemyPresentation, heroPresentation } from '../server/src/game/assets.ts';
import { QUESTS, normalizeQuests, guildStanding, questBlockReason, questReputation, questRankIndex, GUILD_RANKS } from '../shared/src/quests/regionalQuests.ts';
import { STARTER_LOOT_ITEMS } from '../shared/src/loot/lootTables.ts';
const { chromium: playwright } = await import(process.env.ONLINE_UI_PLAYWRIGHT_MODULE);
const root = process.cwd();
const output = process.env.ONLINE_UI_OUTPUT ?? '/tmp/drakoria-ui';
await fs.mkdir(output, { recursive: true });
const browser = await playwright.launch({ headless:true });
let snapshot, actions = 0, starts = 0, questCommands = 0, specializationCommands = 0, tavernCommands = 0, interruptPurchase = false, guildProgress = normalizeQuests({});
function guildFixture(level = 1, lastDelivery = null) {
 return {standing:guildStanding(guildProgress),lastDelivery,quests:QUESTS.map(q=>({...q,entry:guildProgress.entries[q.id]??null,reputation:questReputation(q),requiredRank:GUILD_RANKS[questRankIndex(q)].name,blocked:questBlockReason(q,guildProgress,level),ready:guildProgress.entries[q.id]?.status==='active'&&guildProgress.entries[q.id].count>=q.target}))};
}
function profileFixture(heroClass, level, id, rawRanks = {}, rawLoadout = [], books = []) {
 const ranks = normalizeTreeRanks(id,level,rawRanks);
 return {active:id?SUBCLASS_DEFINITIONS[id]:null,subclasses:listSubclassesForClass(heroClass),books,points:earnedTreePoints(level)-spentTreePoints(ranks),nodes:id?SUBCLASS_TREES[id].map(node=>({...node,rank:ranks[node.id]||0,blocked:treeBlockReason(id,level,ranks,node)})):[],loadout:id==='berserker'?normalizeBerserkLoadout(level,ranks,rawLoadout):[],slotChoices:id==='berserker'?SUBCLASS_TREES[id].filter(n=>n.skill&&ranks[n.id]).map(n=>({id:n.id,name:n.name})):[]};
}
function tavernFixture(character, inventory = {}) { return tavernSnapshot({...character,gold:String(character.gold),potion_inventory:inventory},character.stats); }
const tavernRequests = [], tavernReceipts = new Map();
function fixture(heroClass = 'guerreiro', regionId = 'cemiterio-esquecido', monsterId = 'skeleton-warrior-normal-lvl-1', level = 1, subclassId, ranks = {}, loadout = []) {
 const weapons = subclassId === 'berserker' ? [itemDefinition('berserk-dungeon-weapon-guerreiro-common-lvl-1')] : [];
 const messages = []; const state = readyForHero(createInitialBattleState(heroClass, monsterId, weapons, level, {}, subclassId, 'Taichou', ranks, loadout), messages);
 return { tavern:tavernFixture({gold:18,stats:state.hero.stats}), specialization:profileFixture(heroClass,level,subclassId,ranks,loadout), guild:guildFixture(level), regions:onlineRegions, expedition:{id:'run-1',regionId,status:'active',state:newExpedition(regionId)}, character: { presentation:heroPresentation(heroClass,subclassId), name:'Taichou', heroClass, level, xp:40, xpToNextLevel:100, gold:18, version:'1', stats:state.hero.stats },
 battle:{heroPresentation:heroPresentation(heroClass,subclassId),regionId,presentation:enemyPresentation(monsterId),id:state.id, revision:0,state:{...state,rewards:undefined},messages,skills:getHeroSkills(state.hero).filter(skill=>level>=skill.unlockLevel).map(skill=>({id:skill.id,name:skill.name,manaCost:skill.manaCost,furyCost:skill.furyCost||0,blocked:getSkillBlockReason(state.hero,skill)}))},inventory:[{instanceId:'ring',canEquip:true,equipped:false,definition:STARTER_LOOT_ITEMS['goblin-tooth-ring']}] };
}
snapshot = {...fixture(), battle:null, expedition:null};
const context = await browser.newContext({ viewport:{width:1280,height:1050} });
let testView = 'guilda';
async function reloadView() { await page.goto(`https://drakoria.test/play#${testView}`); }
const errors=[]; const page=await context.newPage(); page.on('pageerror', error=>errors.push(error.message));
await context.route('**/*',async route=>{
 const request=route.request();const path=new URL(request.url()).pathname;
 if(path==='/game/state') return route.fulfill({json:snapshot});
 if(path==='/game/quests/accept'||path==='/game/quests/claim') {
  const command=request.postDataJSON();assert.deepEqual(Object.keys(command).sort(),['questId','requestId','version']);assert.equal(command.version,snapshot.character.version);
  const q=QUESTS.find(q=>q.id===command.questId);questCommands++;
  let receipt=null;
  if(path.endsWith('accept'))guildProgress.entries[q.id]={count:0,status:'active',claims:0};
  else {assert.equal(guildProgress.entries[q.id].count,q.target);guildProgress.entries[q.id].status='claimed';guildProgress.entries[q.id].claims++;receipt={questId:q.id,name:q.name,xp:q.xp,gold:q.gold,reputation:questReputation(q),equipment:null};}
  snapshot={...snapshot,character:{...snapshot.character,version:String(Number(snapshot.character.version)+1)},guild:guildFixture(snapshot.character.level,receipt)};
  return route.fulfill({json:snapshot});
 }
 if(path==='/game/rest'||path.startsWith('/game/tavern/')){
  const command=request.postDataJSON(),operation=path==='/game/rest'?'rest':path.split('/').at(-1);tavernRequests.push(command);
  assert.deepEqual(Object.keys(command).sort(),['requestId','version',...(operation==='buy'?['potionId','quantity']:operation==='use'?['potionId']:[])].sort());
  if(tavernReceipts.has(command.requestId))return route.fulfill({json:snapshot});
  assert.equal(command.version,snapshot.character.version);tavernCommands++;
  const c={...snapshot.character,stats:{...snapshot.character.stats},version:String(Number(snapshot.character.version)+1)},inventory=Object.fromEntries(snapshot.tavern.potions.map(p=>[p.id,p.quantity]));
  if(operation==='buy'){c.gold-=POTIONS[command.potionId].price*command.quantity;inventory[command.potionId]+=command.quantity;}
  if(operation==='use'){const hero={stats:c.stats,isAlive:c.stats.hp>0};assert.ok(applyPotionEffect(hero,command.potionId));inventory[command.potionId]--;}
  if(operation==='rest'){c.gold-=20;c.stats.hp=c.stats.maxHp;c.stats.mana=c.stats.maxMana;}
  snapshot={...snapshot,character:c,tavern:tavernFixture(c,inventory)};tavernReceipts.set(command.requestId,command);
  if(interruptPurchase){interruptPurchase=false;return route.fulfill({status:503,json:{error:'Resposta interrompida.'}});}
  return route.fulfill({json:snapshot});
 }
 if(path.startsWith('/game/specialization/')) {
  const command=request.postDataJSON(),operation=path.split('/').at(-1); assert.equal(command.version,snapshot.character.version);
  assert.deepEqual(Object.keys(command).sort(),['requestId','version',...(operation==='use-book'?['bookId']:operation==='invest'?['nodeId']:operation==='skill-slot'?['slot','skillId']:[])].sort());
  specializationCommands++;
  const version=String(Number(snapshot.character.version)+1),id=operation==='use-book'?'berserker':snapshot.specialization.active.id;
  const ranks=Object.fromEntries(snapshot.specialization.nodes.filter(n=>n.rank).map(n=>[n.id,n.rank]));
  let loadout=[...snapshot.specialization.loadout];
  if(operation==='invest'){ranks[command.nodeId]=(ranks[command.nodeId]||0)+1;if(command.nodeId==='berserker-brutal')loadout=[command.nodeId];}
  if(operation==='reset'){for(const key of Object.keys(ranks))delete ranks[key];loadout=[];}
  if(operation==='skill-slot'){while(loadout.length<4)loadout.push('');loadout[command.slot]=command.skillId;}
  snapshot={...snapshot,character:{...snapshot.character,version},specialization:profileFixture('guerreiro',20,id,ranks,loadout)};
  return route.fulfill({json:snapshot});
 }
 if(path==='/game/start') {
  const command=request.postDataJSON(); assert.equal(command.version,snapshot.character.version);
  assert.equal(command.regionId,'cemiterio-esquecido'); assert.deepEqual(Object.keys(command).sort(),['regionId','requestId','version']);
  starts++; snapshot=fixture(); return route.fulfill({json:snapshot});
 }
 if(path==='/game/action') {
  const command=request.postDataJSON();assert.equal(command.revision,snapshot.battle.revision);
  actions++;const messages=[...snapshot.battle.messages];
  const state=playTurn(snapshot.battle.state,command.action,messages);
  snapshot={...snapshot,character:{...snapshot.character,stats:state.hero.stats},battle:{...snapshot.battle,state,messages,revision:snapshot.battle.revision+1}};
  return route.fulfill({json:snapshot});
 }
 const names={'/play':'play.html','/play.css':'play.css','/play.js':'play.js','/play-visuals.js':'play-visuals.js','/play-layout.css':'play-layout.css','/play-navigation.js':'play-navigation.js'};
 const asset=gameAssets.get(path), name=names[path];
 if(!asset&&!name)return route.fulfill({status:404});
 const file=asset?`${root}/${asset}`:`${root}/server/public/${name}`;
 const type=file.endsWith('.png')?'image/png':file.endsWith('.gif')?'image/gif':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html';
 return route.fulfill({body:await fs.readFile(file),contentType:type,headers:path==='/play'?{'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}:{}});
});
await page.goto('https://drakoria.test/play');
await page.locator('#game').waitFor({state:'visible'});
assert.equal(await page.locator('body').getAttribute('data-view'),'praca');
assert.ok(await page.locator('#city-sidebar').evaluate(node=>node.inert));
await page.screenshot({path:`${output}/square-desktop.png`,fullPage:true});
await page.locator('#city-menu-handle').focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('#city-menu-handle').getAttribute('aria-expanded'),'true');
await page.locator('#city-sidebar a[href="#status"]').click();await page.locator('#painelPraca').waitFor({state:'visible'});
assert.equal(await page.locator('body').getAttribute('data-view'),'status');
assert.ok(await page.locator('#city-sidebar').evaluate(node=>node.inert));
assert.match(await page.locator('#hero-name').textContent(),/Taichou/);
assert.equal(await page.locator('#hero-attributes dd').count(),8);assert.equal(await page.locator('#hero-equipment .equipment-slot').count(),9);
await page.locator('#profile-sprite').evaluate(img=>img.decode());
await page.screenshot({path:`${output}/status-desktop.png`,fullPage:true});
await page.locator('.jrpg-sheet-header a[href="#inventario"]').click();assert.equal(await page.locator('body').getAttribute('data-view'),'inventario');
assert.equal(actions+starts+questCommands+specializationCommands+tavernCommands,0);
await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:`${output}/inventory-mobile.png`,fullPage:true});
await page.locator('.city-window-toolbar a[href="#praca"]').click();
await page.screenshot({path:`${output}/square-mobile.png`,fullPage:true});
await page.locator('#city-menu-handle').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
assert.equal(await page.locator('#city-menu-handle').getAttribute('aria-expanded'),'false');
assert.equal(await page.evaluate(()=>document.activeElement.id),'city-menu-handle');
await page.setViewportSize({width:1280,height:1050});await reloadView();
await page.locator('#game').waitFor({state:'visible'});
assert.equal(await page.locator('#regions article').count(),5);
await page.locator('#guild-contracts summary').click();assert.equal(await page.locator('#guild-quests article').count(),3);
assert.match(await page.locator('#guild-standing').textContent(),/Rank F/);
await page.locator('#guild-region').selectOption('pantano-corrompido');assert.ok(await page.locator('#guild-quests button').first().isDisabled());
await page.locator('#guild-region').selectOption('cemiterio-esquecido');
await page.getByRole('button',{name:'Aceitar: Patrulha: Cemitério Esquecido',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');assert.equal(questCommands,1);
assert.match(await page.locator('#quest-tracker').textContent(),/0\/5/);
guildProgress.entries['cemiterio-esquecido-hunt'].count=5;snapshot={...snapshot,guild:guildFixture()};
await reloadView();await page.locator('#game').waitFor({state:'visible'});await page.locator('#guild-contracts summary').click();
await page.getByRole('button',{name:'Entregar Patrulha: Cemitério Esquecido',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');assert.equal(questCommands,2);
assert.match(await page.locator('#guild-standing').textContent(),/10 de reputação/);
assert.match(await page.locator('#guild-receipt').textContent(),/60 XP, 20 ouro/);
await page.locator('#guild-panel').screenshot({path:`${output}/guild-desktop.png`});
await reloadView();await page.locator('#game').waitFor({state:'visible'});assert.equal(questCommands,2);
await page.setViewportSize({width:390,height:844});await page.locator('#guild-contracts summary').click();
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#guild-panel').screenshot({path:`${output}/guild-mobile.png`});
testView='mapa';guildProgress=normalizeQuests({});snapshot={...fixture(),battle:null,expedition:null};await page.setViewportSize({width:1280,height:1050});
await reloadView();await page.locator('#game').waitFor({state:'visible'});
await page.locator('.world-map>img').evaluate(img=>img.decode());
await page.screenshot({path:`${output}/map-desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Explorar Cemitério Esquecido',exact:true}).click();
await page.locator('#battle-panel').waitFor({state:'visible'});testView='batalha';assert.equal(starts,1);
await page.getByRole('button',{name:'Ir para batalha',exact:true}).click(); assert.equal(starts,1); assert.equal(actions,0);
assert.match(await page.locator('#enemy-sprite').getAttribute('src'),/esqueleto_guerreiro\/idle.gif$/);
await page.locator('#hero-sprite').evaluate(img=>img.decode());await page.locator('#enemy-sprite').evaluate(img=>img.decode());
assert.equal(await page.locator('#hero-health-bar').evaluate(bar=>bar.value),snapshot.battle.state.hero.stats.hp);
await page.screenshot({path:`${output}/desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Atacar',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(actions,1);assert.equal(await page.locator('#enemy-health-bar').evaluate(bar=>bar.value),snapshot.battle.state.enemy.stats.hp);
await reloadView();await page.locator('#game').waitFor({state:'visible'});assert.equal(actions,1);
await page.emulateMedia({reducedMotion:'reduce'});await reloadView();await page.locator('#game').waitFor({state:'visible'});
assert.equal(await page.locator('#reduce-motion').isChecked(),true);
assert.match(await page.locator('#hero-sprite').getAttribute('src'),/static\.png$/);
for(const heroClass of ['mago','arqueiro']) {
 snapshot=fixture(heroClass);await reloadView();await page.locator('#game').waitFor({state:'visible'});
 assert.match(await page.locator('#hero-sprite').getAttribute('src'),new RegExp(heroClass+'-static'));
}
for (const region of onlineRegions) {
 const monsterId = { 'cemiterio-esquecido':'cursed-gravedigger-boss-lvl-15', 'pantano-corrompido':'corruption-hydra-boss-lvl-25', 'floresta-sombria':'mutant-wolf-boss-lvl-35', 'acampamento-orc':'orc-warlord-boss-lvl-40', 'fortaleza-rei-orc':'orc-king-boss-lvl-55' }[region.id];
 snapshot=fixture('guerreiro',region.id,monsterId,100);snapshot.expedition.state.bossPending=true;
 await reloadView();await page.locator('#game').waitFor({state:'visible'});
 await page.locator('#enemy-sprite').evaluate(img=>img.decode());
 assert.equal(await page.locator('#arena-region').textContent(),region.label);
 assert.equal(await page.locator('#battle-scene').getAttribute('data-region'),region.id);
 assert.match(await page.locator('#enemy-sprite').getAttribute('src'),/monsters\/.+\/static.png$/);
 snapshot={...snapshot,battle:{...snapshot.battle,state:{...snapshot.battle.state,finished:true,winnerId:snapshot.battle.state.hero.id}}};
 await reloadView();await page.locator('#game').waitFor({state:'visible'});
 assert.equal(await page.locator('#start').textContent(),'Enfrentar o chefe');
}
snapshot=fixture();await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});await reloadView();await page.locator('#game').waitFor({state:'visible'});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#map-hotspots').evaluate(el=>el.closest('.map-scroll').scrollLeft=0);
await page.evaluate(()=>{location.hash='mapa';});await page.locator('.map-panel').waitFor({state:'visible'});
await page.locator('.map-panel').screenshot({path:`${output}/map-mobile.png`});
await page.evaluate(()=>{location.hash='batalha';});await page.locator('#battle-panel').waitFor({state:'visible'});
await page.locator('#battle-panel').screenshot({path:`${output}/mobile.png`});
testView='taberna';
// Tavern purchases, interrupted-response retry, consumption, paid rest and authoritative stock.
snapshot={...fixture('mago','cemiterio-esquecido','skeleton-warrior-normal-lvl-1',20),battle:null,expedition:null};
snapshot.character={...snapshot.character,gold:100,stats:{...snapshot.character.stats,hp:1,mana:1}};snapshot.tavern=tavernFixture(snapshot.character);
await page.setViewportSize({width:1280,height:1050});await reloadView();await page.locator('#game').waitFor({state:'visible'});
await page.locator('#tavern-shop summary').click();assert.equal(await page.locator('#tavern-potions article').count(),9);
interruptPurchase=true;await page.getByRole('button',{name:'Comprar Poção de HP · 5 ouro',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Resposta interrompida.');
assert.equal(tavernCommands,1);assert.equal(snapshot.character.gold,95);
await page.getByRole('button',{name:'Comprar Poção de HP · 5 ouro',exact:true}).click();await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(tavernCommands,1);assert.deepEqual(tavernRequests[0],tavernRequests[1]);
await page.getByRole('button',{name:'Usar Poção de HP',exact:true}).click();await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(tavernCommands,2);assert.equal(snapshot.character.stats.hp,41);assert.equal(snapshot.tavern.potions.find(p=>p.id==='healthPotion').quantity,0);
await page.getByRole('button',{name:'Descansar · 20 ouro',exact:true}).click();await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(tavernCommands,3);assert.equal(snapshot.character.gold,75);assert.ok(await page.locator('#rest').isDisabled());
await page.locator('#tavern-potions img').first().evaluate(img=>img.decode());await page.locator('#tavern-panel').screenshot({path:`${output}/tavern-desktop.png`});
await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#tavern-panel').screenshot({path:`${output}/tavern-mobile.png`});
await reloadView();await page.locator('#game').waitFor({state:'visible'});assert.equal(tavernCommands,3);assert.match(await page.locator('#tavern-resources').textContent(),/75 ouro/);
snapshot=fixture();await reloadView();await page.locator('#game').waitFor({state:'visible'});await page.locator('#tavern-shop summary').click();
assert.ok(await page.getByRole('button',{name:'Comprar Poção de HP · 5 ouro',exact:true}).isDisabled());assert.ok(await page.locator('#rest').isDisabled());
testView='livros';
// Permanent choice confirmation, intent-only commands, server point balance and slot persistence.
snapshot={...fixture('guerreiro','cemiterio-esquecido','skeleton-warrior-normal-lvl-1',20),battle:null,expedition:null};
snapshot.specialization.books=[{instanceId:'00000000-0000-0000-0000-000000000001',subclassId:'berserker',name:SUBCLASS_DEFINITIONS.berserker.bookName,blocked:null}];
await page.setViewportSize({width:1280,height:1050});await reloadView();await page.locator('#game').waitFor({state:'visible'});
page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Usar livro',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');assert.equal(specializationCommands,1);
assert.match(await page.locator('#specialization-active').textContent(),/Berserk/);
await page.locator('#specialization-tree details summary').click();
await page.getByRole('button',{name:'Investir em Golpe Brutal',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');assert.equal(specializationCommands,2);
assert.match(await page.locator('#talent-points').textContent(),/18 pontos/);
assert.equal(await page.locator('#skill-slot-0').inputValue(),'berserker-brutal');
await page.locator('#skill-slot-0').selectOption('');await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');assert.equal(specializationCommands,3);
await page.locator('#specialization-panel').screenshot({path:`${output}/specialization-desktop.png`});
await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#specialization-panel').screenshot({path:`${output}/specialization-mobile.png`});
await reloadView();await page.locator('#game').waitFor({state:'visible'});assert.equal(specializationCommands,3);assert.equal(await page.locator('#skill-slot-0').inputValue(),'');
await page.getByRole('button',{name:'Redistribuir todos os pontos',exact:true}).click();await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(specializationCommands,4);assert.match(await page.locator('#talent-points').textContent(),/19 pontos/);
testView='batalha';
for(const id of SUBCLASS_IDS){
 const heroClass=SUBCLASS_DEFINITIONS[id].baseClass,node=SUBCLASS_TREES[id].find(n=>!n.requires.length);
 snapshot=fixture(heroClass,'cemiterio-esquecido','skeleton-warrior-normal-lvl-1',20,id,{[node.id]:1},node.skill?[node.id]:[]);
 await page.emulateMedia({reducedMotion:'reduce'});await reloadView();await page.locator('#game').waitFor({state:'visible'});
 await page.locator('#hero-sprite').evaluate(img=>img.decode());assert.match(await page.locator('#hero-sprite').getAttribute('src'),/heroes\/.+\/static.png$/);
 assert.ok(await page.getByRole('button',{name:'Redistribuir todos os pontos',exact:true}).isDisabled());
 if(id==='berserker'){
  assert.equal(await page.getByRole('button',{name:'Magia · 10 mana',exact:true}).count(),0);assert.match(await page.locator('#arena-hero-health').textContent(),/Fúria/);
  assert.match(await page.getByRole('button',{name:'Golpe Brutal · 0 fúria',exact:true}).textContent(),/fúria/);
  await page.locator('#battle-panel').screenshot({path:`${output}/berserk-mobile.png`});
 }
 await page.emulateMedia({reducedMotion:'no-preference'});await reloadView();await page.locator('#game').waitFor({state:'visible'});
 await page.locator('#hero-sprite').evaluate(img=>img.decode());assert.match(await page.locator('#hero-sprite').getAttribute('src'),/heroes\/.+\/idle.gif$/);
}
assert.equal(await page.evaluate(()=>localStorage.length),0);
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['CSP assets','desktop/mobile layout','server response updates HP','one action request','reload without animation replay','three hero classes','reduced motion','original map and five regions','region start command','five boss sprites and stages','Guild accept/claim commands and receipt','Guild rank gates and mobile layout','permanent book confirmation and consumption','talent allocation/reset and slot commands','nine subclass sprites under CSP','Berserk fury and active-battle edit locks','nine recovery potions and original icons','purchase retry after interrupted response','potion consumption and paid rest','tavern persisted stock and mobile layout','original square and building hotspots','drawer keyboard navigation and focus','JRPG status and inventory views','navigation without mutation or local saves'],actions}));
await browser.close();