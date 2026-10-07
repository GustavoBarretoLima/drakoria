import type { MonsterDefinition, MonsterSpriteSet } from "../types/monster.js";

export function folderSprites(folder: string): MonsterSpriteSet {
  const base = `/img/monstros/${folder}`;
  return { idle: `${base}/idle.gif`, attack: `${base}/attack.gif`, damage: `${base}/damage.gif`, death: `${base}/death.gif` };
}

const PROFILES = {
  "orc-king": { name: "Orc Rei", folder: "orc_rei", family: "orc", rank: "boss", element: "physical", hp: 240, attack: 24, defense: 12, xp: 75, gold: 40 },
  hobgoblin: { name: "Hobgoblin", folder: "hobgoblin", family: "goblin", rank: "normal", element: "physical", hp: 90, attack: 12, defense: 5, xp: 20, gold: 10 },
  "skeleton-warrior": { name: "Esqueleto Guerreiro", folder: "esqueleto_guerreiro", family: "undead", rank: "normal", element: "shadow", hp: 80, attack: 10, defense: 5, xp: 18, gold: 9 },
  "mutant-rat": { name: "Rato Mutante", folder: "rato_mutante", family: "beast", rank: "normal", element: "poison", hp: 65, attack: 9, defense: 3, xp: 16, gold: 8 },
} as const;

export function createDungeonMonster(id: string): MonsterDefinition | undefined {
  const match = /^(orc-king-boss|hobgoblin-normal|hobgoblin-elite|skeleton-warrior-normal|mutant-rat-normal)-lvl-(\d+)$/.exec(id);
  if (!match) return undefined;
  const key = match[1]!.replace(/-(boss|normal|elite)$/, "") as keyof typeof PROFILES;
  const profile = PROFILES[key];
  const level = Number(match[2]);
  const elite = match[1] === "hobgoblin-elite";
  const minLevel = key === "orc-king" ? 15 : key === "hobgoblin" ? 10 : 1;
  const maxLevel = key === "orc-king" ? 25 : key === "hobgoblin" ? 15 : 10;
  if (level < minLevel || level > maxLevel) return undefined;
  const multiplier = (1 + (level - 1) * 0.08) * (elite ? 1.6 : 1);
  const hp = Math.floor(profile.hp * multiplier);
  const defense = Math.floor(profile.defense * multiplier);
  return {
    id, name: `${profile.name}${elite ? " Elite" : ""} Nv.${level}`, description: profile.rank === "boss" ? "Rei do clã orc, protegido por guerreiros e comandantes da fortaleza." : key === "hobgoblin" ? "Guerreiro do Acampamento Hobgoblin, treinado para emboscadas." : `Habitante hostil da Cripta dos Mutantes: ${profile.name}.`,
    family: profile.family, rank: elite ? "elite" : profile.rank, element: profile.element, level,
    stats: { hp, maxHp: hp, mana: 0, maxMana: 0, attack: Math.floor(profile.attack * multiplier), defense, magicDefense: Math.floor(defense / 2), magicPower: key === "orc-king" ? Math.floor(24 * multiplier) : 0, criticalChance: 6, criticalDamage: 60 },
    xpReward: Math.floor(profile.xp * multiplier * (elite ? 1.25 : 1)), goldReward: Math.floor(profile.gold * multiplier * (elite ? 1.25 : 1)), sprites: folderSprites(profile.folder), skills: [],
  };
}

export const DUNGEON_MONSTERS: MonsterDefinition[] = [
  ...Array.from({ length: 11 }, (_, i) => createDungeonMonster(`orc-king-boss-lvl-${i + 15}`)!),
  ...Array.from({ length: 6 }, (_, i) => i + 10).flatMap(level =>
    ["normal", "elite"].map(rank => createDungeonMonster(`hobgoblin-${rank}-lvl-${level}`)!)),
  ...Array.from({ length: 10 }, (_, i) => i + 1).flatMap(level =>
    ["skeleton-warrior", "mutant-rat"].map(key => createDungeonMonster(`${key}-normal-lvl-${level}`)!)),
];
