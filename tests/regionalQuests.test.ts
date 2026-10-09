import assert from "node:assert/strict";
import { QUESTS,normalizeQuests,advanceQuestVictory } from "../shared/src/quests/regionalQuests.js";
import { WORLD_REGIONS } from "../shared/src/dungeons/worldRegions.js";
import { acceptQuest,claimQuest,loadQuests,recordQuestVictory } from "../client/src/progression/questClient.js";
import { loadProgress } from "../client/src/progression/progressionClient.js";
import { loadInventory } from "../client/src/inventory/inventoryClient.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
const saved=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v)}});
saved.set("classeHeroi","guerreiro");saved.set("drakoriaProgresso",'{"nivel":55,"ouro":0}');
assert.equal(QUESTS.length,15);assert.ok(acceptQuest("invalid"));assert.ok(acceptQuest("pantano-corrompido-boss"));
let counter=0;
for(const [region,{config}] of Object.entries(WORLD_REGIONS)){
 const hunt=`${region}-hunt`,collect=`${region}-collect`,boss=`${region}-boss`;
 for(const id of [hunt,collect,boss])assert.equal(acceptQuest(id),null);
 assert.ok(acceptQuest(hunt));assert.ok(claimQuest(hunt));
 const wrong=createInitialBattleState("guerreiro","goblin-normal-lvl-1",[],55);wrong.finished=true;wrong.winnerId=wrong.hero.id;recordQuestVictory(wrong);
 assert.equal(loadQuests().entries[hunt]!.count,0);
 for(let i=0;i<5;i++){
 const state=createInitialBattleState("guerreiro",`${config.monsters[0]}-normal-lvl-${config.minLevel}`,[],55);state.id=`quest-test-${counter++}`;
 recordQuestVictory(state);assert.equal(loadQuests().entries[hunt]!.count,i);
 state.finished=true;state.winnerId=state.hero.id;state.rewards={xp:1,gold:1,drops:[]};
 let progress=loadQuests();progress=advanceQuestVictory(progress,state.id,state.enemy.id,1);saved.set("drakoriaQuests",JSON.stringify(progress));
 recordQuestVictory(state);assert.equal(loadQuests().entries[hunt]!.count,i+1);
 }
 assert.equal(loadQuests().entries[collect]!.count,3);
 const gold=loadProgress().ouro;assert.equal(claimQuest(hunt),null);assert.ok(loadProgress().ouro>gold);
 const after=loadProgress().ouro;assert.ok(claimQuest(hunt));assert.equal(loadProgress().ouro,after);
 assert.equal(acceptQuest(hunt),null);assert.equal(loadQuests().entries[hunt]!.count,0);
 assert.equal(claimQuest(collect),null);
 const state=createInitialBattleState("guerreiro",`${config.bossMonster}-boss-lvl-${config.bossLevel}`,[],55);state.id=`quest-test-${counter++}`;state.finished=true;state.winnerId=state.hero.id;
 recordQuestVictory(state);assert.equal(loadQuests().entries[boss]!.count,1);assert.equal(claimQuest(boss),null);assert.ok(acceptQuest(boss));assert.ok(claimQuest(boss));
 assert.ok(loadProgress().missoesConcluidas.includes(boss));assert.ok(loadInventory().items.some(entry=>entry.item.level===config.bossLevel&&entry.item.rarity==="epic"));
}
assert.deepEqual(normalizeQuests({entries:{fake:{count:1,status:"active"}},seenBattles:["a","a",2]}),{entries:{},seenBattles:["a"]});
console.log("Regional quests: 15 objectives, campaign sequence, acceptance, region/level matching, drops, defeat rejection, duplicate victories/claims, repeat resets and gear rewards passed.");
