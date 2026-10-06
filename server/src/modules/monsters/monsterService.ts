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

const ORC_WARLORD_MINI_BOSS: MonsterDefinition = {
  id: "orc-warlord-mini-boss-lvl-1",
  name: "Senhor da Guerra Orc Nv.1",
  description: "Um comandante orc mais resistente, agressivo e bem equipado.",
  family: "orc",
  rank: "elite",
  element: "physical",
  level: 1,
  stats: {
    hp: 155,
    maxHp: 155,
    mana: 0,
    maxMana: 0,
    attack: 18,
    defense: 9,
    magicDefense: 5,
    magicPower: 0,
    criticalChance: 8,
    criticalDamage: 70,
  },
  xpReward: 35,
  goldReward: 20,
  sprites: {
    idle: "/img/monstros/orc-idle.png",
    attack: "/img/monstros/orc-attack.png",
    damage: "/img/monstros/orc-damage.png",
    death: "/img/monstros/orc-death.png",
  },
  skills: [],
};

function applySpriteOverrides(monster: MonsterDefinition): MonsterDefinition {
  const sprites = MONSTER_SPRITE_OVERRIDES[monster.family];

  if (!sprites) return monster;

  return {
    ...monster,
    sprites,
  };
}

const MONSTER_CATALOG = [
  ...generateMonsterCatalog().map(applySpriteOverrides),
  ORC_WARLORD_MINI_BOSS,
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
