import { DUNGEON_CONFIG, pickDungeonEncounter } from "../shared/src/dungeons/dungeonEncounters.js";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { DUNGEON_MONSTERS, createDungeonMonster } from "../shared/src/constants/dungeonMonsters.js";
import { DUNGEON_LOOT_ITEMS, DUNGEON_EQUIPMENT_SLOTS, DUNGEON_EQUIPMENT_NAMES, createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
import { canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { getMonsterById, listMonsters } from "../server/src/modules/monsters/monsterService.js";
import { getEquipmentById, listEquipments } from "../server/src/modules/equipment/equipmentService.js";
import { createDemoMonster, getDemoMonsterRewards } from "../client/src/demo/demoMonsters.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { rollMonsterDrops, STARTER_LOOT_ITEMS } from "../shared/src/loot/lootTables.js";
import { equipItem, getEquippedItems } from "../client/src/inventory/inventoryClient.js";
import type { HeroClass } from "../shared/src/types/equipment.js";

for (const monster of DUNGEON_MONSTERS) {
  assert.deepEqual(getMonsterById(monster.id), monster);
  assert.deepEqual(createDemoMonster(monster.id), createInitialBattleState("guerreiro", monster.id).enemy);
  assert.deepEqual(getDemoMonsterRewards(monster.id), { xp: monster.xpReward, gold: monster.goldReward });
  for (const path of Object.values(monster.sprites)) assert.ok(existsSync(`.${path}`), path);
}
assert.equal(new Set(listMonsters().map(m => m.id)).size, listMonsters().length);
for (const id of ["mutant-rat-normal-lvl-0", "mutant-rat-normal-lvl-11", "skeleton-warrior-normal-lvl-11", "hobgoblin-normal-lvl-9", "hobgoblin-elite-lvl-16", "orc-king-boss-lvl-14", "orc-king-boss-lvl-26"]) assert.equal(createDungeonMonster(id), undefined);
for (const level of [10, 15]) {
  const normal = getMonsterById(`hobgoblin-normal-lvl-${level}`)!;
  const elite = getMonsterById(`hobgoblin-elite-lvl-${level}`)!;
  assert.deepEqual(normal.sprites, elite.sprites);
  assert.equal(elite.rank, "elite");
  for (const stat of ["hp", "attack", "defense"] as const) assert.ok(elite.stats[stat] > normal.stats[stat]);
  assert.ok(elite.xpReward > normal.xpReward && elite.goldReward > normal.goldReward);
}
const classes: HeroClass[] = ["guerreiro", "mago", "arqueiro"];
for (const item of Object.values(DUNGEON_LOOT_ITEMS)) {
  assert.deepEqual(getEquipmentById(item.id), item);
  assert.ok(existsSync(`.${item.icon}`), item.icon);
  assert.equal(item.allowedClasses.length, 1);
  for (const heroClass of classes) {
    assert.equal(canEquipItem(item, heroClass, item.level), item.allowedClasses.includes("universal") || item.allowedClasses.includes(heroClass));
    assert.equal(canEquipItem(item, heroClass, item.level - 1), false);
  }
}
for (const level of [1, 10, 15, 25]) for (const heroClass of classes) for (const slot of DUNGEON_EQUIPMENT_SLOTS) {
  const common = createDungeonEquipment(heroClass, slot, level, "common");
  const epic = createDungeonEquipment(heroClass, slot, level, "epic");
  assert.ok(Object.values(epic.stats).reduce((a,b) => a+b,0) > Object.values(common.stats).reduce((a,b) => a+b,0));
}
assert.equal(canEquipItem(STARTER_LOOT_ITEMS["orc-iron-axe"]!, "mago", 25), false);
assert.equal(canEquipItem(STARTER_LOOT_ITEMS["orc-warlord-sword"]!, "arqueiro", 25), false);
assert.ok(!listEquipments({ heroClass: "mago", slot: "weapon" }).some(item => /Espada|Machado|Arco/.test(item.name)));
const originalRandom = Math.random;
function randomSequence(values: number[]) { let index = 0; Math.random = () => values[index++] ?? 0; }
try {
  for (const monster of DUNGEON_MONSTERS) {
    Math.random = () => 0;
    const drops = rollMonsterDrops(monster.id);
    assert.equal(drops.length, monster.rank === "boss" ? 2 : 1);
    assert.equal(drops[0]!.item.level, monster.level);
    assert.ok(DUNGEON_LOOT_ITEMS[drops[0]!.item.id]);
    Math.random = () => 0.99;
    assert.equal(rollMonsterDrops(monster.id).length, monster.rank === "boss" ? 1 : 0);
  }
  // Every slot and class can actually be rolled, not just found in the catalog.
  for (let slotIndex = 0; slotIndex < 9; slotIndex++) for (let classIndex = 0; classIndex < 3; classIndex++) {
    randomSequence([0, 0.99, (slotIndex + 0.5)/9, (classIndex + 0.5)/3]);
    const item = rollMonsterDrops("orc-king-boss-lvl-25")[0]!.item;
    assert.equal(item.rarity, "epic"); assert.equal(item.slot, DUNGEON_EQUIPMENT_SLOTS[slotIndex]);
    assert.deepEqual(item.allowedClasses, [classes[classIndex]]);
  }
  for (const [id, roll, expected] of [["hobgoblin-elite-lvl-10", 0.79, "rare"], ["hobgoblin-elite-lvl-10", 0.80, "epic"], ["orc-king-boss-lvl-15", 0.39, "rare"], ["orc-king-boss-lvl-15", 0.40, "epic"]] as const) {
    randomSequence([0, roll, 0, 0]); assert.equal(rollMonsterDrops(id)[0]!.item.rarity, expected);
  }
  randomSequence([0.85]); assert.equal(rollMonsterDrops("hobgoblin-elite-lvl-10").length, 0);
  randomSequence([0.35]); assert.equal(rollMonsterDrops("mutant-rat-normal-lvl-1").length, 0);
} finally { Math.random = originalRandom; }

const values = new Map<string, string>();
const panel = { classList: { remove() {} }, innerHTML: "" };
let queue: number[] = [];
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
const context = vm.createContext({ DUNGEON_ORC_CONFIG: DUNGEON_CONFIG, dungeonOrcPickMonster: (config: Parameters<typeof pickDungeonEncounter>[0]) => pickDungeonEncounter(config, () => queue.shift() ?? 0), Math: Object.assign(Object.create(Math), { random: () => queue.shift() ?? 0 }), localStorage: storage, window: { location: { href: "" } }, document: { getElementById: () => panel } });
vm.runInContext(readFileSync("js/dungeon-orc-ranges.js", "utf8").replace(/^import[^\n]*\n/, ""), context);
vm.runInContext("window.abrirDungeon()", context);
for (const label of ["Covil dos Goblins e Orcs", "Cripta dos Mutantes", "Acampamento Hobgoblin", "Trono do Orc Rei"]) assert.ok(panel.innerHTML.includes(label));
for (const names of Object.values(DUNGEON_EQUIPMENT_NAMES)) for (const name of Object.values(names)) assert.ok(panel.innerHTML.includes(name));
for (const [key, species, min, max] of [["iniciante", ["goblin", "orc"], 1, 10], ["cripta", ["skeleton-warrior", "mutant-rat"], 1, 10], ["avancada", ["hobgoblin"], 10, 15], ["fortaleza", ["orc-king"], 15, 25]] as const) {
  for (const random of [0, 0.49, 0.99]) {
    queue = [random, random, random];
    vm.runInContext(`window.entrarDungeonPorFaixa('${key}')`, context);
    const monster = getMonsterById(values.get("monsterIdAtual")!)!;
    assert.ok(monster); assert.ok(monster.level >= min && monster.level <= max);
    assert.ok(species.some(name => monster.id.startsWith(name)));
    assert.equal(values.get("dungeonNivelMin"), String(min)); assert.equal(values.get("dungeonNivelMax"), String(max));
    if (key === "fortaleza") assert.equal(monster.rank, "boss");
  }
}
for (const [roll, rank] of [[0.199, "elite"], [0.20, "normal"]] as const) {
  queue = [0, 0, roll]; vm.runInContext("window.entrarDungeonPorFaixa('avancada')", context);
  assert.equal(getMonsterById(values.get("monsterIdAtual")!)!.rank, rank);
}
for (const entry of ["entrarDungeonOrc1a5", "entrarDungeonOrc5a15", "entrarMiniBossOrc"]) {
  queue = [0.99, 0.99, 0.99]; vm.runInContext(`window.${entry}()`, context);
  assert.ok(getMonsterById(values.get("monsterIdAtual")!));
}
// Saved universal iron items lose their old bypass, without deleting inventory.
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
values.set("classeHeroi", "mago"); values.set("drakoriaProgresso", JSON.stringify({ nivel: 25 }));
values.set("drakoriaInventario", JSON.stringify({ items: [{ item: { ...STARTER_LOOT_ITEMS["orc-iron-axe"], allowedClasses: ["universal"] }, quantity: 1 }], equipped: { weapon: "orc-iron-axe" } }));
assert.equal(getEquippedItems().length, 0);
const staff = createDungeonEquipment("mago", "weapon", 10, "rare");
values.set("drakoriaInventario", JSON.stringify({ items: [{ item: staff, quantity: 1 }], equipped: {} }));
values.set("drakoriaProgresso", JSON.stringify({ nivel: 9 })); assert.equal(equipItem(staff.id).equipped.weapon, undefined);
values.set("drakoriaProgresso", JSON.stringify({ nivel: 10 })); assert.equal(equipItem(staff.id).equipped.weapon, staff.id);
values.set("classeHeroi", "arqueiro"); assert.equal(getEquippedItems().length, 0);
console.log("Passed: dungeon boundaries, elite parity, 2700 items, class/level restrictions, loot weights/coverage, UI routes and saved inventory.");
