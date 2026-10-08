import { DUNGEON_CONFIG, getDungeonConfig } from "../../../shared/src/dungeons/dungeonEncounters.js";
import {
  createDungeonRun,
  pickDungeonRunEncounter,
  type DungeonRunState,
} from "../../../shared/src/dungeons/dungeonRun.js";

type BattleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const RUN_KEY = "drakoriaDungeonRun";

function loadRun(storage: BattleStorage, dungeonId: string): DungeonRunState {
  const saved = storage.getItem(RUN_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as DungeonRunState;
      if (parsed.dungeonId === dungeonId) return parsed;
    } catch {
      // Começa uma nova run quando o estado salvo estiver inválido.
    }
  }

  const run = createDungeonRun(dungeonId);
  storage.setItem(RUN_KEY, JSON.stringify(run));
  return run;
}

export function prepareNextMonster(storage: BattleStorage, random: () => number = Math.random): void {
  const config = getDungeonConfig(storage.getItem("dungeonAtual")) ??
    getDungeonConfig(storage.getItem("tipoBatalhaAtual")) ?? DUNGEON_CONFIG.iniciante!;
  const run = loadRun(storage, config.id);
  const encounter = pickDungeonRunEncounter(config, run, random);
  storage.setItem("tipoBatalhaAtual", config.id);
  storage.setItem("dungeonAtual", config.id);
  storage.setItem("dungeonNivelMin", String(config.minLevel));
  storage.setItem("dungeonNivelMax", String(config.maxLevel));
  storage.setItem("monsterIdAtual", encounter.monsterId);
  storage.setItem("dungeonEncontroTipo", encounter.type);
  storage.setItem("dungeonEncontroNivel", String(encounter.level));
  storage.setItem("dungeonDanger", encounter.danger ? "1" : "0");
}

export function clearBattleStorage(storage: BattleStorage): void {
  for (const key of ["worldRegionAtual", "tipoBatalhaAtual", "monsterIdAtual", "dungeonAtual", "dungeonNivelMin", "dungeonNivelMax", "dungeonEncontroTipo", "dungeonEncontroNivel", "dungeonDanger", RUN_KEY]) {
    storage.removeItem(key);
  }
}

/** Only the opening goblin advances the story automatically. Rewards are saved first. */
export function completeIntroVictory(storage: BattleStorage, state: {
  finished: boolean; winnerId?: string; hero: { id: string }; enemy: { id: string };
}): string | undefined {
  if (!state.finished || state.winnerId !== state.hero.id || state.enemy.id !== "goblin-normal-lvl-1") return undefined;
  const type = storage.getItem("tipoBatalhaAtual");
  const intro = type === "intro-goblin" || (!type && !storage.getItem("dungeonAtual") && !storage.getItem("worldRegionAtual"));
  if (!intro) return undefined;
  clearBattleStorage(storage);
  return "caminho-drakoria.html";
}
