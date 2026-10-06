import { INSIGHT_ACCESSORY } from "../equipment/monsterInsight.js";
import type { EquipmentDrop, EquipmentItem, EquipmentRarity, EquipmentSlot, EquipmentStats, HeroClass } from "../types/equipment.js";

export const DUNGEON_EQUIPMENT_NAMES: Record<HeroClass, Record<EquipmentSlot, string>> = {
  guerreiro: { weapon: "Espada de Ferro", armor: "Couraça de Placas", shield: "Escudo de Aço", legs: "Grevas de Placas", boots: "Botas de Ferro", gloves: "Manoplas de Aço", ring: "Anel de Vigor", earring: "Brinco de Bravura", necklace: "Medalhão do Guardião" },
  mago: { weapon: "Cajado Rúnico", armor: "Manto de Seda", shield: "Grimório Arcano", legs: "Calças de Linho", boots: "Botas de Tecido", gloves: "Luvas de Seda", ring: "Anel Arcano", earring: "Brinco de Safira", necklace: "Amuleto da Sabedoria" },
  arqueiro: { weapon: "Arco Longo", armor: "Gibão de Couro", shield: "Broquel de Couro", legs: "Calças de Couro", boots: "Botas do Batedor", gloves: "Luvas do Atirador", ring: "Anel da Precisão", earring: "Brinco do Falcão", necklace: "Pingente do Caçador" },
};

const BASE_STATS: Record<HeroClass, Record<EquipmentSlot, EquipmentStats>> = {
  guerreiro: { weapon: { attack: 5 }, armor: { defense: 4, hp: 14 }, shield: { defense: 3, hp: 8 }, legs: { defense: 2, hp: 8 }, boots: { defense: 1, hp: 5 }, gloves: { attack: 1, defense: 1 }, ring: { hp: 8, attack: 1 }, earring: { hp: 5, criticalDamage: 2 }, necklace: { hp: 10, defense: 1 } },
  mago: { weapon: { attack: 5, mana: 8 }, armor: { defense: 2, mana: 14 }, shield: { attack: 1, mana: 8 }, legs: { defense: 1, mana: 8 }, boots: { defense: 1, mana: 5 }, gloves: { attack: 1, mana: 4 }, ring: { attack: 1, mana: 8 }, earring: { mana: 6, criticalDamage: 2 }, necklace: { hp: 5, mana: 10 } },
  arqueiro: { weapon: { attack: 5, criticalDamage: 2 }, armor: { defense: 3, hp: 8 }, shield: { defense: 2, hp: 5 }, legs: { defense: 2, hp: 5 }, boots: { defense: 1, hp: 4 }, gloves: { attack: 2 }, ring: { attack: 1, hp: 5 }, earring: { hp: 5, criticalDamage: 2 }, necklace: { hp: 8, attack: 1 } },
};

const QUALITY = { common: { label: "do Recruta", power: 1 }, uncommon: { label: "do Veterano", power: 1.2 }, rare: { label: "da Elite", power: 1.5 }, epic: { label: "do Soberano", power: 1.85 } } as const;
type DungeonRarity = keyof typeof QUALITY;
export const DUNGEON_EQUIPMENT_SLOTS = Object.keys(DUNGEON_EQUIPMENT_NAMES.guerreiro) as EquipmentSlot[];
const CLASSES: HeroClass[] = ["guerreiro", "mago", "arqueiro"];

export function createDungeonEquipment(heroClass: HeroClass, slot: EquipmentSlot, level: number, rarity: DungeonRarity): EquipmentItem {
  const quality = QUALITY[rarity];
  const multiplier = (1 + (level - 1) * 0.08) * quality.power;
  const stats: EquipmentStats = {};
  for (const [key, value] of Object.entries(BASE_STATS[heroClass][slot])) {
    stats[key as keyof EquipmentStats] = Math.max(1, Math.round(value * multiplier));
  }
  return {
    id: `dungeon-${slot}-${heroClass}-${rarity}-lvl-${level}`,
    name: `${DUNGEON_EQUIPMENT_NAMES[heroClass][slot]} ${quality.label} Nv.${level}`,
    description: `${heroClass === "mago" ? "Tecido leve e instrumentos arcanos" : heroClass === "arqueiro" ? "Couro leve e equipamento de tiro" : "Aço e equipamento de combate corpo a corpo"}. Requer nível ${level}.`,
    slot, rarity, level, allowedClasses: [heroClass], stats,
    icon: `/img/itens/${slot}.svg`, sellPrice: Math.floor((8 + level * 3) * quality.power),
  };
}

