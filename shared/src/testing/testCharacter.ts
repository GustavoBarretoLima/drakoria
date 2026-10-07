import { generateEquipmentCatalog } from "../types/equipmentGenerator.js";
import type { HeroClass } from "../types/equipment.js";

export const TEST_CHARACTER_LEVEL = 20;

export function isTestCharacter(name: unknown): boolean {
  return typeof name === "string" && name.trim().toLowerCase() === "taichou";
}

export function getTestCharacterEquipment(heroClass: HeroClass) {
  return generateEquipmentCatalog().filter(item => item.level === TEST_CHARACTER_LEVEL &&
    item.rarity === "mythic" && item.allowedClasses.length === 1 && item.allowedClasses[0] === heroClass);
}
