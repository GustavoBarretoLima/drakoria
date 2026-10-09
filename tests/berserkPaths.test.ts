import assert from "node:assert/strict";
import { BERSERK_PATHS, BERSERK_TIER_LEVELS } from "../shared/src/classes/berserkTree.js";
import { SUBCLASS_TREES, normalizeTreeRanks, treeBlockReason, spentTreePoints } from "../shared/src/classes/skillTrees.js";
import { investTreePoint, getTreeRanks } from "../client/src/progression/skillTreeClient.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
import { createBerserkAxe } from "../shared/src/equipment/berserkWeapons.js";
import { applyBattleAction } from "../shared/src/combat/combatEngine.js";
import { getHeroSkills } from "../shared/src/combat/classSkills.js";
import { startDemoBattle, subscribeDemoBattle } from "../client/src/demo/demoBattle.js";
import type { BattleState } from "../shared/src/types/combat.js";
const saved = new Map<string,string>();
Object.assign(globalThis,{localStorage:{getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)},window:{setInterval:()=>1,clearInterval(){}}});
const tree=SUBCLASS_TREES.berserker;
const axe=createBerserkAxe(createDungeonEquipment("guerreiro","weapon",20,"epic"));
const originalRandom=Math.random;Math.random=()=>.99;
try {
for(const path of BERSERK_PATHS){
 const nodes=tree.filter(node=>node.path===path&&!node.attributeBranch);
 assert.equal(nodes.length,6);
 assert.deepEqual(nodes.map(node=>node.level),[...BERSERK_TIER_LEVELS]);
 const ranks=Object.fromEntries(nodes.map(node=>[node.id,1]));
 assert.deepEqual(normalizeTreeRanks("berserker",15,ranks),ranks);
 assert.equal(spentTreePoints(ranks),6);
 assert.ok(!normalizeTreeRanks("berserker",14,ranks)[nodes[5]!.id]);
 const prefix={...ranks};delete prefix[nodes[5]!.id];
 assert.equal(treeBlockReason("berserker",15,prefix,nodes[5]!),null);
 assert.ok(treeBlockReason("berserker",14,prefix,nodes[5]!));
 assert.deepEqual(normalizeTreeRanks("berserker",100,{[nodes[5]!.id]:1}),{});
 saved.clear();saved.set("classeHeroi","guerreiro");saved.set("drakoriaProgresso",'{"nivel":15}');
 saved.set("drakoriaSubclassProgress",'{"activeSubclass":"berserker","berserkTreeVersion":2,"books":{},"treeRanks":{}}');
 for(const node of nodes) assert.equal(investTreePoint(node.id),null);
 assert.deepEqual(getTreeRanks(),ranks);
 saved.set("drakoriaProgresso",'{"nivel":20}');
 saved.set("drakoriaInventario",JSON.stringify({items:[{item:axe,quantity:1}],equipped:{weapon:axe.id}}));
 const slots=nodes.filter(node=>node.skill).map(node=>node.id);
 const resources=JSON.parse(saved.get("drakoriaHeroVitals") ?? "{}");
 const server=createInitialBattleState("guerreiro","goblin-normal-lvl-1",[axe],20,resources,"berserker","Heroi",ranks,slots);
 assert.equal(getHeroSkills(server.hero).length,slots.length);
 assert.ok(getHeroSkills(server.hero).every(skill=>skill.effect==="berserk"&&skill.damageType==="physical"&&skill.manaCost===0));
 for(const skill of getHeroSkills(server.hero)){
  const state=structuredClone(server);state.hero.fury=100;state.turnOwnerId=state.hero.id;
  state.enemy.stats.hp=state.enemy.stats.maxHp=100000;state.enemy.stats.dodgeChance=0;
  const result=applyBattleAction(state,{type:"USE_SKILL",skillId:skill.id});
  assert.equal(result.lastEvent?.skillId,skill.id);
  assert.equal(result.hero.stats.mana,state.hero.stats.mana);
 }
 let demo:BattleState|undefined;subscribeDemoBattle(state=>{demo=state;});startDemoBattle("guerreiro","goblin-normal-lvl-1",20);
 assert.deepEqual(demo!.hero.treeRanks,ranks);assert.deepEqual(demo!.hero.stats,server.hero.stats);
}
const allNonFinal=Object.fromEntries(tree.filter(node=>!node.attributeBranch&&!node.final).map(node=>[node.id,1]));
const oldBuild={...allNonFinal,"berserker-executor":1};
assert.deepEqual(normalizeTreeRanks("berserker",17,oldBuild),oldBuild,"Old valid builds stay valid");
assert.equal(tree.filter(node=>node.final&&normalizeTreeRanks("berserker",100,{...allNonFinal,"berserker-executor":1,"berserker-avatar":1,"berserker-titan":1})[node.id]).length,1);
const attributes=tree.filter(node=>node.attributeBranch);
for(const path of BERSERK_PATHS){
 const branch=attributes.filter(node=>node.path===path);
 assert.equal(branch.length,2);
 assert.deepEqual(branch[0]!.requires,[]);
 assert.deepEqual(branch[1]!.requires,[{id:branch[0]!.id,rank:2}]);
 assert.ok(branch.every(node=>!node.bonus?.magicPower&&!node.bonus?.maxMana));
}
}finally{Math.random=originalRandom;}
console.log("Berserk paths: independent finals, level gates, six-point builds, optional physical attributes, city investments, old saves and combat/demo/server parity passed.");
