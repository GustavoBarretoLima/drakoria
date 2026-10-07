export interface DungeonConfig {
  id: string;
  label: string;
  minLevel: number;
  maxLevel: number;
  monsters: string[];
  description: string;
  eliteChance?: number;
  rank?: "boss";
  introMonsters?: string[];
  introDepths?: number;
  bossAfterVictories?: number;
  bossMonster?: string;
  bossLevel?: number;
  hidden?: boolean;
}

export const DUNGEON_CONFIG: Record<string, DungeonConfig> = {
  iniciante: {
    id: "dungeon-orc-1-10",
    label: "Acampamento Orc",
    minLevel: 1,
    maxLevel: 10,
    monsters: ["goblin", "orc"],
    description: "Goblins e Orcs ficam mais fortes a cada profundidade explorada.",
  },
  cripta: {
    id: "dungeon-mutants",
    label: "Cripta dos Mutantes",
    minLevel: 1,
    maxLevel: 10,
    monsters: ["skeleton-warrior", "mutant-rat"],
    hidden: true,
    description: "Esqueletos Guerreiros e Ratos Mutantes ficam mais fortes conforme a exploração avança.",
  },
  cemiterio: {
    id: "cemiterio-esquecido",
    label: "Cemitério Esquecido",
    minLevel: 1,
    maxLevel: 10,
    monsters: ["skeleton-warrior"],
    description: "Esqueletos Guerreiros guardam as sepulturas. Os encontros ficam mais fortes conforme a exploração avança.",
  },
  pantano: {
    id: "pantano-corrompido",
    label: "Pântano Corrompido",
    minLevel: 1,
    maxLevel: 10,
    monsters: ["mutant-rat"],
    description: "Ratos Mutantes infestam o pântano. Os encontros ficam mais fortes conforme a exploração avança.",
  },
  avancada: {
    id: "dungeon-orc-fortress",
    label: "Fortaleza do Rei Orc",
    minLevel: 10,
    maxLevel: 15,
    monsters: ["hobgoblin"],
    introMonsters: ["hobgoblin"],
    introDepths: 2,
    eliteChance: 0.20,
    bossAfterVictories: 5,
    bossMonster: "orc-king",
    bossLevel: 20,
    description: "Hobgoblins e Hobgoblins Elite defendem a fortaleza. Após cinco vitórias, o Orc Rei aparece.",
  },
  fortaleza: {
    id: "dungeon-orc-king",
    label: "Trono do Orc Rei",
    minLevel: 20,
    maxLevel: 20,
    monsters: ["orc-king"],
    rank: "boss",
    hidden: true,
    description: "Entrada legada para o confronto direto com o Orc Rei.",
  },
};

export function getDungeonConfig(id: string | null): DungeonConfig | undefined {
  if (id === "dungeon-orc-1-5" || id === "dungeon-random" || id === "dungeon-goblin" || id === "dungeon-orc") return DUNGEON_CONFIG.iniciante;
  if (id === "dungeon-orc-5-15" || id === "dungeon-hobgoblin") return DUNGEON_CONFIG.avancada;
  if (id === "dungeon-mini-boss-orc") return DUNGEON_CONFIG.fortaleza;
  return Object.values(DUNGEON_CONFIG).find(config => config.id === id);
}

export function pickDungeonEncounter(config: DungeonConfig, random: () => number = Math.random) {
  const type = config.monsters[Math.floor(random() * config.monsters.length)]!;
  const level = Math.floor(random() * (config.maxLevel - config.minLevel + 1)) + config.minLevel;
  const rank = config.rank ?? (config.eliteChance && random() < config.eliteChance ? "elite" : "normal");
  return { monsterId: `${type}-${rank}-lvl-${level}`, type: rank === "normal" ? type : rank, level };
}
