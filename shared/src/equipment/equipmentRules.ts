import type { EquipmentItem, HeroClass } from "../types/equipment.js";
import { DUNGEON_LOOT_ITEMS } from "../loot/dungeonLoot.js";
import { STARTER_LOOT_ITEMS } from "../loot/lootTables.js";

import { generateEquipmentCatalog } from "../types/equipmentGenerator.js";

import { createBerserkAxe } from "./berserkWeapons.js";
import { createAssassinDaggers } from "./assassinWeapons.js";
import type { SubclassId } from "../classes/subclasses.js";

const GENERATED_ITEMS = new Map(generateEquipmentCatalog().map(item => [item.id, item]));

export function canonicalEquipment(item: EquipmentItem): EquipmentItem {
  if (item.id.startsWith("berserk-")) {
    const id = item.id.slice(8);
    const weapon = DUNGEON_LOOT_ITEMS[id] ?? STARTER_LOOT_ITEMS[id] ?? GENERATED_ITEMS.get(id);
    if (weapon?.slot === "weapon" && weapon.allowedClasses.includes("guerreiro")) return createBerserkAxe(weapon);
  }
  if (item.id.startsWith("assassin-")) {
    const id = item.id.slice(9);
    const bow = DUNGEON_LOOT_ITEMS[id] ?? STARTER_LOOT_ITEMS[id] ?? GENERATED_ITEMS.get(id);
    if (bow?.slot === "weapon" && bow.allowedClasses.includes("arqueiro")) return createAssassinDaggers(bow);
  }
  return DUNGEON_LOOT_ITEMS[item.id] ?? STARTER_LOOT_ITEMS[item.id] ?? GENERATED_ITEMS.get(item.id) ?? item;
}

export function canEquipItem(item: EquipmentItem, heroClass: HeroClass, heroLevel: number, subclassId?: SubclassId): boolean {
  const canonical = canonicalEquipment(item);
  if (canonical.requiredSubclass && canonical.requiredSubclass !== subclassId) return false;
  if (heroClass === "arqueiro" && subclassId === "assassin" && canonical.slot === "weapon" && canonical.requiredSubclass !== "assassin") return false;
  if (heroClass === "guerreiro" && subclassId === "berserker" && (canonical.slot === "shield" || (canonical.slot === "weapon" && canonical.weaponType !== "two-handed-axe"))) return false;
  // Equipamentos antigos universais de arma/armadura não burlam a especialização.
  const universalSlot = ["ring", "earring", "necklace"].includes(canonical.slot);
  return Number.isFinite(heroLevel) && heroLevel >= canonical.level &&
    (canonical.allowedClasses.includes(heroClass) || (universalSlot && canonical.allowedClasses.includes("universal")));
}
