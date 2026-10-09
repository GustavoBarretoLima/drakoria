import { ASSASSIN_WEAPON_ICON } from "./equipmentArtPaths.js";
import type { EquipmentItem, EquipmentDrop } from "../types/equipment.js";
export function createAssassinDaggers(bow: EquipmentItem): EquipmentItem {
  return { ...bow, icon: bow.requiredSubclass === "assassin" ? bow.icon : ASSASSIN_WEAPON_ICON, id: `assassin-${bow.id}`, name: `Adagas do Assassino · Nv. ${bow.level}`, description: "Adagas exclusivas de Assassino, com os mesmos bônus da arma original.", requiredSubclass: "assassin", stats: { ...bow.stats } };
}
import { createBerserkAxe } from "./berserkWeapons.js";
export function adaptSubclassWeaponDrops(drops: EquipmentDrop[], subclassId?: string): EquipmentDrop[] {
  return drops.map(drop => subclassId === "berserker" && drop.item.slot === "weapon" && drop.item.allowedClasses.includes("guerreiro") && !drop.item.requiredSubclass ? { ...drop, item: createBerserkAxe(drop.item) } : subclassId === "assassin" && drop.item.slot === "weapon" && drop.item.allowedClasses.includes("arqueiro") && !drop.item.requiredSubclass ? { ...drop, item: createAssassinDaggers(drop.item) } : drop);
}
