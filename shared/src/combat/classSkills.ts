import type { CombatantState, HeroClass } from "../types/combat.js";
import { normalizeHeroLevel } from "./classStats.js";
import type { SubclassId } from "../classes/subclasses.js";
import { SUBCLASS_SKILLS, normalizeTreeRanks, normalizeBerserkLoadout } from "../classes/skillTrees.js";

export type SkillId =
  | `berserker-${string}`
  | "warrior-cleave" | "warrior-guard" | "warrior-breaker"
  | "mage-bolt" | "mage-frost" | "mage-burst"
  | "archer-aim" | "archer-pierce" | "archer-volley"
  | `${SubclassId}-${"technique" | "signature" | "ultimate"}`;

export interface ClassSkill {
  readonly id: SkillId;
  readonly name: string;
  readonly heroClass: HeroClass;
  readonly unlockLevel: number;
  readonly manaCost: number;
  readonly furyCost?: number;
  /** Number of other accepted hero actions required before reuse. */
  readonly cooldown: number;
  readonly damageType: "physical" | "magic";
  readonly powerMultiplier: number;
  readonly hits: number;
  readonly defenseMultiplier: number;
  readonly criticalBonus: number;
  readonly effect: "none" | "guard" | "resetAtb" | "heal" | "healGuard" | "drain" | "recoil" | "execute" | "bleed" | "burn" | "summon" | "weaken" | "berserk";
  readonly subclassId?: SubclassId;
  readonly description: string;
}

export const CLASS_SKILLS: readonly ClassSkill[] = [
  { id: "warrior-cleave", name: "Golpe Brutal", heroClass: "guerreiro", unlockLevel: 1,
    manaCost: 6, cooldown: 1, damageType: "physical", powerMultiplier: 1.45, hits: 1,
    defenseMultiplier: 1, criticalBonus: 0, effect: "none",
    description: "Golpe físico com 145% do ataque, além do dano base." },
  { id: "warrior-guard", name: "Golpe do Guardião", heroClass: "guerreiro", unlockLevel: 5,
    manaCost: 8, cooldown: 2, damageType: "physical", powerMultiplier: 1.1, hits: 1,
    defenseMultiplier: 1, criticalBonus: 0, effect: "guard",
    description: "Golpe com 110% do ataque e postura que reduz pela metade o próximo dano recebido, mesmo se o golpe errar." },
  { id: "warrior-breaker", name: "Rompe-armadura", heroClass: "guerreiro", unlockLevel: 10,
    manaCost: 12, cooldown: 3, damageType: "physical", powerMultiplier: 1.3, hits: 1,
    defenseMultiplier: 0.5, criticalBonus: 0, effect: "none",
    description: "Golpe com 130% do ataque que ignora metade da defesa física." },
  { id: "mage-bolt", name: "Projétil Arcano", heroClass: "mago", unlockLevel: 1,
    manaCost: 10, cooldown: 1, damageType: "magic", powerMultiplier: 1.35, hits: 1,
    defenseMultiplier: 1, criticalBonus: 0, effect: "none",
    description: "Magia com 135% do poder mágico, além do dano base." },
  { id: "mage-frost", name: "Pulso Gélido", heroClass: "mago", unlockLevel: 5,
    manaCost: 14, cooldown: 2, damageType: "magic", powerMultiplier: 1.15, hits: 1,
    defenseMultiplier: 1, criticalBonus: 0, effect: "resetAtb",
    description: "Magia com 115% do poder mágico. Ao acertar, zera o ATB inimigo e atrasa sua próxima ação." },
  { id: "mage-burst", name: "Explosão Arcana", heroClass: "mago", unlockLevel: 10,
    manaCost: 24, cooldown: 3, damageType: "magic", powerMultiplier: 1.85, hits: 1,
    defenseMultiplier: 1, criticalBonus: 0, effect: "none",
    description: "Magia com 185% do poder mágico. Alto custo de mana e recuperação longa." },
  { id: "archer-aim", name: "Tiro Preciso", heroClass: "arqueiro", unlockLevel: 1,
    manaCost: 6, cooldown: 1, damageType: "physical", powerMultiplier: 1.2, hits: 1,
    defenseMultiplier: 1, criticalBonus: 20, effect: "none",
    description: "Tiro com 120% do ataque e +20 pontos percentuais de chance crítica." },
  { id: "archer-pierce", name: "Flecha Perfurante", heroClass: "arqueiro", unlockLevel: 5,
    manaCost: 10, cooldown: 2, damageType: "physical", powerMultiplier: 1.35, hits: 1,
    defenseMultiplier: 0.5, criticalBonus: 0, effect: "none",
    description: "Tiro com 135% do ataque que ignora metade da defesa física." },
  { id: "archer-volley", name: "Disparo Duplo", heroClass: "arqueiro", unlockLevel: 10,
    manaCost: 14, cooldown: 3, damageType: "physical", powerMultiplier: 0.85, hits: 2,
    defenseMultiplier: 1, criticalBonus: 0, effect: "none",
    description: "Dois tiros com 85% do ataque cada. Cada tiro rola esquiva e crítico separadamente." },
];

