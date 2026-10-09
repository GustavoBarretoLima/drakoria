import type { BattleState } from "../types/combat.js";

import { berserkSpeedMultiplier } from "./berserkCombat.js";

export const ATB_MAX = 100;
export const ATB_TICK_MS = 100;

export function calculateAtbGain(speed: number): number {
  return Math.max(1, speed) * 0.5;
}

export function advanceBattleAtb(state: BattleState): BattleState {
  if (state.finished || state.turnOwnerId !== null) return state;

  const hero = {
    ...state.hero,
    atb: Math.min(ATB_MAX, state.hero.atb + calculateAtbGain(state.hero.stats.speed * berserkSpeedMultiplier(state.hero))),
  };
  const enemy = {
    ...state.enemy,
    atb: Math.min(ATB_MAX, state.enemy.atb + calculateAtbGain(state.enemy.stats.speed * ((state.enemy.slowedTurns ?? 0) > 0 ? .6 : 1))),
  };

  const heroReady = hero.atb >= ATB_MAX;
  const enemyReady = enemy.atb >= ATB_MAX;

  let turnOwnerId: string | null = null;

  if (heroReady && enemyReady) {
    turnOwnerId =
      hero.stats.speed >= enemy.stats.speed ? hero.id : enemy.id;
  } else if (heroReady) {
    turnOwnerId = hero.id;
  } else if (enemyReady) {
    turnOwnerId = enemy.id;
  }

  return {
    ...state,
    hero,
    enemy,
    turnOwnerId,
  };
}
