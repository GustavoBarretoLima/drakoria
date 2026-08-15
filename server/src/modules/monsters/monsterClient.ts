import socket from "../../../../client/src/network/socket.js";
import type {
  MonsterDefinition,
  MonsterFamily,
  MonsterRank,
} from "../../../../shared/src/types/monster.js";

export interface MonsterFilters {
  level?: number;
  family?: MonsterFamily;
  rank?: MonsterRank;
  maxLevel?: number;
  minLevel?: number;
}

export function listMonsters(
  filters: MonsterFilters = {},
): Promise<MonsterDefinition[]> {
  return new Promise((resolve) => {
    socket.emit("monsters:list", filters, (monsters: MonsterDefinition[]) => {
      resolve(monsters);
    });
  });
}

export function getMonsterById(
  monsterId: string,
): Promise<MonsterDefinition | null> {
  return new Promise((resolve) => {
    socket.emit(
      "monsters:get",
      monsterId,
      (monster: MonsterDefinition | null) => {
        resolve(monster);
      },
    );
  });
}

export function getRandomMonster(
  filters: MonsterFilters = {},
): Promise<MonsterDefinition | null> {
  return new Promise((resolve) => {
    socket.emit(
      "monsters:random",
      filters,
      (monster: MonsterDefinition | null) => {
        resolve(monster);
      },
    );
  });
}
