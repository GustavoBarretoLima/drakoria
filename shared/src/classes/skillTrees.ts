import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS, type SubclassId } from "./subclasses.js";
import type { ClassSkill } from "../combat/classSkills.js";
import type { Stats } from "../types/combat.js";
import { normalizeHeroLevel } from "../combat/classStats.js";

export type TreeRanks = Record<string, number>;
export interface TalentNode {
  id: string; name: string; description: string; maxRank: number; level: number;
  requires: Array<{ id: string; rank: number }>;
  bonus?: Partial<Record<keyof Stats, number>>;
  skill?: ClassSkill;
}
type Profile = { talents: [string, keyof Stats, number][]; skills: [string, string, ClassSkill["effect"], number, number, number][] };
const STAT_NAMES: Partial<Record<keyof Stats, string>> = { maxHp: "vida máxima", maxMana: "mana máxima", attack: "ataque", defense: "defesa", magicDefense: "defesa mágica", magicPower: "poder mágico", speed: "velocidade", criticalChance: "chance crítica", criticalDamage: "dano crítico", dodgeChance: "esquiva" };
const PROFILES: Record<SubclassId, Profile> = {
  paladin: { talents: [["Vitalidade Sagrada", "maxHp", 3], ["Armadura da Fé", "defense", 3], ["Égide Divina", "magicDefense", 3]], skills: [["Luz Restauradora", "Cura 20% da vida máxima (+3% por rank adicional).", "heal", 0, 12, 2], ["Golpe Consagrado", "Ataque físico e postura defensiva.", "guard", 1.3, 12, 2], ["Santuário", "Cura 35% da vida máxima (+3% por rank adicional) e assume postura defensiva.", "healGuard", 0, 24, 4]] },
  berserker: { talents: [["Força Indomável", "attack", 3], ["Sede de Combate", "criticalChance", 1], ["Fúria Implacável", "criticalDamage", 3]], skills: [["Golpe Temerário", "Ataque poderoso; sacrifica 5% da vida máxima, sem se matar.", "recoil", 1.65, 8, 1], ["Dilacerar", "Abre uma ferida que causa dano por três turnos inimigos.", "bleed", 1.25, 12, 3], ["Execução Furiosa", "Causa 30% mais dano contra alvos com até 30% de vida.", "execute", 2.1, 22, 4]] },
  swordsman: { talents: [["Ritmo da Lâmina", "speed", 2], ["Precisão do Duelista", "criticalChance", 1], ["Passo Evasivo", "dodgeChance", 1]], skills: [["Corte Duplo", "Dois cortes; cada golpe rola esquiva e crítico.", "none", 0.8, 8, 2], ["Riposta", "Ataca e assume postura defensiva para receber o próximo golpe.", "guard", 1.35, 12, 2], ["Dança das Espadas", "Três cortes rápidos com rolagens independentes.", "none", 0.85, 22, 4]] },
  necromancer: { talents: [["Domínio das Almas", "magicPower", 3], ["Reservatório Espiritual", "maxMana", 3], ["Véu dos Mortos", "magicDefense", 3]], skills: [["Drenar Vida", "Recupera 25% do dano causado como vida.", "drain", 1.25, 12, 2], ["Invocar Espírito", "O espírito ataca por três turnos inimigos; não captura almas permanentemente.", "summon", 0.9, 18, 3], ["Legião Espectral", "Invocação mais forte que ataca por três turnos inimigos.", "summon", 1.8, 28, 4]] },
  warlock: { talents: [["Pacto Sombrio", "magicPower", 3], ["Vigor do Pacto", "maxMana", 3], ["Olhar Maldito", "criticalChance", 1]], skills: [["Maldição da Fraqueza", "Ao acertar, reduz em 20% o dano direto inimigo por três turnos.", "weaken", 1.1, 12, 3], ["Chama Profana", "Aplica dano contínuo por três turnos inimigos.", "burn", 1.2, 16, 3], ["Colheita Sombria", "Recupera 25% do dano causado como vida.", "drain", 2, 26, 4]] },
  elementalist: { talents: [["Afinidade Elemental", "magicPower", 3], ["Fluxo Arcano", "maxMana", 3], ["Condutor de Raios", "speed", 2]], skills: [["Incendiar", "Aplica queimadura por três turnos inimigos.", "burn", 1.25, 12, 3], ["Prisão de Gelo", "Ao acertar, zera o ATB inimigo.", "resetAtb", 1.3, 16, 3], ["Tempestade Elemental", "Dois impactos mágicos com rolagens independentes.", "none", 1.2, 28, 4]] },
  assassin: { talents: [["Passos Silenciosos", "speed", 2], ["Ponto Vital", "criticalChance", 1], ["Lâmina Letal", "criticalDamage", 3]], skills: [["Corte Sangrento", "Aplica sangramento por três turnos inimigos.", "bleed", 1.25, 10, 3], ["Ataque das Sombras", "Golpe com +30 pontos percentuais de chance crítica.", "none", 1.4, 14, 2], ["Finalizar", "Causa 30% mais dano contra alvos com até 30% de vida.", "execute", 2, 24, 4]] },
  hunter: { talents: [["Olho de Águia", "attack", 3], ["Reflexos da Caça", "dodgeChance", 1], ["Passo do Rastreador", "speed", 2]], skills: [["Investida do Falcão", "O falcão ataca por três turnos inimigos.", "summon", 1.1, 10, 3], ["Armadilha de Contenção", "Ao acertar, zera o ATB inimigo.", "resetAtb", 1, 14, 3], ["Caçada Coordenada", "Dois tiros e ataques do falcão por três turnos inimigos.", "summon", 1, 24, 4]] },
  "dark-elf": { talents: [["Precisão Noturna", "criticalChance", 1], ["Poder do Eclipse", "magicPower", 3], ["Arsenal Sombrio", "attack", 3]], skills: [["Flecha Maldita", "Ao acertar, reduz em 20% o dano direto inimigo por três turnos.", "weaken", 1.25, 10, 3], ["Sifão do Crepúsculo", "Magia que recupera 25% do dano causado como vida.", "drain", 1.45, 16, 3], ["Eclipse", "Dois impactos mágicos com rolagens independentes.", "none", 1.25, 26, 4]] },
};

