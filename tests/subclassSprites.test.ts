import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { SUBCLASS_SPRITE_FOLDERS } from "../shared/src/classes/subclassSprites.js";
import { SUBCLASS_DEFINITIONS, type SubclassId } from "../shared/src/classes/subclasses.js";
import { getHeroGifs } from "../client/src/assets/gifs.js";
import { SPRITE_BOUNDS } from "../client/src/assets/spriteBounds.js";
import { createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
import { createAssassinDaggers, adaptSubclassWeaponDrops } from "../shared/src/equipment/assassinWeapons.js";
import { canonicalEquipment, canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { getEquipmentById } from "../server/src/modules/equipment/equipmentService.js";
import { loadInventory, equipItem, unequipSlot, ensureAssassinEquipment } from "../client/src/inventory/inventoryClient.js";
import { useSubclassBook } from "../client/src/progression/subclassClient.js";

for (const [id, folders] of Object.entries(SUBCLASS_SPRITE_FOLDERS)) {
  const base = SUBCLASS_DEFINITIONS[id as SubclassId].baseClass;
  for (const [gender, folder] of [["Masculino", folders.masculino], ["Feminino", folders.feminino]] as const) {
    const gifs = getHeroGifs(base, gender, id);
    for (const [key, action] of [["padrao", "idle"], ["atk", "attack"], ["damage", "damage"], ["morte", "death"]] as const) {
      assert.equal(gifs[key], `/img/personagens/${folder}/${action}.gif`);
      assert.ok(existsSync(gifs[key].slice(1)));
    }
    assert.ok(SPRITE_BOUNDS[gifs.padrao.slice(1)]);
  }
}
assert.equal(getHeroGifs("guerreiro", "Masculino", "assassin").padrao, getHeroGifs("guerreiro", "Masculino").padrao);
assert.equal(getHeroGifs("arqueiro", "Masculino", "assassin").magia, "");
assert.ok(getHeroGifs("arqueiro", "Masculino", "hunter").magia);
const storage = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
const bow = createDungeonEquipment("arqueiro", "weapon", 20, "epic");
const daggers = createAssassinDaggers(bow);
assert.deepEqual(daggers.stats, bow.stats);
assert.equal(daggers.rarity, bow.rarity);
assert.equal(daggers.level, bow.level);
assert.ok(canEquipItem(daggers, "arqueiro", 20, "assassin"));
for (const subclass of [undefined, "hunter", "dark-elf"] as const) assert.equal(canEquipItem(daggers, "arqueiro", 20, subclass), false);
assert.equal(canEquipItem(bow, "arqueiro", 20, "assassin"), false);
assert.equal(canEquipItem(daggers, "arqueiro", 19, "assassin"), false);
assert.deepEqual(canonicalEquipment({ ...daggers, stats: { attack: 99999 }, level: 1 }).stats, bow.stats);
assert.deepEqual(getEquipmentById(daggers.id), daggers);
assert.equal(getEquipmentById("assassin-unknown"), undefined);
const drops = [{ item: bow, quantity: 2 }, { item: createDungeonEquipment("mago", "weapon", 20, "epic"), quantity: 1 }];
assert.deepEqual(adaptSubclassWeaponDrops(drops, "assassin"), [{ item: daggers, quantity: 2 }, drops[1]]);
assert.deepEqual(adaptSubclassWeaponDrops(drops, "hunter"), drops);
storage.set("classeHeroi", "arqueiro");
storage.set("drakoriaProgresso", JSON.stringify({ nivel: 20 }));
storage.set("drakoriaSubclassProgress", JSON.stringify({ books: { assassin: 1 } }));
storage.set("drakoriaInventario", JSON.stringify({ items: [{ item: bow, quantity: 2 }], equipped: { weapon: bow.id } }));
assert.equal(useSubclassBook("assassin", "arqueiro").used, true);
let inventory = loadInventory();
assert.equal(inventory.equipped.weapon, daggers.id);
assert.equal(inventory.items.find(entry => entry.item.id === bow.id)?.quantity, 2);
assert.equal(inventory.items.find(entry => entry.item.id === daggers.id)?.quantity, 1);
ensureAssassinEquipment(); ensureAssassinEquipment();
assert.equal(loadInventory().items.length, 2);
assert.equal(equipItem(bow.id).equipped.weapon, daggers.id);
unequipSlot("weapon"); ensureAssassinEquipment();
assert.equal(loadInventory().equipped.weapon, undefined);
assert.equal(equipItem(daggers.id).equipped.weapon, daggers.id);
// Old Assassin saves reconcile their bow once without deleting owned copies.
storage.set("drakoriaInventario", JSON.stringify({ items: [{ item: bow, quantity: 1 }], equipped: { weapon: bow.id } }));
assert.equal(loadInventory().equipped.weapon, daggers.id);
// An unarmed new Assassin gets a level-one starter, with no repeated book use.
storage.delete("drakoriaInventario");
storage.set("drakoriaSubclassProgress", JSON.stringify({ books: { assassin: 1 } }));
assert.equal(useSubclassBook("assassin", "arqueiro").used, true);
inventory = loadInventory();
assert.equal(inventory.items[0]?.item.level, 1);
assert.equal(inventory.items[0]?.item.requiredSubclass, "assassin");
assert.equal(useSubclassBook("assassin", "arqueiro").used, false);
assert.equal(loadInventory().items.length, 1);
for (const file of ["client/src/demo/demoBattle.ts", "server/src/modules/combat/battleRoom.ts"]) assert.ok(readFileSync(file, "utf8").includes("adaptSubclassWeaponDrops(rollMonsterDrops("));
console.log("Subclass animations: 18 variants/four actions, bounds, Assassin migration, retained bows, restrictions, canonical daggers and shared drops passed.");
