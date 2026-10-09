import { addExpeditionRewards,normalizeExpedition } from "../../../shared/src/dungeons/expedition.js";
import type { BattleRewards } from "../../../shared/src/types/combat.js";
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
      expedition: normalizeExpedition(parsed.expedition),
      dungeonId: parsed.dungeonId,
      depth: Math.max(1, Math.floor(Number.isFinite(parsed.depth)?parsed.depth!:1)),
      victories: Math.max(0, Math.floor(Number.isFinite(parsed.victories)?parsed.victories!:0)),
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

export function registerDungeonVictory(defeatedMonsterId: string, battleId?:string, rewards?:BattleRewards): DungeonRunState | null {
  const run = loadDungeonRun();
  if (!run) return null;
  const config = getDungeonConfig(run.dungeonId);
  if (!config) return run;
  if(battleId&&run.expedition?.battles.includes(battleId))return run;
  const next = recordDungeonVictory(config, run, defeatedMonsterId);
  if(battleId&&rewards)next.expedition=addExpeditionRewards(run.expedition,battleId,rewards);
  saveDungeonRun(next);
  return next;
}

export function clearDungeonRun(): void {
  localStorage.removeItem(RUN_KEY);
}

export function archiveDungeonRun(outcome:"return"|"defeat"|"completed"):void {
 const run=loadDungeonRun();if(!run)return;
 localStorage.setItem("drakoriaLastExpedition",JSON.stringify({...run,outcome}));
}
