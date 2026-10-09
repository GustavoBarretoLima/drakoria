import assert from "node:assert/strict";
import { SUBCLASS_IDS, SUBCLASS_DEFINITIONS } from "../shared/src/classes/subclasses.js";
import { SUBCLASS_TREES, applyTreeStats, normalizeTreeRanks, treeBlockReason, spentTreePoints } from "../shared/src/classes/skillTrees.js";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { startDemoBattle, subscribeDemoBattle } from "../client/src/demo/demoBattle.js";
import type { BattleState, Stats } from "../shared/src/types/combat.js";
const saved = new Map<string,string>();
Object.assign(globalThis, { localStorage: {getItem: (key:string) => saved.get(key) ?? null, setItem: (key:string,value:string) => saved.set(key,value)}, window: {setInterval:()=>1, clearInterval(){}} });
for (const id of SUBCLASS_IDS) {
  const tree = SUBCLASS_TREES[id], attributes = tree.filter(node => node.attributeBranch);
  assert.equal(attributes.length, 6);
  assert.ok(attributes.every(node => !node.skill && node.maxRank === 3));
  const legacy = Object.fromEntries(tree.filter(node => !node.attributeBranch && !node.final).map(node => [node.id,node.maxRank]));
  assert.deepEqual(normalizeTreeRanks(id, 100, legacy), legacy, "Existing investments survive");
  const full = {...legacy, ...Object.fromEntries(attributes.map(node => [node.id,3]))};
  assert.deepEqual(normalizeTreeRanks(id,100,full),full);
  assert.equal(spentTreePoints(full) - spentTreePoints(legacy),18);
  const base = createStatsForLevel(SUBCLASS_DEFINITIONS[id].baseClass,100);
  base.hp = 1; base.mana = 0;
  const before = applyTreeStats(base,id,100,legacy), after = applyTreeStats(base,id,100,full);
  for (const key of Object.keys(base) as (keyof Stats)[]) {
    if (key === "hp" || key === "mana") continue;
    const flat = ["criticalChance","criticalDamage","dodgeChance"].includes(key);
    const increase = attributes.reduce((sum,node) => sum + (flat ? (node.bonus?.[key] ?? 0)*3 : Math.floor((base[key] ?? 0)*(node.bonus?.[key] ?? 0)*3/100)),0);
    const cap = key === "criticalChance" ? 100 : key === "dodgeChance" ? 50 : Infinity;
    assert.equal(after[key], Math.min(cap,(before[key] ?? 0)+increase), `${id} ${key}`);
  }
  assert.equal(after.hp,1); assert.equal(after.mana,0);
  assert.deepEqual(normalizeTreeRanks(id,100,{[attributes[3]!.id]:3}),{});
  assert.ok(treeBlockReason(id,4,legacy,attributes[0]!));
  assert.ok(treeBlockReason(id,19,full,attributes[3]!));
  assert.ok(!normalizeTreeRanks(id,100,{...legacy,[attributes[0]!.id]:4})[attributes[0]!.id]);
  saved.clear(); saved.set("classeHeroi",SUBCLASS_DEFINITIONS[id].baseClass); saved.set("drakoriaProgresso",'{"nivel":100}');
  saved.set("drakoriaSubclassProgress",JSON.stringify({activeSubclass:id,treeRanks:full,berserkTreeVersion:2,books:{}}));
  let demo: BattleState | undefined; subscribeDemoBattle(value => {demo=value;});
  startDemoBattle(SUBCLASS_DEFINITIONS[id].baseClass,"goblin-normal-lvl-1",100);
  const server = createInitialBattleState(SUBCLASS_DEFINITIONS[id].baseClass,"goblin-normal-lvl-1",[],100,{},id,"Heroi",full);
  assert.deepEqual(demo!.hero.stats,server.hero.stats);
}
console.log("Attribute talents: nine identities, 54 talents, percentages, point units, ranks/gates, legacy saves, injured resources and demo/server parity passed.");

const early = { "berserker-brutal":1, "berserker-instinct":1, "berserker-iron":1, "berserker-attribute-0":3, "berserker-attribute-1":3, "berserker-attribute-2":3 };
assert.ok(treeBlockReason("berserker",100,early,SUBCLASS_TREES.berserker.find(node=>node.id === "berserker-wound")!), "Attributes do not bypass the previous skill in the path");
