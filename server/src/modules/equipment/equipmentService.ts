import type {
  EquipmentItem,
  EquipmentRarity,
  EquipmentSlot,
  HeroClass,
} from "../../../../shared/src/types/equipment.js";
import { generateEquipmentCatalog } from "../../../../shared/src/types/equipmentGenerator.js";

const EQUIPMENT_CATALOG = generateEquipmentCatalog();

export interface EquipmentFilters {
  level?: number;
  slot?: EquipmentSlot;
  rarity?: EquipmentRarity;
  heroClass?: HeroClass | "universal";
}

export function listEquipments(
  filters: EquipmentFilters = {},
): EquipmentItem[] {
  return EQUIPMENT_CATALOG.filter((item) => {
    if (filters.level !== undefined && item.level !== filters.level) {
      return false;
    }

    if (filters.slot !== undefined && item.slot !== filters.slot) {
      return false;
    }

    if (filters.rarity !== undefined && item.rarity !== filters.rarity) {
      return false;
    }

    if (filters.heroClass !== undefined) {
      const canUse =
        item.allowedClasses.includes("universal") ||
        item.allowedClasses.includes(filters.heroClass);

      if (!canUse) return false;
    }

    return true;
  });
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_CATALOG.find((item) => item.id === id);
}

export function getRandomEquipmentForLevel(
  level: number,
  heroClass: HeroClass,
): EquipmentItem {
  const candidates = listEquipments({
    level,
    heroClass,
  });

  if (candidates.length === 0) {
    throw new Error(
      `No equipment available for level ${level} and class ${heroClass}`,
    );
  }

  const index = Math.floor(Math.random() * candidates.length);
  const item = candidates[index];

  if (!item) {
    // Defensive: should not happen because we checked length, but satisfy TS
    throw new Error("Failed to select a random equipment item");
  }

  return item;
}
