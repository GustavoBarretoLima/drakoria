import type { Stats } from "../types/combat.js";
import type { EquipmentItem } from "../types/equipment.js";

export function applyEquipmentStats(base: Stats, items: EquipmentItem[]): Stats {
  const stats: Stats = { ...base };

  for (const item of items) {
    const bonus = item.stats;

    if (bonus.hp) {
      stats.maxHp += bonus.hp;
      stats.hp += bonus.hp;
    }

    if (bonus.mana) {
      stats.maxMana += bonus.mana;
      stats.mana += bonus.mana;
    }

    stats.magicPower += bonus.magicPower ?? 0;
    stats.magicDefense += bonus.magicDefense ?? 0;
    stats.speed += bonus.speed ?? 0;
    stats.dodgeChance += bonus.dodgeChance ?? 0;
    stats.attack += bonus.attack ?? 0;
    stats.defense += bonus.defense ?? 0;
    stats.criticalChance += bonus.criticalChance ?? 0;
    stats.criticalDamage += bonus.criticalDamage ?? 0;
  }

  stats.dodgeChance = Number.isFinite(stats.dodgeChance) ? Math.min(50, Math.max(0, stats.dodgeChance)) : 0;
  return stats;
}
