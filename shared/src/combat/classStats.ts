import type { HeroClass, Stats } from "../types/combat";

type BaseStats = Pick<
  Stats,
  | "maxHp"
  | "maxMana"
  | "attack"
  | "defense"
  | "magicDefense"
  | "speed"
  | "criticalChance"
  | "criticalDamage"
>;

export const CLASS_STATS: Record<HeroClass, BaseStats> = {
  guerreiro: {
    maxHp: 120,
    maxMana: 40,
    attack: 14,
    defense: 10,
    magicDefense: 6,
    speed: 10,
    criticalChance: 10,
    criticalDamage: 50,
  },
  mago: {
    maxHp: 80,
    maxMana: 80,
    attack: 16,
    defense: 5,
    magicDefense: 12,
    speed: 11,
    criticalChance: 12,
    criticalDamage: 60,
  },
  arqueiro: {
    maxHp: 100,
    maxMana: 60,
    attack: 13,
    defense: 7,
    magicDefense: 8,
    speed: 14,
    criticalChance: 18,
    criticalDamage: 75,
  },
};

export function createInitialStats(heroClass: HeroClass): Stats {
  const base = CLASS_STATS[heroClass];
  return {
    hp: base.maxHp,
    maxHp: base.maxHp,
    mana: base.maxMana,
    maxMana: base.maxMana,
    attack: base.attack,
    defense: base.defense,
    magicDefense: base.magicDefense,
    speed: base.speed,
    criticalChance: base.criticalChance,
    criticalDamage: base.criticalDamage,
  };
}