export const SUBCLASS_TREES: Record<SubclassId, TalentNode[]> = Object.fromEntries(SUBCLASS_IDS.map(id => {
  const profile = PROFILES[id];
  const names = ["foundation", "technique", "discipline", "signature", "mastery", "ultimate"];
  const levels = [1, 5, 5, 10, 10, 20];
  const requirements = [[], [[0, 1]], [[0, 2]], [[1, 2]], [[2, 3]], [[3, 2], [4, 2]]] as number[][][];
  const nodes = names.map((suffix, index): TalentNode => {
    const active = index % 2 === 1;
    const nodeId = `${id}-${suffix}`;
    const requires = requirements[index]!.map(([parent, rank]) => ({ id: `${id}-${names[parent!]}`, rank: rank! }));
    if (!active) {
      const [name, stat, amount] = profile.talents[index / 2]!;
      const flat = ["criticalChance", "criticalDamage", "dodgeChance"].includes(stat);
      return { id: nodeId, name, level: levels[index]!, maxRank: 5, requires, bonus: { [stat]: amount }, description: `+${amount}${flat ? " pontos percentuais" : "%"} de ${STAT_NAMES[stat] ?? stat} por ponto.` };
    }
    const [name, description, effect, powerMultiplier, manaCost, cooldown] = profile.skills[(index - 1) / 2]!;
    const magic = SUBCLASS_DEFINITIONS[id].baseClass === "mago" || (id === "dark-elf" && index > 1);
    const hits = (id === "swordsman" && index !== 3) ? index === 5 ? 3 : 2 : index === 5 && ["hunter", "elementalist", "dark-elf"].includes(id) ? 2 : effect === "heal" || effect === "healGuard" ? 0 : 1;
    const skill: ClassSkill = { id: nodeId as ClassSkill["id"], subclassId: id, heroClass: SUBCLASS_DEFINITIONS[id].baseClass,
      name, description: `${description} ${hits === 0 ? "Ranks extras aumentam a cura." : "Ranks extras aumentam o multiplicador em 0,1."}`, damageType: magic ? "magic" : "physical", unlockLevel: levels[index]!, manaCost, cooldown,
      effect, powerMultiplier, hits, defenseMultiplier: 1, criticalBonus: id === "assassin" && index === 3 ? 30 : 0 };
    return { id: nodeId, name, description: skill.description, level: levels[index]!, maxRank: 3, requires, skill };
  });
  return [id, nodes];
})) as Record<SubclassId, TalentNode[]>;

