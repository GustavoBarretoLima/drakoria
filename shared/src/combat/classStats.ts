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

type LevelGrowth = Record<keyof BaseStats, number>;

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

export const CLASS_LEVEL_GROWTH: Record<HeroClass, LevelGrowth> = {
  guerreiro: {
    maxHp: 7,
    maxMana: 2,
    attack: 1.1,
    defense: 0.9,
    magicDefense: 0.45,
    speed: 0.16,
    criticalChance: 0.12,
    criticalDamage: 0.25,
  },
  mago: {
    maxHp: 4,
    maxMana: 6,
    attack: 1.25,
    defense: 0.45,
    magicDefense: 0.9,
    speed: 0.18,
    criticalChance: 0.16,
    criticalDamage: 0.35,
  },
  arqueiro: {
    maxHp: 5,
    maxMana: 3,
    attack: 1,
    defense: 0.6,
    magicDefense: 0.6,
    speed: 0.28,
    criticalChance: 0.25,
    criticalDamage: 0.4,
  },
};

export function normalizeHeroLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(100, Math.max(1, Math.floor(level)));
}

export function createInitialStats(heroClass: HeroClass): Stats {
  return createStatsForLevel(heroClass, 1);
}

export function createStatsForLevel(
  heroClass: HeroClass,
  level: number,
): Stats {
  const base = CLASS_STATS[heroClass];
  const growth = CLASS_LEVEL_GROWTH[heroClass];
  const levelsGained = normalizeHeroLevel(level) - 1;

  const scaled: BaseStats = {
    maxHp: Math.floor(base.maxHp + growth.maxHp * levelsGained),
    maxMana: Math.floor(base.maxMana + growth.maxMana * levelsGained),
    attack: Math.floor(base.attack + growth.attack * levelsGained),
    defense: Math.floor(base.defense + growth.defense * levelsGained),
    magicDefense: Math.floor(
      base.magicDefense + growth.magicDefense * levelsGained,
    ),
    speed: Math.floor(base.speed + growth.speed * levelsGained),
    criticalChance: Math.min(
      50,
      Math.floor(base.criticalChance + growth.criticalChance * levelsGained),
    ),
    criticalDamage: Math.floor(
      base.criticalDamage + growth.criticalDamage * levelsGained,
    ),
  };

  return {
    hp: scaled.maxHp,
    maxHp: scaled.maxHp,
    mana: scaled.maxMana,
    maxMana: scaled.maxMana,
    attack: scaled.attack,
    defense: scaled.defense,
    magicDefense: scaled.magicDefense,
    speed: scaled.speed,
    criticalChance: scaled.criticalChance,
    criticalDamage: scaled.criticalDamage,
  };
}
