import { saveHeroVitals, type HeroVitals } from "./heroVitals.js";

/** Losing 70% of maximum HP leaves enough life to resume play without gold. */
export function recoverAfterDefeat(vitals: HeroVitals): HeroVitals {
  const recovered = { ...vitals, hp: Math.max(1, Math.floor(vitals.maxHp * .3)) };
  saveHeroVitals(recovered);
  return recovered;
}
