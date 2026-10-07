import type { HeroClass } from "../types/combat.js";

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
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    baseClass: "guerreiro",
    bookName: "Códice da Fúria Berserker",
    role: "Dano físico puro",
    description: "Abandona a cautela para causar o maior dano físico possível.",
    mechanics: ["dano físico", "fúria", "alto risco", "execução"],
  },
  swordsman: {
    id: "swordsman",
    name: "Espadachim",
    baseClass: "guerreiro",
    bookName: "Tratado do Espadachim",
    role: "Velocidade e crítico",
    description: "Especialista em sequências rápidas, precisão e golpes críticos.",
    mechanics: ["velocidade", "crítico", "combos", "contra-ataque"],
  },
  necromancer: {
    id: "necromancer",
    name: "Necromante",
    baseClass: "mago",
    bookName: "Grimório das Almas Mortas",
    role: "Invocação e captura de espíritos",
    description: "Pode aprisionar o espírito de monstros derrotados e evoluir sua invocação até dominar almas de bosses.",
    mechanics: ["captura de espíritos", "invocação", "almas de monstros", "bosses em níveis avançados"],
  },
  warlock: {
    id: "warlock",
    name: "Bruxo",
    baseClass: "mago",
    bookName: "Grimório das Maldições",
    role: "Debuffs e magia sombria",
    description: "Especialista em enfraquecer inimigos com maldições e efeitos negativos.",
    mechanics: ["maldições", "redução de atributos", "dano contínuo", "controle"],
  },
  elementalist: {
    id: "elementalist",
    name: "Elemental",
    baseClass: "mago",
    bookName: "Compêndio dos Elementos",
    role: "Magias elementais",
    description: "Manipula os elementos para adaptar seu dano e efeitos a cada combate.",
    mechanics: ["fogo", "gelo", "raio", "afinidades elementais"],
  },
  assassin: {
    id: "assassin",
    name: "Assassino",
    baseClass: "arqueiro",
    bookName: "Manual das Lâminas Silenciosas",
    role: "Velocidade, sangramento e crítico",
    description: "Ataca em alta velocidade, abre feridas e converte precisão em dano crítico.",
    mechanics: ["velocidade", "sangramento", "crítico", "execução"],
  },
  hunter: {
    id: "hunter",
    name: "Caçador",
    baseClass: "arqueiro",
    bookName: "Bestiário do Caçador",
    role: "Falcão companheiro e controle",
    description: "Luta ao lado de um falcão e usa técnicas de caça que podem paralisar ou causar sangramento.",
    mechanics: ["falcão", "paralisia", "sangramento", "ataques coordenados"],
  },
  "dark-elf": {
    id: "dark-elf",
    name: "Elfo Negro",
    baseClass: "arqueiro",
    bookName: "Tomo do Elfo Negro",
    role: "Dano, crítico e efeitos negativos",
    description: "Mistura precisão, dano crítico e técnicas sombrias que enfraquecem o alvo.",
    mechanics: ["dano", "crítico", "efeitos negativos", "magia sombria"],
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