export const DUNGEON_LOOT_ITEMS: Record<string, EquipmentItem> = Object.fromEntries(
  Array.from({ length: 25 }, (_, i) => i + 1).flatMap(level => CLASSES.flatMap(heroClass =>
    DUNGEON_EQUIPMENT_SLOTS.flatMap(slot => (Object.keys(QUALITY) as DungeonRarity[]).map(rarity => {
      const item = createDungeonEquipment(heroClass, slot, level, rarity);
      return [item.id, item] as const;
    })))),
);

DUNGEON_LOOT_ITEMS[INSIGHT_ACCESSORY.id] = INSIGHT_ACCESSORY;

interface DropProfile { chance: number; rarities: Array<{ rarity: DungeonRarity; weight: number }> }
export const DUNGEON_DROP_PROFILES: Record<string, DropProfile> = {
  normal: { chance: 0.35, rarities: [{ rarity: "common", weight: 70 }, { rarity: "uncommon", weight: 25 }, { rarity: "rare", weight: 5 }] },
  hobgoblin: { chance: 0.45, rarities: [{ rarity: "uncommon", weight: 75 }, { rarity: "rare", weight: 25 }] },
  elite: { chance: 0.85, rarities: [{ rarity: "rare", weight: 80 }, { rarity: "epic", weight: 20 }] },
  boss: { chance: 1, rarities: [{ rarity: "rare", weight: 40 }, { rarity: "epic", weight: 60 }] },
};

export function rollDungeonDrops(monsterId: string): EquipmentDrop[] | undefined {
  const match = /^(goblin-normal|orc-normal|skeleton-warrior-normal|mutant-rat-normal|hobgoblin-normal|hobgoblin-elite|orc-king-boss)-lvl-(\d+)$/.exec(monsterId);
  if (!match) return undefined;
  const level = Number(match[2]);
  const type = match[1]!;
  const min = type === "orc-king-boss" ? 15 : type.startsWith("hobgoblin") ? 10 : 1;
  const max = type === "orc-king-boss" ? 25 : type.startsWith("hobgoblin") ? 15 : 10;
  if (level < min || level > max) return undefined;
  const profile = DUNGEON_DROP_PROFILES[type.endsWith("boss") ? "boss" : type.endsWith("elite") ? "elite" : type.startsWith("hobgoblin") ? "hobgoblin" : "normal"]!;
  if (Math.random() >= profile.chance) return [];
  let roll = Math.random() * 100;
  let rarity: EquipmentRarity = "common";
  for (const entry of profile.rarities) {
    rarity = entry.rarity;
    roll -= entry.weight;
    if (roll < 0) break;
  }
  const slot = DUNGEON_EQUIPMENT_SLOTS[Math.floor(Math.random() * DUNGEON_EQUIPMENT_SLOTS.length)]!;
  const heroClass = CLASSES[Math.floor(Math.random() * CLASSES.length)]!;
  const item = DUNGEON_LOOT_ITEMS[`dungeon-${slot}-${heroClass}-${rarity}-lvl-${level}`]!;
  const drops: EquipmentDrop[] = [{ item: { ...item, allowedClasses: [...item.allowedClasses], stats: { ...item.stats } }, quantity: 1 }];
  if (type === "orc-king-boss" && Math.random() < 0.01) {
    drops.push({ item: { ...INSIGHT_ACCESSORY, allowedClasses: [...INSIGHT_ACCESSORY.allowedClasses], stats: { ...INSIGHT_ACCESSORY.stats }, uniqueEffect: { ...INSIGHT_ACCESSORY.uniqueEffect! } }, quantity: 1 });
  }
  return drops;
}
