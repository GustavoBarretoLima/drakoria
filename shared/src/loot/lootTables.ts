import type { EquipmentDrop, EquipmentItem } from "../types/equipment.js";

export const STARTER_LOOT_ITEMS: Record<string, EquipmentItem> = {
  "goblin-hide-gloves": {
    id: "goblin-hide-gloves",
    name: "Luvas de Couro Goblin",
    description: "Luvas improvisadas com couro resistente de goblins.",
    slot: "gloves",
    rarity: "common",
    level: 1,
    allowedClasses: ["universal"],
    stats: { defense: 1, criticalChance: 1 },
    icon: "/img/itens/gloves.png",
    sellPrice: 8,
  },
  "goblin-tooth-ring": {
    id: "goblin-tooth-ring",
    name: "Anel de Dente Goblin",
    description: "Um amuleto rudimentar transformado em anel.",
    slot: "ring",
    rarity: "common",
    level: 1,
    allowedClasses: ["universal"],
    stats: { criticalChance: 1, mana: 4 },
    icon: "/img/itens/ring.png",
    sellPrice: 7,
  },
  "orc-iron-axe": {
    id: "orc-iron-axe",
    name: "Machado de Ferro Orc",
    description: "Uma arma pesada, simples e brutal.",
    slot: "weapon",
    rarity: "uncommon",
    level: 1,
    allowedClasses: ["universal"],
    stats: { attack: 9 },
    icon: "/img/itens/weapon.png",
    sellPrice: 18,
  },
  "orc-iron-chest": {
    id: "orc-iron-chest",
    name: "Peitoral de Ferro Orc",
    description: "Placas grossas reaproveitadas de uma armadura orc.",
    slot: "armor",
    rarity: "uncommon",
    level: 1,
    allowedClasses: ["universal"],
    stats: { defense: 7, hp: 25 },
    icon: "/img/itens/armor.png",
    sellPrice: 22,
  },
};

const DROP_POOLS: Record<string, string[]> = {
  goblin: ["goblin-hide-gloves", "goblin-tooth-ring"],
  orc: ["orc-iron-axe", "orc-iron-chest"],
};

const DROP_CHANCE_BY_FAMILY: Record<string, number> = {
  goblin: 0.18,
  orc: 0.24,
};

export function rollMonsterDrops(monsterId: string): EquipmentDrop[] {
  const family = monsterId.split("-")[0] ?? "";
  const pool = DROP_POOLS[family];
  if (!pool || pool.length === 0) return [];

  const dropChance = DROP_CHANCE_BY_FAMILY[family] ?? 0.15;
  if (Math.random() >= dropChance) return [];

  const itemId = pool[Math.floor(Math.random() * pool.length)];
  if (!itemId) return [];

  const item = STARTER_LOOT_ITEMS[itemId];
  if (!item) return [];

  return [{ item: { ...item, stats: { ...item.stats } }, quantity: 1 }];
}
