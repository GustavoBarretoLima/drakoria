export const MAX_HERO_LEVEL = 100;

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

export function isSaveRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Accept numeric strings from older saves, but never coerce null, booleans or
// objects into resources. Keep every persisted number finite and safe.
export function saveInteger(value: unknown, fallback: number, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number {
  const number = typeof value === "number" ? value :
    typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.floor(number))) : fallback;
}

function defaultXpThreshold(level: number): number {
  let threshold = 100;
  for (let current = 1; current < level; current++) threshold = Math.floor(threshold * 1.25);
  return threshold;
}

function stringList(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    : [...fallback];
}

export function normalizeProgress(value: unknown): PlayerProgress {
  const saved = isSaveRecord(value) ? value : {};
  const nivel = saveInteger(saved.nivel, 1, 1, MAX_HERO_LEVEL);
  // A non-positive threshold cannot be repaired by clamping to one: restore
  // the normal curve instead of granting dozens of levels for a tiny reward.
  const threshold = saveInteger(saved.xpParaProximoNivel, 0);
  return {
    goblinInicialDerrotado: saved.goblinInicialDerrotado === true,
    entrouEmDrakoria: saved.entrouEmDrakoria === true,
    dungeonsLiberadas: stringList(saved.dungeonsLiberadas, ["goblin"]),
    missoesConcluidas: stringList(saved.missoesConcluidas, []),
    nivel,
    xp: saveInteger(saved.xp, 0),
    xpParaProximoNivel: threshold > 0 ? threshold : defaultXpThreshold(nivel),
    ouro: saveInteger(saved.ouro, 0),
  };
}

export function applyProgressRewards(value: unknown, gold: unknown, xp: unknown): PlayerProgress {
  const progress = normalizeProgress(value);
  progress.ouro = Math.min(Number.MAX_SAFE_INTEGER, progress.ouro + saveInteger(gold, 0));
  progress.xp = Math.min(Number.MAX_SAFE_INTEGER, progress.xp + saveInteger(xp, 0));

  // The combat engine already caps levels at 100. This also bounds the number
  // of iterations for very large rewards or old saves with tiny thresholds.
  while (progress.nivel < MAX_HERO_LEVEL && progress.xp >= progress.xpParaProximoNivel) {
    progress.xp -= progress.xpParaProximoNivel;
    progress.nivel += 1;
    progress.xpParaProximoNivel = Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.floor(progress.xpParaProximoNivel * 1.25),
    );
  }
  return progress;
}
