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
  "goblin-shadow-ring": {
    id: "goblin-shadow-ring",
    name: "Anel Sombrio Goblin",
    description: "Um anel raro marcado por runas primitivas.",
    slot: "ring",
    rarity: "rare",
    level: 2,
    allowedClasses: ["mago", "arqueiro"],
    stats: { mana: 10, criticalChance: 3, magicPower: 3 },
    icon: "/img/itens/ring.png",
    sellPrice: 38,
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
  "orc-warlord-axe": {
    id: "orc-warlord-axe",
    name: "Machado do Senhor da Guerra",
    description: "Uma arma rara tomada de um líder orc.",
    slot: "weapon",
    rarity: "rare",
    level: 2,
    allowedClasses: ["guerreiro"],
    stats: { attack: 14, criticalDamage: 10 },
    icon: "/img/itens/weapon.png",
    sellPrice: 55,
  },
  "orc-warlord-chest": {
    id: "orc-warlord-chest",
    name: "Couraça do Senhor da Guerra",
    description: "Armadura reforçada usada pela elite orc.",
    slot: "armor",
    rarity: "rare",
    level: 2,
    allowedClasses: ["guerreiro", "arqueiro"],
    stats: { defense: 10, hp: 40 },
    icon: "/img/itens/armor.png",
    sellPrice: 60,
  },
};

interface WeightedLootEntry {
  itemId: string;
  weight: number;
}

interface MonsterLootTable {
  dropChance: number;
  entries: WeightedLootEntry[];
}

const LOOT_TABLES: Record<string, MonsterLootTable> = {
  goblin: {
    dropChance: 0.18,
    entries: [
      { itemId: "goblin-hide-gloves", weight: 52 },
      { itemId: "goblin-tooth-ring", weight: 43 },
      { itemId: "goblin-shadow-ring", weight: 5 },
    ],
  },
  orc: {
    dropChance: 0.24,
    entries: [
      { itemId: "orc-iron-axe", weight: 48 },
      { itemId: "orc-iron-chest", weight: 47 },
      { itemId: "orc-warlord-axe", weight: 3 },
      { itemId: "orc-warlord-chest", weight: 2 },
    ],
  },
  "orc-warlord-mini-boss": {
    dropChance: 0.65,
    entries: [
      { itemId: "orc-iron-axe", weight: 25 },
      { itemId: "orc-iron-chest", weight: 25 },
      { itemId: "orc-warlord-axe", weight: 25 },
      { itemId: "orc-warlord-chest", weight: 25 },
    ],
  },
};

export function rollMonsterDrops(monsterId: string): EquipmentDrop[] {
  const family = monsterId.split("-")[0] ?? "";
  const miniBossTable = monsterId.startsWith("orc-warlord-mini-boss-lvl-")
    ? LOOT_TABLES["orc-warlord-mini-boss"]
    : undefined;
  const table = miniBossTable ?? LOOT_TABLES[monsterId] ?? LOOT_TABLES[family];
  if (!table || table.entries.length === 0) return [];
  if (Math.random() >= table.dropChance) return [];

  const itemId = pickWeightedItem(table.entries);
  const item = STARTER_LOOT_ITEMS[itemId];
  if (!item) return [];

  return [{ item: { ...item, stats: { ...item.stats } }, quantity: 1 }];
}

function pickWeightedItem(entries: WeightedLootEntry[]): string {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry.itemId;
  }

  return entries[entries.length - 1]?.itemId ?? "";
}
