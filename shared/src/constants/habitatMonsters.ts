import type { MonsterDefinition } from "../types/monster.js";
import { folderSprites } from "./dungeonMonsters.js";

export const HABITAT_MONSTER_PROFILES = {
  "corruption-hydra": { name: "Hidra da Corrupção", folder: "hidra_corrupcao", family: "reptile", element: "poison", rank: "boss", hp: 210, attack: 18, defense: 9, magicPower: 18, xp: 70, gold: 36 },
  "pestilent-spider": { name: "Aranha Pestilenta", folder: "aranha_pestilenta", family: "spider", element: "poison", rank: "normal", hp: 70, attack: 10, defense: 3, magicPower: 8, xp: 18, gold: 9 },
  "cemetery-specter": { name: "Espectro do Cemitério", folder: "espectro_cemiterio", family: "spirit", element: "shadow", rank: "normal", hp: 70, attack: 8, defense: 3, magicPower: 12, xp: 20, gold: 10 },
  "cursed-gravedigger": { name: "Coveiro Maldito", folder: "coveiro_maldito", family: "undead", element: "shadow", rank: "boss", hp: 180, attack: 18, defense: 8, magicPower: 16, xp: 60, gold: 32 },
  "shadow-wolf": { name: "Lobo Sombrio", folder: "lobo_sombrio", family: "beast", element: "shadow", rank: "normal", hp: 75, attack: 11, defense: 3, magicPower: 0, xp: 18, gold: 9 },
  "demonic-tree": { name: "Árvore Demoníaca", folder: "arvore_demoniaca", family: "plant", element: "shadow", rank: "normal", hp: 100, attack: 9, defense: 7, magicPower: 10, xp: 22, gold: 11 },
  "mutant-wolf": { name: "Lobo Mutante", folder: "lobo_mutante_boss", family: "beast", element: "poison", rank: "boss", hp: 190, attack: 20, defense: 7, magicPower: 0, xp: 65, gold: 34 },
} as const;

export function createHabitatMonster(id: string): MonsterDefinition | undefined {
  const match = /^(.+)-(normal|boss)-lvl-(\d+)$/.exec(id);
  if (!match || !Object.hasOwn(HABITAT_MONSTER_PROFILES, match[1]!)) return undefined;
  const profile = HABITAT_MONSTER_PROFILES[match[1] as keyof typeof HABITAT_MONSTER_PROFILES];
  const level = Number(match[3]);
  if (match[2] !== profile.rank || level < 1 || level > 10) return undefined;
  const multiplier = 1 + (level - 1) * .08;
  const hp = Math.floor(profile.hp * multiplier);
  const defense = Math.floor(profile.defense * multiplier);
  return {
    id, name: `${profile.name} Nv.${level}`, description: `${profile.name}, ${profile.rank === "boss" ? "guardião" : "habitante"} dos arredores de Drakoria.`,
    family: profile.family, element: profile.element, rank: profile.rank, level,
    stats: { hp, maxHp: hp, mana: 0, maxMana: 0, attack: Math.floor(profile.attack * multiplier), defense, magicDefense: Math.floor(defense / 2), magicPower: Math.floor(profile.magicPower * multiplier), criticalChance: 6, criticalDamage: 60 },
    xpReward: Math.floor(profile.xp * multiplier), goldReward: Math.floor(profile.gold * multiplier), sprites: folderSprites(profile.folder), skills: [],
  };
}

export const HABITAT_MONSTERS = Object.entries(HABITAT_MONSTER_PROFILES).flatMap(([id, profile]) =>
  Array.from({ length: 10 }, (_, index) => createHabitatMonster(`${id}-${profile.rank}-lvl-${index + 1}`)!));
