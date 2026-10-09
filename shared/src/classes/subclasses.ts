import type { HeroClass, Stats } from "../types/combat.js";

export type SubclassId =
  | "paladin"
  | "berserker"
  | "swordsman"
  | "necromancer"
  | "warlock"
  | "elementalist"
  | "assassin"
  | "hunter"
  | "dark-elf";

export interface SubclassDefinition {
  id: SubclassId;
  name: string;
  baseClass: HeroClass;
  bookName: string;
  role: string;
  description: string;
  mechanics: string[];
  passiveSummary: string;
}

export const SUBCLASS_DEFINITIONS: Record<SubclassId, SubclassDefinition> = {
  paladin: {
    id: "paladin",
    name: "Paladino",
    baseClass: "guerreiro",
    bookName: "Tomo Sagrado do Paladino",
    role: "Tank, cura e proteção",
    description: "Um guerreiro sagrado que protege aliados, resiste a dano e usa cura e suporte defensivo.",
    mechanics: ["tank", "cura", "barreiras", "suporte de proteção"],
    passiveSummary: "+20% HP, +20% DEF e +15% DEF Mágica.",
  },
  berserker: {
    id: "berserker",
    name: "Berserk",
    baseClass: "guerreiro",
    bookName: "Códice da Fúria Berserk",
    role: "Dano físico puro",
    description: "Abandona a cautela para causar o maior dano físico possível.",
    mechanics: ["dano físico", "fúria", "alto risco", "execução"],
    passiveSummary: "+20% ATQ e -10% DEF. Libera Fúria e machados de duas mãos.",
  },
  swordsman: {
    id: "swordsman",
    name: "Espadachim",
    baseClass: "guerreiro",
    bookName: "Tratado do Espadachim",
    role: "Velocidade e crítico",
    description: "Especialista em sequências rápidas, precisão e golpes críticos.",
    mechanics: ["velocidade", "crítico", "combos", "contra-ataque"],
    passiveSummary: "+15% velocidade, +8% crítico e +5% esquiva.",
  },
  necromancer: {
    id: "necromancer",
    name: "Necromante",
    baseClass: "mago",
    bookName: "Grimório das Almas Mortas",
    role: "Invocação e captura de espíritos",
    description: "Pode aprisionar o espírito de monstros derrotados e evoluir sua invocação até dominar almas de bosses.",
    mechanics: ["captura de espíritos", "invocação", "almas de monstros", "bosses em níveis avançados"],
    passiveSummary: "+15% poder mágico, +15% mana e +5% DEF Mágica.",
  },
  warlock: {
    id: "warlock",
    name: "Bruxo",
    baseClass: "mago",
    bookName: "Grimório das Maldições",
    role: "Debuffs e magia sombria",
    description: "Especialista em enfraquecer inimigos com maldições e efeitos negativos.",
    mechanics: ["maldições", "redução de atributos", "dano contínuo", "controle"],
    passiveSummary: "+18% poder mágico, +10% mana e +4% crítico.",
  },
  elementalist: {
    id: "elementalist",
    name: "Elemental",
    baseClass: "mago",
    bookName: "Compêndio dos Elementos",
    role: "Magias elementais",
    description: "Manipula os elementos para adaptar seu dano e efeitos a cada combate.",
    mechanics: ["fogo", "gelo", "raio", "afinidades elementais"],
    passiveSummary: "+20% poder mágico, +10% mana e +8% velocidade.",
  },
  assassin: {
    id: "assassin",
    name: "Assassino",
    baseClass: "arqueiro",
    bookName: "Manual das Lâminas Silenciosas",
    role: "Velocidade, sangramento e crítico",
    description: "Ataca em alta velocidade, abre feridas e converte precisão em dano crítico.",
    mechanics: ["velocidade", "sangramento", "crítico", "execução"],
    passiveSummary: "+10% ATQ, +18% velocidade, +10% crítico, +15% dano crítico e +5% esquiva.",
  },
  hunter: {
    id: "hunter",
    name: "Caçador",
    baseClass: "arqueiro",
    bookName: "Bestiário do Caçador",
    role: "Falcão companheiro e controle",
    description: "Luta ao lado de um falcão e usa técnicas de caça que podem paralisar ou causar sangramento.",
    mechanics: ["falcão", "paralisia", "sangramento", "ataques coordenados"],
    passiveSummary: "+12% ATQ, +10% velocidade, +5% crítico e +5% esquiva.",
  },
  "dark-elf": {
    id: "dark-elf",
    name: "Elfo Negro",
    baseClass: "arqueiro",
    bookName: "Tomo do Elfo Negro",
    role: "Dano, crítico e efeitos negativos",
    description: "Mistura precisão, dano crítico e técnicas sombrias que enfraquecem o alvo.",
    mechanics: ["dano", "crítico", "efeitos negativos", "magia sombria"],
    passiveSummary: "+10% ATQ, +12% poder mágico, +10% velocidade, +8% crítico e +3% esquiva.",
  },
};

