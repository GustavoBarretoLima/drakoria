import type { EquipmentItem } from "../types/equipment.js";

export const INSIGHT_ACCESSORY: EquipmentItem = {
  id: "orc-king-eye-of-truth", name: "Olho da Verdade",
  description: "Enquanto equipado, revela os atributos dos monstros em batalha. Drop exclusivo do Orc Rei (1%).",
  slot: "necklace", rarity: "legendary", level: 15, allowedClasses: ["universal"],
  stats: { hp: 20, mana: 20 }, icon: "/img/itens/complementares/orc-king-eye-of-truth.png", sellPrice: 1500,
  uniqueEffect: { id: "reveal-monster-stats", name: "Visão da Verdade", description: "Revela os atributos do inimigo em batalha.", trigger: "passive" },
};

export function hasMonsterInsight(equippedItems: EquipmentItem[], heroLevel: number): boolean {
  return heroLevel >= INSIGHT_ACCESSORY.level && equippedItems.some(item =>
    item.id === INSIGHT_ACCESSORY.id && item.slot === INSIGHT_ACCESSORY.slot);
}
