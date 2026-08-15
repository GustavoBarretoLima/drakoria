import type {
  MonsterDefinition,
  MonsterElement,
  MonsterFamily,
  MonsterRank,
  MonsterSkill,
  MonsterStats,
} from "../../../../shared/src/types/monster.js";
import {
  MONSTER_FAMILY_LABELS,
  MONSTER_RANK_META,
} from "../../../../shared/src/constants/monsterMeta.js";

const LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

interface MonsterArchetype {
  family: MonsterFamily;
  baseName: string;
  description: string;
  element: MonsterElement;
  baseStats: {
    hp: number;
    mana: number;
    attack: number;
    defense: number;
    magicPower: number;
    criticalChance: number;
    criticalDamage: number;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
    type: "physical" | "magic" | "special";
    element: MonsterElement;
    power: number;
    cooldown: number;
  }>;
  spriteBasePath: string;
}

const ARCHETYPES: MonsterArchetype[] = [
  {
    family: "goblin",
    baseName: "Goblin",
    description:
      "Criatura traiçoeira, rápida e comum nas estradas de Drakoria.",
    element: "physical",
    baseStats: {
      hp: 60,
      mana: 0,
      attack: 8,
      defense: 3,
      magicPower: 0,
      criticalChance: 5,
      criticalDamage: 50,
    },
    skills: [
      {
        id: "goblin-stab",
        name: "Facada Rápida",
        description: "Um golpe simples e veloz com uma lâmina curta.",
        type: "physical",
        element: "physical",
        power: 8,
        cooldown: 0,
      },
    ],
    spriteBasePath: "/img/monstros/goblin",
  },
  {
    family: "orc",
    baseName: "Orc",
    description: "Guerreiro brutal que usa força bruta para esmagar inimigos.",
    element: "physical",
    baseStats: {
      hp: 95,
      mana: 0,
      attack: 14,
      defense: 6,
      magicPower: 0,
      criticalChance: 6,
      criticalDamage: 60,
    },
    skills: [
      {
        id: "orc-smash",
        name: "Esmagamento",
        description: "Um ataque pesado capaz de quebrar armaduras.",
        type: "physical",
        element: "physical",
        power: 14,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/orc",
  },
  {
    family: "undead",
    baseName: "Esqueleto",
    description:
      "Restos animados por magia sombria, persistentes e silenciosos.",
    element: "shadow",
    baseStats: {
      hp: 80,
      mana: 20,
      attack: 10,
      defense: 5,
      magicPower: 4,
      criticalChance: 4,
      criticalDamage: 50,
    },
    skills: [
      {
        id: "undead-bone-cut",
        name: "Corte Ósseo",
        description: "Um golpe seco com ossos afiados.",
        type: "physical",
        element: "shadow",
        power: 11,
        cooldown: 0,
      },
    ],
    spriteBasePath: "/img/monstros/esqueleto",
  },
  {
    family: "beast",
    baseName: "Lobo Sombrio",
    description: "Fera veloz que caça em meio às florestas negras.",
    element: "physical",
    baseStats: {
      hp: 85,
      mana: 0,
      attack: 13,
      defense: 4,
      magicPower: 0,
      criticalChance: 10,
      criticalDamage: 65,
    },
    skills: [
      {
        id: "beast-bite",
        name: "Mordida Selvagem",
        description: "Uma mordida feroz com chance de ferimento grave.",
        type: "physical",
        element: "physical",
        power: 13,
        cooldown: 0,
      },
    ],
    spriteBasePath: "/img/monstros/lobo-sombrio",
  },
  {
    family: "demon",
    baseName: "Demônio Menor",
    description: "Entidade infernal que canaliza fogo e ódio.",
    element: "fire",
    baseStats: {
      hp: 110,
      mana: 60,
      attack: 12,
      defense: 6,
      magicPower: 14,
      criticalChance: 7,
      criticalDamage: 70,
    },
    skills: [
      {
        id: "demon-flame",
        name: "Chama Infernal",
        description: "Uma labareda sombria que consome o alvo.",
        type: "magic",
        element: "fire",
        power: 18,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/demonio-menor",
  },
  {
    family: "dragon",
    baseName: "Draco Jovem",
    description: "Dragão jovem, ainda pequeno, mas extremamente perigoso.",
    element: "fire",
    baseStats: {
      hp: 180,
      mana: 80,
      attack: 20,
      defense: 12,
      magicPower: 18,
      criticalChance: 8,
      criticalDamage: 80,
    },
    skills: [
      {
        id: "dragon-breath",
        name: "Sopro Flamejante",
        description: "Um sopro de fogo ancestral.",
        type: "magic",
        element: "fire",
        power: 25,
        cooldown: 3,
      },
    ],
    spriteBasePath: "/img/monstros/draco-jovem",
  },
  {
    family: "elemental",
    baseName: "Elemental de Fogo",
    description: "Manifestação viva das chamas, instável e destrutiva.",
    element: "fire",
    baseStats: {
      hp: 100,
      mana: 100,
      attack: 8,
      defense: 5,
      magicPower: 20,
      criticalChance: 5,
      criticalDamage: 65,
    },
    skills: [
      {
        id: "elemental-fireball",
        name: "Bola de Fogo",
        description: "Dispara uma esfera ardente contra o alvo.",
        type: "magic",
        element: "fire",
        power: 20,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/elemental-fogo",
  },
  {
    family: "slime",
    baseName: "Slime",
    description:
      "Criatura gelatinosa simples, mas resistente a impactos leves.",
    element: "poison",
    baseStats: {
      hp: 70,
      mana: 10,
      attack: 6,
      defense: 6,
      magicPower: 3,
      criticalChance: 2,
      criticalDamage: 40,
    },
    skills: [
      {
        id: "slime-acid",
        name: "Ácido Fraco",
        description: "Cospe uma pequena quantidade de ácido corrosivo.",
        type: "special",
        element: "poison",
        power: 8,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/slime",
  },
  {
    family: "spider",
    baseName: "Aranha Gigante",
    description: "Predadora venenosa que habita cavernas úmidas.",
    element: "poison",
    baseStats: {
      hp: 90,
      mana: 20,
      attack: 11,
      defense: 4,
      magicPower: 5,
      criticalChance: 9,
      criticalDamage: 60,
    },
    skills: [
      {
        id: "spider-venom",
        name: "Picada Venenosa",
        description: "Uma picada que injeta veneno no alvo.",
        type: "special",
        element: "poison",
        power: 12,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/aranha-gigante",
  },
  {
    family: "troll",
    baseName: "Troll das Pedras",
    description: "Monstro enorme de pele grossa e força devastadora.",
    element: "earth",
    baseStats: {
      hp: 170,
      mana: 0,
      attack: 18,
      defense: 14,
      magicPower: 0,
      criticalChance: 4,
      criticalDamage: 70,
    },
    skills: [
      {
        id: "troll-crush",
        name: "Golpe Esmagador",
        description: "Um ataque lento e brutal.",
        type: "physical",
        element: "earth",
        power: 22,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/troll-pedras",
  },
  {
    family: "construct",
    baseName: "Golem Antigo",
    description: "Construto mágico criado para proteger ruínas esquecidas.",
    element: "earth",
    baseStats: {
      hp: 200,
      mana: 40,
      attack: 16,
      defense: 18,
      magicPower: 8,
      criticalChance: 3,
      criticalDamage: 60,
    },
    skills: [
      {
        id: "golem-quake",
        name: "Tremor",
        description: "Faz o chão tremer com força arcana.",
        type: "special",
        element: "earth",
        power: 20,
        cooldown: 3,
      },
    ],
    spriteBasePath: "/img/monstros/golem-antigo",
  },
  {
    family: "cultist",
    baseName: "Cultista Sombrio",
    description: "Servo de entidades proibidas, usa magia das trevas.",
    element: "shadow",
    baseStats: {
      hp: 85,
      mana: 100,
      attack: 7,
      defense: 4,
      magicPower: 18,
      criticalChance: 6,
      criticalDamage: 65,
    },
    skills: [
      {
        id: "cultist-curse",
        name: "Maldição Sombria",
        description: "Invoca uma maldição contra o alvo.",
        type: "magic",
        element: "shadow",
        power: 18,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/cultista-sombrio",
  },
  {
    family: "reptile",
    baseName: "Homem-Lagarto",
    description: "Guerreiro reptiliano de pântanos e ruínas alagadas.",
    element: "water",
    baseStats: {
      hp: 115,
      mana: 20,
      attack: 13,
      defense: 8,
      magicPower: 3,
      criticalChance: 6,
      criticalDamage: 55,
    },
    skills: [
      {
        id: "reptile-spear",
        name: "Estocada de Lança",
        description: "Um ataque preciso com lança tribal.",
        type: "physical",
        element: "physical",
        power: 14,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/homem-lagarto",
  },
  {
    family: "plant",
    baseName: "Mandrágora",
    description: "Planta mágica hostil que drena energia vital.",
    element: "earth",
    baseStats: {
      hp: 95,
      mana: 70,
      attack: 7,
      defense: 7,
      magicPower: 13,
      criticalChance: 4,
      criticalDamage: 50,
    },
    skills: [
      {
        id: "plant-root",
        name: "Raízes Prendentes",
        description: "Raízes mágicas atacam o alvo.",
        type: "magic",
        element: "earth",
        power: 14,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/mandragora",
  },
  {
    family: "spirit",
    baseName: "Espírito Errante",
    description: "Alma perdida que vaga entre o mundo físico e espiritual.",
    element: "shadow",
    baseStats: {
      hp: 75,
      mana: 90,
      attack: 5,
      defense: 3,
      magicPower: 17,
      criticalChance: 8,
      criticalDamage: 70,
    },
    skills: [
      {
        id: "spirit-drain",
        name: "Dreno Espiritual",
        description: "Drena energia vital do alvo.",
        type: "magic",
        element: "shadow",
        power: 17,
        cooldown: 2,
      },
    ],
    spriteBasePath: "/img/monstros/espirito-errante",
  },
  {
    family: "insect",
    baseName: "Besouro de Carapaça",
    description: "Inseto gigante protegido por uma carapaça resistente.",
    element: "earth",
    baseStats: {
      hp: 120,
      mana: 0,
      attack: 10,
      defense: 14,
      magicPower: 0,
      criticalChance: 3,
      criticalDamage: 45,
    },
    skills: [
      {
        id: "insect-charge",
        name: "Investida",
        description: "Avança com a carapaça contra o alvo.",
        type: "physical",
        element: "physical",
        power: 13,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/besouro-carapaca",
  },
  {
    family: "aquatic",
    baseName: "Serpente Aquática",
    description: "Criatura veloz que emerge de rios e lagos escuros.",
    element: "water",
    baseStats: {
      hp: 100,
      mana: 50,
      attack: 12,
      defense: 5,
      magicPower: 10,
      criticalChance: 7,
      criticalDamage: 60,
    },
    skills: [
      {
        id: "aquatic-water-whip",
        name: "Chicote d'Água",
        description: "Um golpe mágico feito de água pressurizada.",
        type: "magic",
        element: "water",
        power: 14,
        cooldown: 1,
      },
    ],
    spriteBasePath: "/img/monstros/serpente-aquatica",
  },
  {
    family: "giant",
    baseName: "Gigante das Colinas",
    description: "Ser colossal, lento, mas capaz de destruir muralhas.",
    element: "earth",
    baseStats: {
      hp: 260,
      mana: 0,
      attack: 26,
      defense: 18,
      magicPower: 0,
      criticalChance: 4,
      criticalDamage: 90,
    },
    skills: [
      {
        id: "giant-stomp",
        name: "Pisada Sísmica",
        description: "Uma pisada devastadora que abala o campo de batalha.",
        type: "physical",
        element: "earth",
        power: 28,
        cooldown: 3,
      },
    ],
    spriteBasePath: "/img/monstros/gigante-colinas",
  },
  {
    family: "void",
    baseName: "Devorador do Vazio",
    description: "Criatura anômala vinda de uma dimensão desconhecida.",
    element: "void",
    baseStats: {
      hp: 220,
      mana: 150,
      attack: 18,
      defense: 12,
      magicPower: 28,
      criticalChance: 10,
      criticalDamage: 100,
    },
    skills: [
      {
        id: "void-rift",
        name: "Fenda do Vazio",
        description: "Rasga o espaço e causa dano instável.",
        type: "magic",
        element: "void",
        power: 30,
        cooldown: 3,
      },
    ],
    spriteBasePath: "/img/monstros/devorador-vazio",
  },
];

const RANKS_BY_LEVEL: Array<{
  minLevel: number;
  ranks: MonsterRank[];
}> = [
  { minLevel: 1, ranks: ["minion", "normal"] },
  { minLevel: 20, ranks: ["normal", "elite"] },
  { minLevel: 40, ranks: ["normal", "elite", "champion"] },
  { minLevel: 60, ranks: ["elite", "champion", "boss"] },
  { minLevel: 80, ranks: ["champion", "boss"] },
  { minLevel: 100, ranks: ["boss", "world-boss"] },
];

export function generateMonsterCatalog(): MonsterDefinition[] {
  const monsters: MonsterDefinition[] = [];

  for (const level of LEVELS) {
    for (const archetype of ARCHETYPES) {
      for (const rank of getRanksForLevel(level)) {
        monsters.push(createMonster(archetype, level, rank));
      }
    }
  }

  return monsters;
}

function getRanksForLevel(level: number): MonsterRank[] {
  const match = [...RANKS_BY_LEVEL]
    .reverse()
    .find((entry) => level >= entry.minLevel);

  return match?.ranks ?? ["normal"];
}

function createMonster(
  archetype: MonsterArchetype,
  level: number,
  rank: MonsterRank,
): MonsterDefinition {
  const rankMeta = MONSTER_RANK_META[rank];
  const levelMultiplier = level === 1 ? 1 : level / 10;
  const power = levelMultiplier * rankMeta.powerMultiplier;

  const id = [archetype.family, rank, `lvl-${level}`].join("-");

  return {
    id,
    name: createMonsterName(archetype, rank, level),
    description: archetype.description,
    family: archetype.family,
    rank,
    element: archetype.element,
    level,
    stats: scaleStats(archetype.baseStats, power),
    xpReward: Math.floor(levelMultiplier * rankMeta.rewardMultiplier * 15),
    goldReward: Math.floor(levelMultiplier * rankMeta.rewardMultiplier * 8),
    sprites: {
      idle: `${archetype.spriteBasePath}.gif`,
      attack: `${archetype.spriteBasePath}-ataque.gif`,
      damage: `${archetype.spriteBasePath}-dano.gif`,
      death: `${archetype.spriteBasePath}-morte.gif`,
    },
    skills: archetype.skills.map((skill) => scaleSkill(skill, power)),
  };
}

function createMonsterName(
  archetype: MonsterArchetype,
  rank: MonsterRank,
  level: number,
): string {
  const familyLabel = MONSTER_FAMILY_LABELS[archetype.family];

  if (rank === "minion") return `${familyLabel} Menor Nv.${level}`;
  if (rank === "elite") return `${familyLabel} Elite Nv.${level}`;
  if (rank === "champion") return `${familyLabel} Campeão Nv.${level}`;
  if (rank === "boss") return `${archetype.baseName} Chefe Nv.${level}`;
  if (rank === "world-boss")
    return `${archetype.baseName} Ancestral Nv.${level}`;

  return `${archetype.baseName} Nv.${level}`;
}

function scaleStats(
  baseStats: MonsterArchetype["baseStats"],
  multiplier: number,
): MonsterStats {
  return {
    hp: Math.max(1, Math.floor(baseStats.hp * multiplier)),
    maxHp: Math.max(1, Math.floor(baseStats.hp * multiplier)),
    mana: Math.max(0, Math.floor(baseStats.mana * multiplier)),
    maxMana: Math.max(0, Math.floor(baseStats.mana * multiplier)),
    attack: Math.max(1, Math.floor(baseStats.attack * multiplier)),
    defense: Math.max(0, Math.floor(baseStats.defense * multiplier)),
    magicPower: Math.max(0, Math.floor(baseStats.magicPower * multiplier)),
    criticalChance: baseStats.criticalChance,
    criticalDamage: baseStats.criticalDamage,
  };
}

function scaleSkill(
  skill: MonsterArchetype["skills"][number],
  multiplier: number,
): MonsterSkill {
  return {
    ...skill,
    power: Math.max(1, Math.floor(skill.power * multiplier)),
  };
}
