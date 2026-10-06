export interface DungeonConfig {
  id: string;
  label: string;
  minLevel: number;
  maxLevel: number;
  monsters: string[];
  description: string;
  eliteChance?: number;
  rank?: "boss";
}

export const DUNGEON_CONFIG: Record<string, DungeonConfig> = {
  iniciante: { id: "dungeon-orc-1-10", label: "Covil dos Goblins e Orcs", minLevel: 1, maxLevel: 10, monsters: ["goblin", "orc"], description: "Goblins e Orcs em encontros de níveis 1 a 10." },
  cripta: { id: "dungeon-mutants", label: "Cripta dos Mutantes", minLevel: 1, maxLevel: 10, monsters: ["skeleton-warrior", "mutant-rat"], description: "Esqueletos Guerreiros e Ratos Mutantes em encontros de níveis 1 a 10." },
  avancada: { id: "dungeon-hobgoblin", label: "Acampamento Hobgoblin", minLevel: 10, maxLevel: 15, monsters: ["hobgoblin"], eliteChance: 0.20, description: "Hobgoblins de níveis 10 a 15. Chance de elite: 20%; mais forte, com drops raros e épicos." },
  fortaleza: { id: "dungeon-orc-king", label: "Trono do Orc Rei", minLevel: 15, maxLevel: 25, monsters: ["orc-king"], rank: "boss", description: "Orc Rei de níveis 15 a 25. Um equipamento elite garantido: raro (40%) ou épico (60%)." },
};

export function getDungeonConfig(id: string | null): DungeonConfig | undefined {
  if (id === "dungeon-orc-1-5" || id === "dungeon-random" || id === "dungeon-goblin" || id === "dungeon-orc") return DUNGEON_CONFIG.iniciante;
  if (id === "dungeon-orc-5-15") return DUNGEON_CONFIG.avancada;
  if (id === "dungeon-mini-boss-orc") return DUNGEON_CONFIG.fortaleza;
  return Object.values(DUNGEON_CONFIG).find(config => config.id === id);
}

export function pickDungeonEncounter(config: DungeonConfig, random: () => number = Math.random) {
  const type = config.monsters[Math.floor(random() * config.monsters.length)]!;
  const level = Math.floor(random() * (config.maxLevel - config.minLevel + 1)) + config.minLevel;
  const rank = config.rank ?? (config.eliteChance && random() < config.eliteChance ? "elite" : "normal");
  return { monsterId: `${type}-${rank}-lvl-${level}`, type: rank === "normal" ? type : rank, level };
}
