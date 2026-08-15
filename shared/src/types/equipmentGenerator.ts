import type {
  EquipmentItem,
  EquipmentRarity,
  EquipmentSlot,
  HeroClass,
} from "./equipment.js";
import { EQUIPMENT_RARITY_META } from "./equipmentRarity.js";

const LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  ring: "Anel",
  weapon: "Arma",
  armor: "Armadura",
  shield: "Escudo",
  legs: "Perna",
  boots: "Bota",
  gloves: "Luva",
  earring: "Brinco",
  necklace: "Colar",
};

const RARITY_PREFIX: Record<EquipmentRarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

const CLASS_LABELS: Record<HeroClass | "universal", string> = {
  guerreiro: "do Guerreiro",
  mago: "do Mago",
  arqueiro: "do Arqueiro",
  universal: "do Aventureiro",
};

const BASE_STATS_BY_SLOT: Record<
  EquipmentSlot,
  Partial<Record<keyof EquipmentItem["stats"], number>>
> = {
  weapon: { attack: 6 },
  armor: { defense: 5, hp: 20 },
  shield: { defense: 7 },
  legs: { defense: 3, hp: 12 },
  boots: { dodgeChance: 1, defense: 2 },
  gloves: { attack: 2, criticalChance: 1 },
  ring: { mana: 10, criticalChance: 1 },
  earring: { magicPower: 3, mana: 8 },
  necklace: { hp: 15, mana: 5 },
};

const CLASS_STAT_BONUS: Record<
  HeroClass | "universal",
  Partial<Record<keyof EquipmentItem["stats"], number>>
> = {
  guerreiro: { hp: 10, defense: 2 },
  mago: { mana: 12, magicPower: 4 },
  arqueiro: { attack: 2, criticalChance: 2, dodgeChance: 1 },
  universal: {},
};

export function generateEquipmentCatalog(): EquipmentItem[] {
  const items: EquipmentItem[] = [];

  const slots = Object.keys(SLOT_LABELS) as EquipmentSlot[];
  const rarities: EquipmentRarity[] = [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
    "mythic",
  ];
  const classes: Array<HeroClass | "universal"> = [
    "universal",
    "guerreiro",
    "mago",
    "arqueiro",
  ];

  for (const level of LEVELS) {
    for (const slot of slots) {
      for (const rarity of rarities) {
        for (const heroClass of classes) {
          items.push(createEquipmentItem(level, slot, rarity, heroClass));
        }
      }
    }
  }

  items.push(...createEventItems());

  return items;
}

function createEquipmentItem(
  level: number,
  slot: EquipmentSlot,
  rarity: EquipmentRarity,
  heroClass: HeroClass | "universal",
): EquipmentItem {
  const rarityMeta = EQUIPMENT_RARITY_META[rarity];
  const levelMultiplier = level === 1 ? 1 : level / 10;
  const baseStats = BASE_STATS_BY_SLOT[slot];
  const classBonus = CLASS_STAT_BONUS[heroClass];

  const stats = scaleStats(
    mergeStats(baseStats, classBonus),
    levelMultiplier * rarityMeta.powerMultiplier,
  );

  const id = [slot, heroClass, rarity, `lvl-${level}`].join("-");

  return {
    id,
    name: `${RARITY_PREFIX[rarity]} ${SLOT_LABELS[slot]} ${CLASS_LABELS[heroClass]} Nv.${level}`,
    description: `Equipamento ${RARITY_PREFIX[rarity].toLowerCase()} de nível ${level}.`,
    slot,
    rarity,
    level,
    allowedClasses: heroClass === "universal" ? ["universal"] : [heroClass],
    stats,
    icon: `/img/itens/${slot}.png`,
    sellPrice: Math.floor(levelMultiplier * rarityMeta.powerMultiplier * 10),
  };
}

function mergeStats(
  a: Partial<Record<keyof EquipmentItem["stats"], number>>,
  b: Partial<Record<keyof EquipmentItem["stats"], number>>,
) {
  const result: Partial<Record<keyof EquipmentItem["stats"], number>> = {
    ...a,
  };

  for (const key of Object.keys(b) as Array<keyof EquipmentItem["stats"]>) {
    result[key] = (result[key] ?? 0) + (b[key] ?? 0);
  }

  return result;
}

function scaleStats(
  stats: Partial<Record<keyof EquipmentItem["stats"], number>>,
  multiplier: number,
): EquipmentItem["stats"] {
  const result: EquipmentItem["stats"] = {};

  for (const key of Object.keys(stats) as Array<keyof EquipmentItem["stats"]>) {
    result[key] = Math.max(1, Math.floor((stats[key] ?? 0) * multiplier));
  }

  return result;
}

function createEventItems(): EquipmentItem[] {
  return [
    {
      id: "weapon-universal-legendary-natal-lvl-100",
      name: "Lâmina Estelar do Natal",
      description:
        "Uma arma comemorativa lendária criada durante o Festival Invernal de Drakoria.",
      slot: "weapon",
      rarity: "legendary",
      level: 100,
      allowedClasses: ["universal"],
      eventType: "natal",
      stats: {
        attack: 180,
        criticalChance: 8,
        criticalDamage: 35,
      },
      uniqueEffect: {
        id: "natal-star-burst",
        name: "Explosão Estelar",
        description: "Ao atacar, tem chance de causar dano luminoso adicional.",
        trigger: "onAttack",
      },
      icon: "/img/itens/eventos/natal-lamina-estelar.png",
      sellPrice: 5000,
    },
    {
      id: "ring-universal-legendary-pascoa-lvl-100",
      name: "Anel Dourado da Páscoa",
      description:
        "Um anel lendário comemorativo que carrega energia de renovação.",
      slot: "ring",
      rarity: "legendary",
      level: 100,
      allowedClasses: ["universal"],
      eventType: "pascoa",
      stats: {
        hp: 250,
        mana: 150,
        dodgeChance: 6,
      },
      uniqueEffect: {
        id: "pascoa-renewal",
        name: "Renovação Primaveril",
        description:
          "Ao receber dano fatal, tem chance de restaurar parte da vida.",
        trigger: "onDamageTaken",
      },
      icon: "/img/itens/eventos/pascoa-anel-dourado.png",
      sellPrice: 5000,
    },
  ];
}
