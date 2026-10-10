import type { BattleRewards } from "../../../shared/src/types/combat.js";
import { applyProgressRewards, isSaveRecord, normalizeProgress, type PlayerProgress } from "../../../shared/src/progression/playerProgress.js";

export type { PlayerProgress } from "../../../shared/src/progression/playerProgress.js";

const PROGRESS_KEY = "drakoriaProgresso";

export interface RewardResult {
  progress: PlayerProgress;
  levelsGained: number;
}

export interface DefeatPenaltyResult {
  progress: PlayerProgress;
  xpLost: number;
  goldLost: number;
}

export function loadProgress(): PlayerProgress {
  const saved = localStorage.getItem(PROGRESS_KEY);
  let parsed: unknown;
  try {
    parsed = saved ? JSON.parse(saved) : undefined;
  } catch {
    parsed = undefined;
  }
  const progress = normalizeProgress(parsed);
  // Reading a valid old save must not rewrite it while rendering a panel or
  // checking a rejected action. Repairs are persisted on the next real save.
  if (!saved || !isSaveRecord(parsed)) saveProgress(progress);
  return progress;
}

export function awardBattleRewards(rewards: BattleRewards): RewardResult {
  const startingProgress = loadProgress();
  const progress = applyProgressRewards(startingProgress, rewards?.gold, rewards?.xp);
  saveProgress(progress);

  return {
    progress,
    levelsGained: progress.nivel - startingProgress.nivel,
  };
}

export function applyDefeatPenalty(): DefeatPenaltyResult {
  const progress = loadProgress();
  const currentXp = Math.max(0, Math.floor(progress.xp));
  const currentGold = Math.max(0, Math.floor(progress.ouro));
  const xpLost = currentXp > 0 ? Math.ceil(currentXp * 0.05) : 0;
  const goldLost = Math.min(200, currentGold);

  progress.xp = Math.max(0, currentXp - xpLost);
  progress.ouro = Math.max(0, currentGold - goldLost);
  saveProgress(progress);

  return { progress, xpLost, goldLost };
}

export function saveProgress(progress: PlayerProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
}
