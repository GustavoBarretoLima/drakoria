import type { EquipmentItem, HeroClass } from "../types/equipment.js";
import { DUNGEON_LOOT_ITEMS } from "../loot/dungeonLoot.js";
import { STARTER_LOOT_ITEMS } from "../loot/lootTables.js";

export function canonicalEquipment(item: EquipmentItem): EquipmentItem {
  return DUNGEON_LOOT_ITEMS[item.id] ?? STARTER_LOOT_ITEMS[item.id] ?? item;
}

export function canEquipItem(item: EquipmentItem, heroClass: HeroClass, heroLevel: number): boolean {
  const canonical = canonicalEquipment(item);
  // Equipamentos antigos universais de arma/armadura não burlam a especialização.
  const universalSlot = ["ring", "earring", "necklace"].includes(canonical.slot);
  return Number.isFinite(heroLevel) && heroLevel >= canonical.level &&
    (canonical.allowedClasses.includes(heroClass) || (universalSlot && canonical.allowedClasses.includes("universal")));
}
