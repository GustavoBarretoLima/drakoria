import type { EquipmentItem } from "../types/equipment.js";
export function createBerserkAxe(weapon: EquipmentItem): EquipmentItem {
  return { ...weapon, id: `berserk-${weapon.id}`, name: `Machado de Duas Mãos · Nv. ${weapon.level}`, description: "Machado exclusivo de Berserk. Ocupa as duas mãos e mantém os bônus da arma original.", requiredSubclass: "berserker", weaponType: "two-handed-axe", stats: { ...weapon.stats } };
}
export function hasBerserkAxe(items: EquipmentItem[]): boolean {
  return items.some(item => item.slot === "weapon" && item.requiredSubclass === "berserker" && item.weaponType === "two-handed-axe");
}
