import assert from "node:assert/strict";
import { addExpeditionRewards,normalizeExpedition } from "../shared/src/dungeons/expedition.js";
import { startDungeonRun,loadDungeonRun,registerDungeonVictory,archiveDungeonRun } from "../client/src/battle/dungeonRunClient.js";
import { enterWorldRegion } from "../client/src/battle/worldMapNavigation.js";
import { prepareNextMonster,clearBattleStorage } from "../client/src/battle/victoryNavigation.js";
import { WORLD_REGIONS } from "../shared/src/dungeons/worldRegions.js";
import { createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
const data=new Map<string,string>();const storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)};
Object.assign(globalThis,{localStorage:storage});
const item=createDungeonEquipment("guerreiro","weapon",5,"rare");
const rewards={xp:12,gold:8,drops:[{item,quantity:2}]};
const once=addExpeditionRewards(null,"a",rewards);
assert.equal(once.xp,12);assert.equal(once.loot[0]!.quantity,2);
assert.deepEqual(addExpeditionRewards(once,"a",rewards),once);
assert.equal(addExpeditionRewards(once,"b",rewards).loot[0]!.quantity,4);
assert.deepEqual(normalizeExpedition({xp:Infinity,gold:-4,loot:[null],battles:["a","a",4]}),{xp:0,gold:0,loot:[],battles:["a"]});
for(const [region,{config}] of Object.entries(WORLD_REGIONS)){
 assert.equal(enterWorldRegion(storage,region,()=>0),true);
 for(let index=0;index<config.bossAfterVictories!;index++){
  registerDungeonVictory(`${config.monsters[0]}-normal-lvl-${config.minLevel}`,`${region}-${index}`,rewards);
  const run=loadDungeonRun()!;
  registerDungeonVictory(`${config.monsters[0]}-normal-lvl-${config.minLevel}`,`${region}-${index}`,rewards);
  assert.equal(loadDungeonRun()!.victories,index+1);assert.equal(loadDungeonRun()!.expedition!.xp,12*(index+1));
  assert.equal(run.bossPending,index+1===config.bossAfterVictories);
 }
 // Boss is only selected on explicit continuation, and resources are preserved.
 data.set("drakoriaHeroVitals",'{"hp":20,"mana":5}');
 prepareNextMonster(storage,()=>0);
 assert.equal(data.get("monsterIdAtual"),`${config.bossMonster}-boss-lvl-${config.bossLevel}`);
 assert.equal(data.get("drakoriaHeroVitals"),'{"hp":20,"mana":5}');
 registerDungeonVictory(data.get("monsterIdAtual")!,`${region}-boss`,rewards);
 assert.equal(loadDungeonRun()!.bossDefeated,true);
 archiveDungeonRun("completed");const receipt=data.get("drakoriaLastExpedition");clearBattleStorage(storage);
 assert.equal(data.get("drakoriaLastExpedition"),receipt);assert.equal(loadDungeonRun(),null);
 assert.equal(JSON.parse(receipt!).expedition.gold,8*(config.bossAfterVictories!+1));
}
startDungeonRun("cemiterio-esquecido");registerDungeonVictory("skeleton-normal-lvl-1","new",rewards);archiveDungeonRun("defeat");
assert.equal(JSON.parse(data.get("drakoriaLastExpedition")!).outcome,"defeat");
assert.equal(enterWorldRegion(storage,"cemiterio-esquecido",()=>0),true);assert.equal(loadDungeonRun()!.victories,0);assert.equal(loadDungeonRun()!.expedition!.xp,0);
data.set("drakoriaDungeonRun",'{"dungeonId":"cemiterio","depth":null,"victories":null}');assert.equal(loadDungeonRun()!.depth,1);
console.log("Expeditions: five regions, ledger aggregation, duplicates, legacy/corrupt saves, boss preparation, archive, defeat and fresh runs passed.");