export const SUBCLASS_IDS = Object.keys(SUBCLASS_DEFINITIONS) as SubclassId[];

export function getSubclassDefinition(id: SubclassId): SubclassDefinition {
  return SUBCLASS_DEFINITIONS[id];
}

export function listSubclassesForClass(heroClass: HeroClass): SubclassDefinition[] {
  return SUBCLASS_IDS.map((id) => SUBCLASS_DEFINITIONS[id]).filter(
    (definition) => definition.baseClass === heroClass,
  );
}

export function isSubclassForClass(subclassId: SubclassId | undefined, heroClass: HeroClass): boolean {
  return Boolean(subclassId && SUBCLASS_DEFINITIONS[subclassId]?.baseClass === heroClass);
}

function scale(value: number, multiplier: number): number {
  return Math.max(0, Math.floor(value * multiplier));
}

export function applySubclassStats(stats: Stats, subclassId?: SubclassId): Stats {
  if (!subclassId) return { ...stats };

  const next = { ...stats };
  const oldMaxHp = next.maxHp;
  const oldMaxMana = next.maxMana;

  switch (subclassId) {
    case "paladin":
      next.maxHp = scale(next.maxHp, 1.2);
      next.defense = scale(next.defense, 1.2);
      next.magicDefense = scale(next.magicDefense, 1.15);
      break;
    case "berserker":
      next.attack = scale(next.attack, 1.2);
      next.defense = scale(next.defense, 0.9);
      break;
    case "swordsman":
      next.speed = scale(next.speed, 1.15);
      next.criticalChance += 8;
      next.dodgeChance += 5;
      break;
    case "necromancer":
      next.magicPower = scale(next.magicPower, 1.15);
      next.maxMana = scale(next.maxMana, 1.15);
      next.magicDefense = scale(next.magicDefense, 1.05);
      break;
    case "warlock":
      next.magicPower = scale(next.magicPower, 1.18);
      next.maxMana = scale(next.maxMana, 1.1);
      next.criticalChance += 4;
      break;
    case "elementalist":
      next.magicPower = scale(next.magicPower, 1.2);
      next.maxMana = scale(next.maxMana, 1.1);
      next.speed = scale(next.speed, 1.08);
      break;
    case "assassin":
      next.attack = scale(next.attack, 1.1);
      next.speed = scale(next.speed, 1.18);
      next.criticalChance += 10;
      next.criticalDamage += 15;
      next.dodgeChance += 5;
      break;
    case "hunter":
      next.attack = scale(next.attack, 1.12);
      next.speed = scale(next.speed, 1.1);
      next.criticalChance += 5;
      next.dodgeChance += 5;
      break;
    case "dark-elf":
      next.attack = scale(next.attack, 1.1);
      next.magicPower = scale(next.magicPower, 1.12);
      next.speed = scale(next.speed, 1.1);
      next.criticalChance += 8;
      next.dodgeChance += 3;
      break;
  }

  next.criticalChance = Math.min(100, Math.max(0, next.criticalChance));
  next.dodgeChance = Math.min(50, Math.max(0, next.dodgeChance));
  next.hp = stats.hp >= oldMaxHp ? next.maxHp : Math.min(next.maxHp, stats.hp);
  next.mana = stats.mana >= oldMaxMana ? next.maxMana : Math.min(next.maxMana, stats.mana);
  return next;
}
