import { DUNGEON_CONFIG, getDungeonConfig, pickDungeonEncounter } from "../../../shared/src/dungeons/dungeonEncounters.js";

type BattleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function prepareNextMonster(storage: BattleStorage, random: () => number = Math.random): void {
  const config = getDungeonConfig(storage.getItem("dungeonAtual")) ??
    getDungeonConfig(storage.getItem("tipoBatalhaAtual")) ?? DUNGEON_CONFIG.iniciante!;
  const encounter = pickDungeonEncounter(config, random);
  storage.setItem("tipoBatalhaAtual", config.id);
  storage.setItem("dungeonAtual", config.id);
  storage.setItem("dungeonNivelMin", String(config.minLevel));
  storage.setItem("dungeonNivelMax", String(config.maxLevel));
  storage.setItem("monsterIdAtual", encounter.monsterId);
  storage.setItem("dungeonEncontroTipo", encounter.type);
  storage.setItem("dungeonEncontroNivel", String(encounter.level));
}

export function clearBattleStorage(storage: BattleStorage): void {
  for (const key of ["tipoBatalhaAtual", "monsterIdAtual", "dungeonAtual", "dungeonNivelMin", "dungeonNivelMax", "dungeonEncontroTipo", "dungeonEncontroNivel"]) {
    storage.removeItem(key);
  }
}
