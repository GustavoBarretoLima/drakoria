import type { BattleEvent, CombatantState } from "../types/combat.js";
import type { ClassSkill } from "./classSkills.js";
import { normalizeTreeRanks } from "../classes/skillTrees.js";

export function hasBerserkTalent(hero: CombatantState, suffix: string): boolean {
  return hero.className === "guerreiro" && hero.subclassId === "berserker" && !!normalizeTreeRanks("berserker", hero.level ?? 1, hero.treeRanks)[`berserker-${suffix}`];
}
export function emptyBerserkState(): NonNullable<CombatantState["berserk"]> {
  return { warcry: 0, avatar: 0, blood: 0, titan: 0, stacks: 0, stackTurns: 0, retaliation: 0, retaliationCooldown: 0, deathWard: false, refusedDeath: false };
}
export function gainFury(hero: CombatantState, amount: number): void {
  if (hero.subclassId !== "berserker") return;
  const current = Number.isFinite(hero.fury) ? hero.fury! : 0;
  hero.fury = Math.round(Math.min(100, Math.max(0, current + amount * (hasBerserkTalent(hero, "instinct") ? 1.2 : 1))) * 10) / 10;
}
export function berserkDamageMultiplier(hero: CombatantState, basic = false): number {
  const buffs = hero.berserk;
  return 1 + (buffs?.avatar ? .25 : 0) + (buffs?.stackTurns ? (buffs.stacks ?? 0) * .02 : 0) + (basic && buffs?.retaliation ? .25 : 0);
}
export function berserkCriticalBonus(hero: CombatantState): number {
  return hasBerserkTalent(hero, "ecstasy") && (hero.fury ?? 0) >= 60 ? 10 : 0;
}
export function berserkSpeedMultiplier(hero: CombatantState): number {
  return 1 + (hero.berserk?.warcry ? .15 : 0) + (hero.berserk?.avatar ? .25 : 0);
}
export function healBerserkDamage(hero: CombatantState, effectiveDamage: number, area = false): number {
  if (hero.subclassId !== "berserker") return 0;
  const rate = (hasBerserkTalent(hero, "voracious") ? .03 : 0) + (hero.berserk?.blood ? .1 : 0);
  const healed = Math.min(hero.stats.maxHp - hero.stats.hp, Math.floor(effectiveDamage * rate / (area ? 3 : 1)));
  hero.stats.hp += healed;
  return healed;
}
/** Called after mitigation, for direct attacks and damage over time alike. */
export function takeBerserkDamage(hero: CombatantState, damage: number, physical: boolean, direct: boolean): number {
  if (hero.subclassId !== "berserker" || damage <= 0) return damage;
  const buffs = hero.berserk = { ...(hero.berserk ?? emptyBerserkState()) };
  const multiplier = (physical && hasBerserkTalent(hero, "iron") ? .94 : 1) * (buffs.avatar ? 1.15 : 1) * (buffs.titan ? .6 : 1) * (buffs.deathWard ? .1 : 1);
  const taken = Math.max(1, Math.floor(damage * multiplier));
  if (direct) {
    gainFury(hero, 4); // One gain per resolved enemy action, including multihit attacks.
    if (physical && hasBerserkTalent(hero, "retaliation") && !buffs.retaliationCooldown) { buffs.retaliation = 2; buffs.retaliationCooldown = 1; }
  }
  if (taken >= hero.stats.hp && !buffs.refusedDeath && hasBerserkTalent(hero, "refuse")) {
    buffs.refusedDeath = true; buffs.deathWard = true;
    return Math.max(0, hero.stats.hp - 1);
  }
  return taken;
}
/** Effects expire through accepted actions, never while the menu is open. */
export function finishBerserkAction(hero: CombatantState, before: CombatantState, skillId?: string, basicHit = false): void {
  if (hero.subclassId !== "berserker") return;
  const buffs = hero.berserk = { ...(hero.berserk ?? emptyBerserkState()) };
  const activated: Record<string, string> = { warcry: "berserker-warcry", avatar: "berserker-avatar", blood: "berserker-blood", titan: "berserker-titan" };
  for (const key of ["warcry", "avatar", "blood", "titan", "stackTurns", "retaliation", "retaliationCooldown"] as const) {
    if (activated[key] && activated[key] === skillId) continue;
    if (key === "stackTurns" && basicHit && hasBerserkTalent(hero, "crescendo")) continue;
    buffs[key] = Math.max(0, buffs[key] - 1);
  }
  if (!buffs.stackTurns) buffs.stacks = 0;
  if (before.berserk?.deathWard) buffs.deathWard = false;
}
export function onBerserkBasicHit(hero: CombatantState): void {
  gainFury(hero, 8);
  const buffs = hero.berserk ??= emptyBerserkState();
  buffs.retaliation = 0;
  if (hasBerserkTalent(hero, "crescendo")) { buffs.stacks = Math.min(5, buffs.stacks + 1); buffs.stackTurns = 2; }
}
export function tickBerserkBleed(enemy: CombatantState): string {
  const effect = enemy.berserkBleed;
  if (!effect || effect.turns <= 0) return "";
  const damage = Math.min(enemy.stats.hp, effect.damage);
  enemy.stats.hp -= damage; enemy.isAlive = enemy.stats.hp > 0;
  if (effect.turns > 1) enemy.berserkBleed = { ...effect, turns: effect.turns - 1 }; else delete enemy.berserkBleed;
  return `Sangramento causou ${damage} de dano. `;
}
interface Rolls {
  dodge: (chance: number) => boolean;
  critical: (chance: number) => boolean;
  mitigate: (damage: number, defense: number, defending: boolean) => number;
  criticalDamage: (damage: number, bonus: number) => number;
}
export function performBerserkSkill(hero: CombatantState, enemy: CombatantState, skill: ClassSkill, rolls: Rolls): BattleEvent {
  hero.fury = Math.max(0, (hero.fury ?? 0) - (skill.furyCost ?? 0));
  const buffs = hero.berserk ??= emptyBerserkState();
  let damage = 0, effectiveDamage = 0, critical = false;
  const area = ["berserker-devastating", "berserker-whirlwind"].includes(skill.id);
  for (let hit = 0; hit < skill.hits && enemy.isAlive; hit++) {
    if (rolls.dodge(enemy.stats.dodgeChance)) continue;
    const crit = rolls.critical(hero.stats.criticalChance + berserkCriticalBonus(hero));
    const execution = skill.id === "berserker-executor" && enemy.stats.hp < enemy.stats.maxHp * .3 ? 1.5 : 1;
    let dealt = rolls.mitigate(hero.stats.attack * skill.powerMultiplier * execution * berserkDamageMultiplier(hero), enemy.stats.defense, enemy.defending);
    if (crit) dealt = rolls.criticalDamage(dealt, hero.stats.criticalDamage);
    damage += dealt; effectiveDamage += Math.min(enemy.stats.hp, dealt); critical ||= crit;
    enemy.stats.hp = Math.max(0, enemy.stats.hp - dealt); enemy.isAlive = enemy.stats.hp > 0; enemy.defending = false;
  }
  let healed = healBerserkDamage(hero, effectiveDamage, area);
  if (damage > 0) {
    if (skill.id === "berserker-brutal") gainFury(hero, 12);
    if (skill.id === "berserker-charge") enemy.slowedTurns = 1;
    if (["berserker-brutal", "berserker-devastating"].includes(skill.id) && hasBerserkTalent(hero, "wound") && enemy.isAlive) {
      enemy.berserkBleed = { damage: Math.max(1, Math.floor(hero.stats.attack * .3)), turns: 2 };
    }
  }
  switch (skill.id) {
    case "berserker-warcry": gainFury(hero, 20); buffs.warcry = 2; break;
    case "berserker-blood": buffs.blood = 2; break;
    case "berserker-avatar": buffs.avatar = 3; break;
    case "berserker-titan": {
      buffs.titan = 2;
      const amount = Math.min(hero.stats.maxHp - hero.stats.hp, Math.floor(hero.stats.maxHp * .15));
      hero.stats.hp += amount; healed += amount; break;
    }
  }
  return { actorId: hero.id, targetId: skill.hits ? enemy.id : hero.id, action: skill.hits ? "ATTACK" : "DEFEND", skillId: skill.id, special: skill.name, damage, hits: skill.hits, critical, dodged: skill.hits > 0 && damage === 0,
    message: `${hero.name} usou ${skill.name}.${skill.hits ? damage ? ` Causou ${damage} de dano.` : ` ${enemy.name} esquivou.` : ""}${healed ? ` Recuperou ${healed} HP.` : ""}${enemy.berserkBleed && damage > 0 ? " Sangramento por duas ações suas." : ""}` };
}
