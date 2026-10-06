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
    level: 10,
    allowedClasses: ["guerreiro"],
    stats: { attack: 18, criticalDamage: 12 },
    icon: "/img/itens/weapon.png",
    sellPrice: 75,
  },
  "orc-warlord-sword": {
    id: "orc-warlord-sword",
    name: "Espada do Senhor da Guerra",
    description: "Uma lâmina rara, pesada e marcada pelas campanhas do Senhor da Guerra.",
    slot: "weapon",
    rarity: "rare",
    level: 10,
    allowedClasses: ["guerreiro", "arqueiro"],
    stats: { attack: 15, criticalChance: 4, criticalDamage: 8 },
    icon: "/img/itens/weapon.png",
    sellPrice: 72,
  },
  "orc-warlord-staff": {
    id: "orc-warlord-staff",
    name: "Cajado Rúnico do Senhor da Guerra",
    description: "Um cajado raro saqueado pelos orcs e reforçado com runas de guerra.",
    slot: "weapon",
    rarity: "rare",
    level: 10,
    allowedClasses: ["mago"],
    stats: { attack: 12, mana: 24, criticalChance: 4 },
    icon: "/img/itens/weapon.png",
    sellPrice: 78,
  },
  "orc-warlord-chest": {
    id: "orc-warlord-chest",
    name: "Couraça do Senhor da Guerra",
    description: "Armadura reforçada usada pela elite orc.",
    slot: "armor",
    rarity: "rare",
    level: 10,
    allowedClasses: ["guerreiro", "arqueiro"],
    stats: { defense: 12, hp: 55 },
    icon: "/img/itens/armor.png",
    sellPrice: 70,
  },
  "orc-warlord-shield": {
    id: "orc-warlord-shield",
    name: "Escudo de Guerra Orc",
    description: "Um escudo grosso de ferro batido usado pela guarda pessoal do comandante.",
    slot: "shield",
    rarity: "uncommon",
    level: 8,
    allowedClasses: ["guerreiro"],
    stats: { defense: 9, hp: 30 },
    icon: "/img/itens/shield.png",
    sellPrice: 42,
  },
  "orc-warlord-ring": {
    id: "orc-warlord-ring",
    name: "Anel de Comando Orc",
    description: "Um anel de patente tomado de um oficial do clã.",
    slot: "ring",
    rarity: "uncommon",
    level: 8,
    allowedClasses: ["universal"],
    stats: { criticalChance: 2, hp: 18, mana: 8 },
    icon: "/img/itens/ring.png",
    sellPrice: 40,
  },
  "orc-warlord-gloves": {
    id: "orc-warlord-gloves",
    name: "Manoplas do Clã Orc",
    description: "Manoplas reforçadas com rebites e couro espesso.",
    slot: "gloves",
    rarity: "uncommon",
    level: 8,
    allowedClasses: ["universal"],
    stats: { defense: 5, attack: 3 },
    icon: "/img/itens/gloves.png",
    sellPrice: 38,
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
      { itemId: "orc-iron-axe", weight: 51 },
      { itemId: "orc-iron-chest", weight: 49 },
    ],
  },
  "orc-warlord-mini-boss": {
    dropChance: 0.72,
    entries: [
      { itemId: "orc-warlord-axe", weight: 10 },
      { itemId: "orc-warlord-sword", weight: 10 },
      { itemId: "orc-warlord-staff", weight: 10 },
      { itemId: "orc-warlord-chest", weight: 15 },
      { itemId: "orc-warlord-shield", weight: 20 },
      { itemId: "orc-warlord-ring", weight: 20 },
      { itemId: "orc-warlord-gloves", weight: 15 },
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
