import {
  createDungeonRun,
  recordDungeonVictory,
  type DungeonRunState,
} from "../../../shared/src/dungeons/dungeonRun.js";
import { getDungeonConfig } from "../../../shared/src/dungeons/dungeonEncounters.js";

const RUN_KEY = "drakoriaDungeonRun";

export function startDungeonRun(dungeonId: string): DungeonRunState {
  const run = createDungeonRun(dungeonId);
  saveDungeonRun(run);
  return run;
}

export function loadDungeonRun(): DungeonRunState | null {
  const saved = localStorage.getItem(RUN_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as Partial<DungeonRunState>;
    if (!parsed.dungeonId) return null;
    return {
      dungeonId: parsed.dungeonId,
      depth: Math.max(1, Math.floor(Number(parsed.depth ?? 1))),
      victories: Math.max(0, Math.floor(Number(parsed.victories ?? 0))),
      bossPending: Boolean(parsed.bossPending),
      bossDefeated: Boolean(parsed.bossDefeated),
    };
  } catch {
    return null;
  }
}

export function saveDungeonRun(run: DungeonRunState): void {
  localStorage.setItem(RUN_KEY, JSON.stringify(run));
}

export function registerDungeonVictory(defeatedMonsterId: string): DungeonRunState | null {
  const run = loadDungeonRun();
  if (!run) return null;
  const config = getDungeonConfig(run.dungeonId);
  if (!config) return run;
  const next = recordDungeonVictory(config, run, defeatedMonsterId);
  saveDungeonRun(next);
  return next;
}

export function clearDungeonRun(): void {
  localStorage.removeItem(RUN_KEY);
}