export const SUBCLASS_SKILLS = SUBCLASS_IDS.flatMap(id => SUBCLASS_TREES[id].flatMap(node => node.skill ? [node.skill] : []));
export function earnedTreePoints(level: number): number { return normalizeHeroLevel(level) - 1; }
export function spentTreePoints(ranks: TreeRanks): number { return Object.values(ranks).reduce((sum, rank) => sum + rank, 0); }

/** Rebuilds a valid allocation; unknown nodes, unmet prerequisites and overspending never grant power. */
export function normalizeTreeRanks(id: SubclassId | undefined, level: number, raw: unknown): TreeRanks {
  if (!id || !SUBCLASS_TREES[id] || !raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: TreeRanks = {};
  for (const node of SUBCLASS_TREES[id]) {
    const rank = (raw as TreeRanks)[node.id];
    if (typeof rank !== "number" || !Number.isInteger(rank) || rank <= 0 || rank > node.maxRank || normalizeHeroLevel(level) < node.level) continue;
    if (node.requires.some(req => (result[req.id] ?? 0) < req.rank)) continue;
    result[node.id] = rank;
  }
  return spentTreePoints(result) <= earnedTreePoints(level) ? result : {};
}

export function treeBlockReason(id: SubclassId, level: number, ranks: TreeRanks, node: TalentNode): string | null {
  if (!SUBCLASS_TREES[id]?.some(candidate => candidate.id === node.id)) return "Talento de outra subclasse";
  if ((ranks[node.id] ?? 0) >= node.maxRank) return "Rank máximo";
  if (normalizeHeroLevel(level) < node.level) return `Requer nível ${node.level}`;
  const missing = node.requires.find(req => (ranks[req.id] ?? 0) < req.rank);
  if (missing) return `Requer ${SUBCLASS_TREES[id].find(candidate => candidate.id === missing.id)?.name}: rank ${missing.rank}`;
  if (spentTreePoints(ranks) >= earnedTreePoints(level)) return "Sem pontos disponíveis";
  return null;
}

export function applyTreeStats(stats: Stats, id: SubclassId | undefined, level: number, raw: unknown): Stats {
  const next = { ...stats };
  const ranks = normalizeTreeRanks(id, level, raw);
  for (const node of id ? SUBCLASS_TREES[id] ?? [] : []) {
    for (const [key, amount] of Object.entries(node.bonus ?? {})) {
      const stat = key as keyof Stats;
      const bonus = amount * (ranks[node.id] ?? 0);
      next[stat] += ["criticalChance", "criticalDamage", "dodgeChance"].includes(stat) ? bonus : Math.floor(stats[stat] * bonus / 100);
    }
  }
  next.criticalChance = Math.min(100, Math.max(0, next.criticalChance));
  next.dodgeChance = Math.min(50, Math.max(0, next.dodgeChance));
  next.hp = stats.hp >= stats.maxHp ? next.maxHp : Math.min(next.maxHp, stats.hp);
  next.mana = stats.mana >= stats.maxMana ? next.maxMana : Math.min(next.maxMana, stats.mana);
  return next;
}
