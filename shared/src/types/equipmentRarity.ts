import type { EquipmentRarity } from "../types/equipment.js";

export const EQUIPMENT_RARITY_META: Record<
  EquipmentRarity,
  {
    label: string;
    color: string;
    powerMultiplier: number;
  }
> = {
  common: {
    label: "Comum",
    color: "#d9d9d9",
    powerMultiplier: 1,
  },
  uncommon: {
    label: "Incomum",
    color: "#35c759",
    powerMultiplier: 1.2,
  },
  rare: {
    label: "Raro",
    color: "#2f80ed",
    powerMultiplier: 1.5,
  },
  epic: {
    label: "Épico",
    color: "#9b51e0",
    powerMultiplier: 2,
  },
  legendary: {
    label: "Lendário",
    color: "#f2a900",
    powerMultiplier: 2.8,
  },
  mythic: {
    label: "Mítico",
    color: "#ff3131",
    powerMultiplier: 3.5,
  },
};
