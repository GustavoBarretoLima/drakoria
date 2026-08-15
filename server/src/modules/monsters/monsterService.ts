import type {
  MonsterDefinition,
  MonsterFamily,
  MonsterRank,
} from "../../../../shared/src/types/monster.js";
import { generateMonsterCatalog } from "./monsterGenerator.js";

const MONSTER_CATALOG = generateMonsterCatalog();

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
