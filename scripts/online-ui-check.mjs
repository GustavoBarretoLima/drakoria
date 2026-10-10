import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createInitialBattleState } from '../server/src/modules/combat/battleRoom.ts';
import { readyForHero, playTurn } from '../server/src/game/rules.ts';
import { onlineRegions, newExpedition } from '../server/src/game/world.ts';
import { gameAssets, enemyPresentation } from '../server/src/game/assets.ts';
import { STARTER_LOOT_ITEMS } from '../shared/src/loot/lootTables.ts';
const { chromium: playwright } = await import(process.env.ONLINE_UI_PLAYWRIGHT_MODULE);
const root = process.cwd();
const output = process.env.ONLINE_UI_OUTPUT ?? '/tmp/drakoria-ui';
await fs.mkdir(output, { recursive: true });
const browser = await playwright.launch({ headless:true });
let snapshot, actions = 0, starts = 0;
function fixture(heroClass = 'guerreiro', regionId = 'cemiterio-esquecido', monsterId = 'skeleton-warrior-normal-lvl-1', level = 1) {
 const messages = []; const state = readyForHero(createInitialBattleState(heroClass, monsterId, [], level, {}, undefined, 'Taichou'), messages);
 return { regions:onlineRegions, expedition:{id:'run-1',regionId,status:'active',state:newExpedition(regionId)}, character: { name:'Taichou', heroClass, level, xp:40, xpToNextLevel:100, gold:18, version:'1', stats:state.hero.stats },
 battle:{regionId,presentation:enemyPresentation(monsterId),id:state.id, revision:0,state:{...state,rewards:undefined},messages,skills:[]},inventory:[{instanceId:'ring',canEquip:true,equipped:false,definition:STARTER_LOOT_ITEMS['goblin-tooth-ring']}] };
}
snapshot = {...fixture(), battle:null, expedition:null};
const context = await browser.newContext({ viewport:{width:1280,height:1050} });
const errors=[]; const page=await context.newPage(); page.on('pageerror', error=>errors.push(error.message));
await context.route('**/*',async route=>{
 const request=route.request();const path=new URL(request.url()).pathname;
 if(path==='/game/state') return route.fulfill({json:snapshot});
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
 const names={'/play':'play.html','/play.css':'play.css','/play.js':'play.js','/play-visuals.js':'play-visuals.js'};
 const asset=gameAssets.get(path), name=names[path];
 if(!asset&&!name)return route.fulfill({status:404});
 const file=asset?`${root}/${asset}`:`${root}/server/public/${name}`;
 const type=file.endsWith('.png')?'image/png':file.endsWith('.gif')?'image/gif':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html';
 return route.fulfill({body:await fs.readFile(file),contentType:type,headers:path==='/play'?{'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}:{}});
});
await page.goto('https://drakoria.test/play');
await page.locator('#game').waitFor({state:'visible'});
assert.equal(await page.locator('#regions article').count(),5);
await page.locator('.world-map>img').evaluate(img=>img.decode());
await page.screenshot({path:`${output}/map-desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Explorar Cemitério Esquecido',exact:true}).click();
await page.locator('#battle-panel').waitFor({state:'visible'});assert.equal(starts,1);
await page.getByRole('button',{name:'Ir para batalha',exact:true}).click(); assert.equal(starts,1); assert.equal(actions,0);
assert.match(await page.locator('#enemy-sprite').getAttribute('src'),/esqueleto_guerreiro\/idle.gif$/);
await page.locator('#hero-sprite').evaluate(img=>img.decode());await page.locator('#enemy-sprite').evaluate(img=>img.decode());
assert.equal(await page.locator('#hero-health-bar').evaluate(bar=>bar.value),snapshot.battle.state.hero.stats.hp);
await page.screenshot({path:`${output}/desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Atacar',exact:true}).click();
await page.waitForFunction(()=>document.getElementById('message').textContent==='Progresso sincronizado.');
assert.equal(actions,1);assert.equal(await page.locator('#enemy-health-bar').evaluate(bar=>bar.value),snapshot.battle.state.enemy.stats.hp);
await page.reload();await page.locator('#game').waitFor({state:'visible'});assert.equal(actions,1);
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('#game').waitFor({state:'visible'});
assert.equal(await page.locator('#reduce-motion').isChecked(),true);
assert.match(await page.locator('#hero-sprite').getAttribute('src'),/static\.png$/);
for(const heroClass of ['mago','arqueiro']) {
 snapshot=fixture(heroClass);await page.reload();await page.locator('#game').waitFor({state:'visible'});
 assert.match(await page.locator('#hero-sprite').getAttribute('src'),new RegExp(heroClass+'-static'));
}
for (const region of onlineRegions) {
 const monsterId = { 'cemiterio-esquecido':'cursed-gravedigger-boss-lvl-15', 'pantano-corrompido':'corruption-hydra-boss-lvl-25', 'floresta-sombria':'mutant-wolf-boss-lvl-35', 'acampamento-orc':'orc-warlord-boss-lvl-40', 'fortaleza-rei-orc':'orc-king-boss-lvl-55' }[region.id];
 snapshot=fixture('guerreiro',region.id,monsterId,100);snapshot.expedition.state.bossPending=true;
 await page.reload();await page.locator('#game').waitFor({state:'visible'});
 await page.locator('#enemy-sprite').evaluate(img=>img.decode());
 assert.equal(await page.locator('#arena-region').textContent(),region.label);
 assert.equal(await page.locator('#battle-scene').getAttribute('data-region'),region.id);
 assert.match(await page.locator('#enemy-sprite').getAttribute('src'),/monsters\/.+\/static.png$/);
 snapshot={...snapshot,battle:{...snapshot.battle,state:{...snapshot.battle.state,finished:true,winnerId:snapshot.battle.state.hero.id}}};
 await page.reload();await page.locator('#game').waitFor({state:'visible'});
 assert.equal(await page.locator('#start').textContent(),'Enfrentar o chefe');
}
snapshot=fixture();await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.locator('#game').waitFor({state:'visible'});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#map-hotspots').evaluate(el=>el.closest('.map-scroll').scrollLeft=0);
await page.locator('.map-panel').screenshot({path:`${output}/map-mobile.png`});
await page.locator('#battle-panel').screenshot({path:`${output}/mobile.png`});
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['CSP assets','desktop/mobile layout','server response updates HP','one action request','reload without animation replay','three hero classes','reduced motion','original map and five regions','region start command','five boss sprites and stages'],actions}));
await browser.close();