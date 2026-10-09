import type { EquipmentItem, EquipmentSlot, HeroClass } from "../types/equipment.js";
import type { Stats, CombatantState } from "../types/combat.js";

export const FORGE_SET_SLOTS: EquipmentSlot[] = ["weapon", "armor", "legs", "boots", "gloves", "earring", "necklace", "ring"];
const tiers = ["rare", "epic", "legendary", "mythic"] as const;
const levels = [10, 25, 40, 55];
export const FORGE_SET_NAMES = { guerreiro: "Bastião da Forja", mago: "Chama Arcana", arqueiro: "Vento da Forja" };
export function forgeSetDescription(cls: HeroClass, rank: number): string {
  return `8 peças forjadas da mesma classe (escudo opcional). Regenera ${3 + rank}% do HP máximo ao concluir cada ação em combate. ` +
    (cls === "guerreiro" ? "+8% ataque e +10% defesa." : cls === "mago" ? "+12% poder mágico e recupera 5% da mana máxima por ação." : "+10% velocidade, +5 pontos de crítico e +3 pontos de esquiva.") +
    " Peças de qualidade superior contam; a menor qualidade define o bônus. Não acumula conjuntos.";
}
export function getForgeSet(items: EquipmentItem[], cls: HeroClass) {
  const pieces = new Map<EquipmentSlot, number>();
  for (const item of items) {
    const id = item.id.replace(/^(berserk-|assassin-)/, "");
    const rank = tiers.indexOf(item.rarity as typeof tiers[number]);
    if (rank < 0 || !FORGE_SET_SLOTS.includes(item.slot) || item.level !== levels[rank] ||
        id !== `forge-${cls}-${item.slot}-${item.rarity}-lvl-${item.level}` || !item.allowedClasses.includes(cls)) continue;
    pieces.set(item.slot, Math.max(pieces.get(item.slot) ?? -1, rank));
  }
  const count = pieces.size;
  const rank = count === 8 ? Math.min(...pieces.values()) : 0;
  return { name: FORGE_SET_NAMES[cls], count, active: count === 8, rank, description: forgeSetDescription(cls, rank) };
}
export function applyForgeSetStats(stats: Stats, items: EquipmentItem[]): Stats {
  // IDs identify the crafting family; drops and legacy shop items never count.
  for (const cls of ["guerreiro", "mago", "arqueiro"] as const) {
    const set = getForgeSet(items, cls);
    if (!set.active) continue;
    stats.forgeHpRegen = 3 + set.rank;
    if (cls === "guerreiro") { stats.attack = Math.floor(stats.attack * 1.08); stats.defense = Math.floor(stats.defense * 1.1); }
    if (cls === "mago") { stats.magicPower = Math.floor(stats.magicPower * 1.12); stats.forgeManaRegen = 5; }
    if (cls === "arqueiro") { stats.speed = Math.floor(stats.speed * 1.1); stats.criticalChance = Math.min(100, stats.criticalChance + 5); stats.dodgeChance += 3; }
    break;
  }
  return stats;
}
export function regenerateForgeSet(hero: CombatantState): string {
  if (!hero.isAlive || hero.stats.hp <= 0) return "";
  const recover = (current: number, max: number, rate = 0) => Number.isFinite(rate) && rate > 0 ? Math.max(0, Math.min(max - current, Math.floor(max * Math.min(10, rate) / 100))) : 0;
  const hp = recover(hero.stats.hp, hero.stats.maxHp, hero.stats.forgeHpRegen);
  const mana = recover(hero.stats.mana, hero.stats.maxMana, hero.stats.forgeManaRegen);
  hero.stats.hp += hp; hero.stats.mana += mana;
  return hp || mana ? ` Conjunto da forja recuperou ${hp} HP${mana ? ` e ${mana} mana` : ""}.` : "";
}
