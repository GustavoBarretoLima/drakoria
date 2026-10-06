import type {
  MonsterDefinition,
  MonsterFamily,
  MonsterRank,
  MonsterSpriteSet,
} from "../../../../shared/src/types/monster.js";
import { generateMonsterCatalog } from "./monsterGenerator.js";

const MONSTER_SPRITE_OVERRIDES: Partial<
  Record<MonsterFamily, MonsterSpriteSet>
> = {
  orc: {
    idle: "/img/monstros/orc-idle.png",
    attack: "/img/monstros/orc-attack.png",
    damage: "/img/monstros/orc-damage.png",
    death: "/img/monstros/orc-death.png",
  },
};

const GOBLIN_SPRITES: MonsterSpriteSet = {
  idle: "/img/monstros/goblin.gif",
  attack: "/img/monstros/goblin-ataque.gif",
  damage: "/img/monstros/goblin-dano.gif",
  death: "/img/monstros/goblin-dano.gif",
};

const ORC_SPRITES: MonsterSpriteSet = {
  idle: "/img/monstros/orc-idle.png",
  attack: "/img/monstros/orc-attack.png",
  damage: "/img/monstros/orc-damage.png",
  death: "/img/monstros/orc-death.png",
};

function getEarlyDungeonMultiplier(level: number): number {
  return 1 + (Math.max(1, level) - 1) * 0.08;
}

function createEarlyDungeonMonster(
  family: "goblin" | "orc",
  level: number,
): MonsterDefinition {
  const multiplier = getEarlyDungeonMultiplier(level);
  const isGoblin = family === "goblin";
  const baseHp = isGoblin ? 60 : 95;
  const baseAttack = isGoblin ? 8 : 14;
  const baseDefense = isGoblin ? 3 : 6;
  const criticalChance = isGoblin ? 5 : 6;
  const criticalDamage = isGoblin ? 50 : 60;

  return {
    id: `${family}-normal-lvl-${level}`,
    name: `${isGoblin ? "Goblin" : "Orc"} Nv.${level}`,
    description: isGoblin
      ? "Criatura traiçoeira, rápida e comum nas estradas de Drakoria."
      : "Guerreiro brutal que usa força bruta para esmagar inimigos.",
    family,
    rank: "normal",
    element: "physical",
    level,
    stats: {
      hp: Math.floor(baseHp * multiplier),
      maxHp: Math.floor(baseHp * multiplier),
      mana: 0,
      maxMana: 0,
      attack: Math.floor(baseAttack * multiplier),
      defense: Math.floor(baseDefense * multiplier),
      magicPower: 0,
      criticalChance,
      criticalDamage,
    },
    xpReward: Math.max(1, Math.floor(15 * multiplier)),
    goldReward: Math.max(1, Math.floor(8 * multiplier)),
    sprites: isGoblin ? GOBLIN_SPRITES : ORC_SPRITES,
    skills: [],
  };
}

function createOrcWarlordMiniBoss(level: number): MonsterDefinition {
  const multiplier = getEarlyDungeonMultiplier(level);

  return {
    id: `orc-warlord-mini-boss-lvl-${level}`,
    name: `Senhor da Guerra Orc Nv.${level}`,
    description: "Um comandante orc mais resistente, agressivo e bem equipado.",
    family: "orc",
    rank: "elite",
    element: "physical",
    level,
    stats: {
      hp: Math.floor(155 * multiplier),
      maxHp: Math.floor(155 * multiplier),
      mana: 0,
      maxMana: 0,
      attack: Math.floor(18 * multiplier),
      defense: Math.floor(9 * multiplier),
      magicDefense: Math.floor(5 * multiplier),
      magicPower: 0,
      criticalChance: 8,
      criticalDamage: 70,
    },
    xpReward: Math.max(1, Math.floor(35 * multiplier)),
    goldReward: Math.max(1, Math.floor(20 * multiplier)),
    sprites: ORC_SPRITES,
    skills: [],
  };
}

function applySpriteOverrides(monster: MonsterDefinition): MonsterDefinition {
  const sprites = MONSTER_SPRITE_OVERRIDES[monster.family];

  if (!sprites) return monster;

  return {
    ...monster,
    sprites,
  };
}

const EARLY_DUNGEON_MONSTERS = Array.from({ length: 14 }, (_, index) => index + 2)
  .flatMap((level) => [
    createEarlyDungeonMonster("goblin", level),
    createEarlyDungeonMonster("orc", level),
  ]);

const ORC_WARLORD_MINI_BOSSES = [1, ...Array.from({ length: 11 }, (_, index) => index + 5)]
  .map(createOrcWarlordMiniBoss);

const GENERATED_CATALOG = generateMonsterCatalog()
  .map(applySpriteOverrides)
  .filter(
    (monster) =>
      !(
        monster.rank === "normal" &&
        (monster.family === "goblin" || monster.family === "orc") &&
        monster.level >= 2 &&
        monster.level <= 15
      ),
  );

const MONSTER_CATALOG = [
  ...EARLY_DUNGEON_MONSTERS,
  ...ORC_WARLORD_MINI_BOSSES,
  ...GENERATED_CATALOG,
];

export interface MonsterFilters {
  level?: number;
  family?: MonsterFamily;
  rank?: MonsterRank;
  maxLevel?: number;
  minLevel?: number;
}

export function listMonsters(
  filters: MonsterFilters = {},
): MonsterDefinition[] {
  return MONSTER_CATALOG.filter((monster) => {
    if (filters.level !== undefined && monster.level !== filters.level) {
      return false;
    }

    if (filters.minLevel !== undefined && monster.level < filters.minLevel) {
      return false;
    }

    if (filters.maxLevel !== undefined && monster.level > filters.maxLevel) {
      return false;
    }

    if (filters.family !== undefined && monster.family !== filters.family) {
      return false;
    }

    if (filters.rank !== undefined && monster.rank !== filters.rank) {
      return false;
    }

    return true;
  });
}

export function getMonsterById(
  monsterId: string,
): MonsterDefinition | undefined {
  return MONSTER_CATALOG.find((monster) => monster.id === monsterId);
}

export function getRandomMonster(
  filters: MonsterFilters = {},
): MonsterDefinition | undefined {
  const candidates = listMonsters(filters);

  if (!candidates.length) return undefined;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

export function getMonstersByLevel(level: number): MonsterDefinition[] {
  return listMonsters({ level });
}

export function getBossesByLevel(level: number): MonsterDefinition[] {
  return listMonsters({ level, rank: "boss" });
}
