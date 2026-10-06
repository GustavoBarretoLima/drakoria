import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { DUNGEON_MONSTERS, createDungeonMonster } from "../shared/src/constants/dungeonMonsters.js";
import { getMonsterById, listMonsters } from "../server/src/modules/monsters/monsterService.js";
import { createDemoMonster, getDemoMonsterRewards } from "../client/src/demo/demoMonsters.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { rollMonsterDrops } from "../shared/src/loot/lootTables.js";

for (const monster of DUNGEON_MONSTERS) {
  assert.deepEqual(getMonsterById(monster.id), monster);
  const online = createInitialBattleState("guerreiro", monster.id);
  assert.deepEqual(createDemoMonster(monster.id), online.enemy);
  assert.deepEqual(getDemoMonsterRewards(monster.id), { xp: monster.xpReward, gold: monster.goldReward });
  for (const path of Object.values(monster.sprites)) assert.ok(existsSync(`.${path}`), path);
}
assert.equal(new Set(listMonsters().map(m => m.id)).size, listMonsters().length);
assert.equal(createDungeonMonster("mutant-rat-normal-lvl-16"), undefined);
assert.equal(createDungeonMonster("orc-king-boss-lvl-5"), undefined);
for (const level of [1, 5, 15]) {
  const orc = getMonsterById(`orc-normal-lvl-${level}`)!;
  for (const path of Object.values(orc.sprites)) assert.ok(existsSync(`.${path}`));
}
const originalRandom = Math.random;
try {
  Math.random = () => 0;
  for (const monster of DUNGEON_MONSTERS) assert.equal(rollMonsterDrops(monster.id).length, 1);
  Math.random = () => 0.99;
  for (const monster of DUNGEON_MONSTERS) assert.equal(rollMonsterDrops(monster.id).length, 0);
} finally { Math.random = originalRandom; }
const values = new Map<string, string>();
const panel = { classList: { remove() {} }, innerHTML: "" };
let roll = 0;
const context = vm.createContext({
  Math: Object.assign(Object.create(Math), { random: () => roll }),
  localStorage: { setItem: (key: string, value: string) => values.set(key, value) },
  window: { location: { href: "" } }, document: { getElementById: () => panel },
});
vm.runInContext(readFileSync("js/dungeon-orc-ranges.js", "utf8"), context);
vm.runInContext("window.abrirDungeon()", context);
assert.ok(panel.innerHTML.includes("Fortaleza do Orc Rei"));
assert.ok(panel.innerHTML.includes("Cripta dos Mutantes"));
for (const [random, expected] of [[0, "orc-king-boss-lvl-15"], [0.1, "orc-warlord-mini-boss-lvl-15"], [0.24, "orc-warlord-mini-boss-lvl-15"], [0.25, "orc-normal-lvl-7"], [0.99, "orc-normal-lvl-15"]] as const) {
  roll = random;
  vm.runInContext("window.entrarFortalezaOrcRei()", context);
  assert.equal(values.get("monsterIdAtual"), expected);
  assert.equal(values.get("dungeonAtual"), "dungeon-orc-king");
}
for (roll of [0, 0.34, 0.67, 0.99]) {
  vm.runInContext("window.entrarCriptaMutantes()", context);
  assert.ok(getMonsterById(values.get("monsterIdAtual")!));
  assert.equal(values.get("dungeonAtual"), "dungeon-mutants");
}
for (const entry of ["entrarDungeonOrc1a5", "entrarDungeonOrc5a15", "entrarMiniBossOrc"]) {
  vm.runInContext(`window.${entry}()`, context);
  assert.ok(getMonsterById(values.get("monsterIdAtual")!));
}
console.log("Dungeon integration checks passed: catalog, demo/server parity, assets, loot, UI and legacy entries.");