export function getClassSkills(heroClass: HeroClass): readonly ClassSkill[] {
  return CLASS_SKILLS.filter(skill => skill.heroClass === heroClass);
}

export function getSkill(id: string): ClassSkill | undefined {
  return [...CLASS_SKILLS, ...SUBCLASS_SKILLS].find(skill => skill.id === id);
}

// Listing learned/equipped skills only needs the build, so the status page can
// use the same rules without inventing battle resources or casting a fake hero.
export type HeroSkillBuild = Pick<CombatantState, "className" | "level" | "subclassId" | "treeRanks" | "equippedSkills">;

export function getHeroSkills(hero: HeroSkillBuild): readonly ClassSkill[] {
  const ranks = normalizeTreeRanks(hero.subclassId, hero.level ?? 1, hero.treeRanks);
  if (hero.subclassId === "berserker" && hero.className === "guerreiro") {
    const equipped = normalizeBerserkLoadout(hero.level ?? 1, ranks, hero.equippedSkills);
    return SUBCLASS_SKILLS.filter(skill => skill.subclassId === "berserker" && equipped.includes(skill.id));
  }
  const skills = [...CLASS_SKILLS.filter(skill => skill.heroClass === hero.className), ...SUBCLASS_SKILLS.filter(skill => skill.subclassId === hero.subclassId && skill.heroClass === hero.className && (ranks[skill.id] ?? 0) > 0)];
  return skills.map(skill => skill.subclassId ? { ...skill, powerMultiplier: skill.powerMultiplier + Math.max(0, (ranks[skill.id] ?? 1) - 1) * 0.1 } : skill);
}

export function getSkillCooldown(hero: CombatantState, id: SkillId): number {
  const value = hero.skillCooldowns?.[id] ?? 0;
  return Number.isFinite(value) ? Math.max(0, Math.ceil(value)) : 0;
}

/** Shared by the UI and engine; the server never trusts client costs or effects. */
export function getSkillBlockReason(hero: CombatantState, skill: ClassSkill): string | null {
  if ((hero.skillLockedTurns ?? 0) > 0) return `Quebra-osso: habilidades bloqueadas por ${hero.skillLockedTurns} ação(ões)`;
  if (hero.className !== skill.heroClass) return "Habilidade de outra classe";
  if (skill.subclassId && (hero.subclassId !== skill.subclassId || !normalizeTreeRanks(hero.subclassId, hero.level ?? 1, hero.treeRanks)[skill.id])) return "Habilidade não aprendida na árvore";
  if (normalizeHeroLevel(hero.level ?? 1) < skill.unlockLevel) return `Desbloqueia no nível ${skill.unlockLevel}`;
  if (hero.subclassId === "berserker") {
    if (skill.subclassId !== "berserker") return "Berserk usa as habilidades de sua árvore";
    if (!hero.hasTwoHandedAxe) return "Equipe um machado de duas mãos";
    if (!normalizeBerserkLoadout(hero.level ?? 1, hero.treeRanks, hero.equippedSkills).includes(skill.id)) return "Habilidade fora dos quatro espaços";
    if ((hero.fury ?? 0) < (skill.furyCost ?? 0)) return "Fúria insuficiente";
  }
  const cooldown = getSkillCooldown(hero, skill.id);
  if (cooldown > 0) return `Recuperação: ${cooldown} ação(ões)`;
  if (!Number.isFinite(hero.stats.mana) || hero.stats.mana < skill.manaCost) return "Mana insuficiente";
  return null;
}
