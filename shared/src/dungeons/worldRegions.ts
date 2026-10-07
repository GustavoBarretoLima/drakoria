import { DUNGEON_CONFIG } from "./dungeonEncounters.js";

/** Only populated regions can start an exploration; unfinished locations remain scenery. */
export const WORLD_REGIONS = {
  "cemiterio-esquecido": { config: DUNGEON_CONFIG.cemiterio!, inhabitants: "Esqueletos Guerreiros, Espectros do Cemitério e Coveiro Maldito", x: 13, y: 75 },
  "pantano-corrompido": { config: DUNGEON_CONFIG.pantano!, inhabitants: "Ratos Mutantes, Aranhas Pestilentas e Hidra da Corrupção", x: 16, y: 49 },
  "floresta-sombria": { config: DUNGEON_CONFIG.floresta!, inhabitants: "Lobos Sombrios, Árvores Demoníacas e Lobo Mutante", x: 18, y: 24 },
  "acampamento-orc": { config: DUNGEON_CONFIG.iniciante!, inhabitants: "Goblins e Orcs", x: 89, y: 29 },
  "fortaleza-rei-orc": { config: DUNGEON_CONFIG.avancada!, inhabitants: "Hobgoblins, Hobgoblins Elite e Orc Rei", x: 56, y: 23 },
} as const;

export type WorldRegionId = keyof typeof WORLD_REGIONS;

export function getWorldRegion(id: string | null) {
  return id && Object.hasOwn(WORLD_REGIONS, id) ? WORLD_REGIONS[id as WorldRegionId] : undefined;
}
