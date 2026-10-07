import assert from "node:assert/strict";
import { isTestCharacter, getTestCharacterEquipment } from "../shared/src/testing/testCharacter.js";
import { initializeTestCharacter } from "../client/src/pages/testCharacter.js";
import { rollSubclassBookDrops } from "../shared/src/loot/subclassBooks.js";
import { loadInventory, getEquippedItems } from "../client/src/inventory/inventoryClient.js";
import { canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { BattleManager } from "../server/src/modules/combat/battleManager.js";

const saved = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) }, configurable: true });
assert.ok(isTestCharacter(" Taichou "));
assert.ok(isTestCharacter("TAICHOU"));
assert.ok(!isTestCharacter("Taichou2"));
assert.ok(!isTestCharacter(undefined));
assert.equal(initializeTestCharacter("Jogador", "guerreiro"), false);
assert.equal(saved.size, 0);
for (const heroClass of ["guerreiro", "mago", "arqueiro"] as const) {
  saved.clear(); saved.set("classeHeroi", heroClass);
  const equipment = getTestCharacterEquipment(heroClass);
  assert.equal(equipment.length, 9);
  assert.equal(new Set(equipment.map(item => item.slot)).size, 9);
  assert.ok(equipment.every(item => item.rarity === "mythic" && canEquipItem(item, heroClass, 20)));
  assert.equal(initializeTestCharacter("Taichou", heroClass), true);
  assert.equal(getEquippedItems().length, 9);
  assert.equal(JSON.parse(saved.get("drakoriaProgresso")!).nivel, 20);
  const vitals = JSON.parse(saved.get("drakoriaHeroVitals")!);
  assert.equal(vitals.hp, vitals.maxHp); assert.equal(vitals.mana, vitals.maxMana);
  initializeTestCharacter("Taichou", heroClass);
  assert.equal(loadInventory().items.reduce((sum, entry) => sum + entry.quantity, 0), 9);
}
for (const boss of ["orc-king-boss-lvl-20", "corruption-hydra-boss-lvl-10", "cursed-gravedigger-boss-lvl-10", "mutant-wolf-boss-lvl-10"]) {
  assert.equal(rollSubclassBookDrops(boss, () => 0.999999, "Taichou").length, 1);
  assert.equal(rollSubclassBookDrops(boss, () => 0.999999, "Jogador").length, 0);
  assert.equal(rollSubclassBookDrops(boss, () => 0.004, "Jogador").length, 1);
}
assert.equal(rollSubclassBookDrops("goblin-normal-lvl-1", () => 0, "Taichou").length, 0);
assert.equal(rollSubclassBookDrops("orc-warlord-mini-boss-lvl-15", () => 0, "Taichou").length, 0);
const random = Math.random;
Math.random = () => 0.999999;
try {
  const battle = new BattleManager().create("test", "guerreiro", "orc-king-boss-lvl-20", getTestCharacterEquipment("guerreiro"), 20, {}, undefined, "Taichou");
  assert.equal(battle.hero.name, "Taichou");
  assert.equal(battle.rewards?.classBooks?.length, 1);
  const normal = new BattleManager().create("normal", "guerreiro", "orc-king-boss-lvl-20");
  assert.equal(normal.rewards?.classBooks?.length, 0);
} finally { Math.random = random; }
console.log("testCharacter.test.ts: mythical sets, initialization, normal saves, boss books and server parity passed");
