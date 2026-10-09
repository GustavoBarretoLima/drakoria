import type { EquipmentSlot, HeroClass } from "../types/equipment.js";
export const EQUIPMENT_ART_ROOT = "/img/itens/loot_monstros/icones_128/";
/** Reuse the available class silhouette for all level/rarity variants. */
export function classEquipmentIcon(cls: HeroClass | "universal", slot: EquipmentSlot): string {
  return `${EQUIPMENT_ART_ROOT}drakoria-${cls === "universal" ? "guerreiro" : cls}-${slot}-rare-lvl-20.png`;
}
export const BERSERK_WEAPON_ICON = `${EQUIPMENT_ART_ROOT}orc-warlord-axe.png`;
export const ASSASSIN_WEAPON_ICON = `${EQUIPMENT_ART_ROOT}monster-loot-01.png`;
