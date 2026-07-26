import type { HeroClass, Stats } from "../types/combat";

type BaseStats = Pick<Stats, "maxHp" | "maxMana" | "attack" | "defense">;

export const CLASS_STATS: Record<HeroClass, BaseStats> = {
  guerreiro: {
    maxHp: 120,
    maxMana: 40,
    attack: 14,
    defense: 10,
  },
  mago: {
    maxHp: 80,
    maxMana: 80,
    attack: 16,
    defense: 5,
  },
  arqueiro: {
    maxHp: 100,
    maxMana: 60,
    attack: 13,
    defense: 7,
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
  };
}
