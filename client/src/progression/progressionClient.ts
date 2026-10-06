import type { BattleRewards } from "../../../shared/src/types/combat.js";

const PROGRESS_KEY = "drakoriaProgresso";

export interface PlayerProgress {
  goblinInicialDerrotado: boolean;
  entrouEmDrakoria: boolean;
  dungeonsLiberadas: string[];
  missoesConcluidas: string[];
  nivel: number;
  xp: number;
  xpParaProximoNivel: number;
  ouro: number;
}

export interface RewardResult {
  progress: PlayerProgress;
  levelsGained: number;
}

export interface DefeatPenaltyResult {
  progress: PlayerProgress;
  xpLost: number;
  goldLost: number;
}

const DEFAULT_PROGRESS: PlayerProgress = {
  goblinInicialDerrotado: false,
  entrouEmDrakoria: false,
  dungeonsLiberadas: ["goblin"],
  missoesConcluidas: [],
  nivel: 1,
  xp: 0,
  xpParaProximoNivel: 100,
  ouro: 0,
};

export function loadProgress(): PlayerProgress {
  const saved = localStorage.getItem(PROGRESS_KEY);

  if (!saved) {
    saveProgress(DEFAULT_PROGRESS);
    return cloneDefaultProgress();
  }

  try {
    const parsed = JSON.parse(saved) as Partial<PlayerProgress>;
    return {
      ...cloneDefaultProgress(),
      ...parsed,
      dungeonsLiberadas: parsed.dungeonsLiberadas ?? ["goblin"],
      missoesConcluidas: parsed.missoesConcluidas ?? [],
    };
  } catch {
    saveProgress(DEFAULT_PROGRESS);
    return cloneDefaultProgress();
  }
}

export function awardBattleRewards(rewards: BattleRewards): RewardResult {
  const progress = loadProgress();
  const startingLevel = progress.nivel;

  progress.ouro += Math.max(0, Math.floor(rewards.gold));
  progress.xp += Math.max(0, Math.floor(rewards.xp));

  while (progress.xp >= progress.xpParaProximoNivel) {
    progress.xp -= progress.xpParaProximoNivel;
    progress.nivel += 1;
    progress.xpParaProximoNivel = Math.floor(
      progress.xpParaProximoNivel * 1.25,
    );
  }

  saveProgress(progress);

  return {
    progress,
    levelsGained: progress.nivel - startingLevel,
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

function saveProgress(progress: PlayerProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function cloneDefaultProgress(): PlayerProgress {
  return {
    ...DEFAULT_PROGRESS,
    dungeonsLiberadas: [...DEFAULT_PROGRESS.dungeonsLiberadas],
    missoesConcluidas: [...DEFAULT_PROGRESS.missoesConcluidas],
  };
}
