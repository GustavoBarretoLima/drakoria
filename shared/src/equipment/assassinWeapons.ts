import type { EquipmentItem, EquipmentDrop } from "../types/equipment.js";
export function createAssassinDaggers(bow: EquipmentItem): EquipmentItem {
  return { ...bow, id: `assassin-${bow.id}`, name: `Adagas do Assassino · Nv. ${bow.level}`, description: "Adagas exclusivas de Assassino, com os mesmos bônus da arma original.", requiredSubclass: "assassin", stats: { ...bow.stats } };
}
export function adaptSubclassWeaponDrops(drops: EquipmentDrop[], subclassId?: string): EquipmentDrop[] {
  return drops.map(drop => subclassId === "assassin" && drop.item.slot === "weapon" && drop.item.allowedClasses.includes("arqueiro") && !drop.item.requiredSubclass ? { ...drop, item: createAssassinDaggers(drop.item) } : drop);
}
