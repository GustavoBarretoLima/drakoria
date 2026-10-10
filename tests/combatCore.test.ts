import assert from "node:assert/strict";
import { canonicalEquipment } from "../shared/src/equipment/equipmentRules.js";
import { applyBattleAction, applyEnemyTurn, rollDodge } from "../shared/src/combat/combatEngine.js";
import { applyBattleAction as serverAction } from "../server/src/modules/combat/combatEngine.js";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.js";
import { createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
import { generateEquipmentCatalog } from "../shared/src/types/equipmentGenerator.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { createDemoMonster } from "../client/src/demo/demoMonsters.js";
import type { BattleState } from "../shared/src/types/combat.js";

function battle(id = "goblin-normal-lvl-1"): BattleState {
  const state = createInitialBattleState("mago", id, [], 15);
  state.hero.stats.hp = state.hero.stats.maxHp = 10000;
  state.enemy.stats.hp = state.enemy.stats.maxHp = 10000;
  state.hero.stats.criticalChance = state.enemy.stats.criticalChance = 0;
  state.hero.stats.dodgeChance = state.enemy.stats.dodgeChance = 0;
  state.turnOwnerId = state.hero.id;
  return state;
}
function enemyTurn(state: BattleState) { return applyEnemyTurn({ ...state, turnOwnerId: state.enemy.id }); }
const originalRandom = Math.random;
try {
  Math.random = () => 0.49;
  for (const chance of [NaN, Infinity, -1, 0]) assert.equal(rollDodge(chance), false);
  assert.equal(rollDodge(1000), true);
  Math.random = () => 0.5;
  assert.equal(rollDodge(1000), false);
  const base = battle();
  const magic = (state: BattleState) => applyBattleAction(state, { type: "CAST_MAGIC" }).lastEvent!.damage!;
  const attack = (state: BattleState) => applyBattleAction(state, { type: "ATTACK" }).lastEvent!.damage!;
  const stronger = structuredClone(base); stronger.hero.stats.magicPower += 20;
  assert.equal(magic(stronger), magic(base) + 20);
  assert.equal(attack(stronger), attack(base));
  stronger.hero.stats.attack += 30;
  assert.equal(magic(stronger), magic(base) + 20);
  assert.equal(attack(stronger), attack(base) + 30);
  assert.deepEqual(serverAction(base, { type: "CAST_MAGIC" }), applyBattleAction(base, { type: "CAST_MAGIC" }));
  assert.equal(base.hero.stats.mana, createStatsForLevel("mago", 15).mana);
  const empty = structuredClone(base); empty.hero.stats.mana = 9;
  assert.equal(applyBattleAction(empty, { type: "CAST_MAGIC" }).enemy.stats.hp, empty.enemy.stats.hp);
  for (let level = 1; level <= 100; level++) {
    const w = createStatsForLevel("guerreiro", level), m = createStatsForLevel("mago", level), a = createStatsForLevel("arqueiro", level);
    assert.ok(w.attack > m.attack && w.attack > a.attack);
    assert.ok(w.defense > m.defense && w.defense > a.defense);
    assert.ok(m.magicPower > w.magicPower && m.magicPower > a.magicPower && m.mana > a.mana);
    assert.ok(a.speed > w.speed && a.speed > m.speed && a.criticalChance > m.criticalChance && a.dodgeChance > m.dodgeChance);
  }
  const staff = createDungeonEquipment("mago", "weapon", 10, "rare");
  const boots = createDungeonEquipment("arqueiro", "boots", 10, "rare");
  const equipped = applyEquipmentStats(base.hero.stats, [staff, boots]);
  assert.ok(equipped.magicPower > base.hero.stats.magicPower && equipped.speed > base.hero.stats.speed && equipped.dodgeChance > 0);
  assert.equal(equipped.attack, base.hero.stats.attack);
  for (const item of generateEquipmentCatalog().filter(i => i.slot === "weapon" && i.allowedClasses.includes("mago"))) assert.ok(item.stats.magicPower && !item.stats.attack);
  const legacyStaff = { ...staff, stats: { attack: 5, mana: 8 } };
  assert.deepEqual(canonicalEquipment(legacyStaff), staff);
  const display = applyEquipmentStats(createStatsForLevel("mago", 10), [canonicalEquipment(legacyStaff)]);
  assert.equal(display.magicPower, createStatsForLevel("mago", 10).magicPower + staff.stats.magicPower!);
  assert.equal(display.attack, createStatsForLevel("mago", 10).attack);
  const cap = { ...boots, stats: { dodgeChance: 999 } };
  assert.equal(applyEquipmentStats(base.hero.stats, [cap]).dodgeChance, 50);
  Math.random = () => 0;
  const dodged = structuredClone(base); dodged.enemy.stats.dodgeChance = 50; dodged.enemy.defending = true;
  const miss = applyBattleAction(dodged, { type: "CAST_MAGIC" });
  assert.equal(miss.lastEvent!.damage, 0); assert.equal(miss.lastEvent!.dodged, true);
  assert.equal(miss.hero.stats.mana, dodged.hero.stats.mana - 10); assert.equal(miss.enemy.defending, true);
  const heroDodge = structuredClone(base); heroDodge.hero.stats.dodgeChance = 50;
  assert.equal(enemyTurn(heroDodge).hero.stats.hp, heroDodge.hero.stats.hp);
  Math.random = () => 0.25;
  assert.equal(enemyTurn(base).lastEvent!.special, undefined);
  Math.random = () => 0;
  const special = enemyTurn(base); assert.equal(special.lastEvent!.special, "Golpe Poderoso");
  const basic = enemyTurn(special); assert.equal(basic.lastEvent!.special, undefined);
  const basic2 = enemyTurn(basic); assert.equal(basic2.lastEvent!.special, undefined);
  assert.equal(enemyTurn(basic2).lastEvent!.special, "Golpe Poderoso");
  const elite = enemyTurn(battle("hobgoblin-elite-lvl-10"));
  assert.equal(elite.enemy.charging, true); assert.equal(elite.lastEvent!.damage, undefined);
  const strike = enemyTurn(elite); assert.equal(strike.lastEvent!.special, "Estocada Perfurante");
  const guarded = enemyTurn({ ...elite, hero: { ...elite.hero, defending: true } });
  assert.equal(guarded.lastEvent!.damage, Math.floor(strike.lastEvent!.damage! / 2));
  assert.notEqual(enemyTurn(battle("hobgoblin-normal-lvl-10")).enemy.charging, true);
  const boss = battle("orc-king-boss-lvl-15");
  boss.enemy.stats.hp = boss.enemy.stats.maxHp / 2 + 1;
  assert.notEqual(enemyTurn(boss).enemy.phase, 2);
  boss.enemy.stats.hp = boss.enemy.stats.maxHp / 2;
  const phase = enemyTurn(boss); assert.equal(phase.enemy.phase, 2); assert.equal(phase.lastEvent!.action, "ATTACK");
  assert.ok(phase.enemy.stats.magicPower > boss.enemy.stats.magicPower);
  const again = enemyTurn(phase); assert.equal(again.enemy.stats.attack, phase.enemy.stats.attack);
  assert.equal(again.lastEvent!.action, "ATTACK");
  boss.enemy.stats.hp = Math.floor(boss.enemy.stats.maxHp * .3);
  const magicPhase = enemyTurn(boss);
  assert.equal(magicPhase.lastEvent!.action, "CAST_MAGIC");
  const resistant = structuredClone(boss); resistant.hero.stats.magicDefense += 20;
  assert.equal(enemyTurn(resistant).lastEvent!.damage, magicPhase.lastEvent!.damage! - 10);
  const weakMagic = structuredClone(boss); weakMagic.enemy.stats.magicPower = 0;
  assert.ok(enemyTurn(weakMagic).lastEvent!.damage! < magicPhase.lastEvent!.damage!);
  for (const id of ["hobgoblin-elite-lvl-10", "orc-king-boss-lvl-15", "orc-king-boss-lvl-25"]) {
    assert.deepEqual(createDemoMonster(id), createInitialBattleState("mago", id).enemy);
  }
  const finished = { ...base, finished: true }; assert.equal(enemyTurn(finished).finished, true);
} finally { Math.random = originalRandom; }
console.log("Passed: Combat Core 2.0 formulas, dodge, classes, gear, AI, elite and boss phases.");
