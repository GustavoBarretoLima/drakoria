import { WORLD_REGIONS, getWorldRegion } from '../../../shared/src/dungeons/worldRegions.js';
import { createDungeonRun, pickDungeonRunEncounter, recordDungeonVictory, type DungeonRunState } from '../../../shared/src/dungeons/dungeonRun.js';
import { addExpeditionRewards } from '../../../shared/src/dungeons/expedition.js';
import type { BattleState } from '../../../shared/src/types/combat.js';
import { AuthError } from '../auth/security.js';

export const onlineRegions = Object.entries(WORLD_REGIONS).map(([id, region]) => ({ id,
  label: region.config.label, minLevel: region.config.minLevel, maxLevel: region.config.maxLevel,
  inhabitants: region.inhabitants, description: region.config.description,
  bossName: region.config.bossName, bossLevel: region.config.bossLevel, bossAfterVictories: region.config.bossAfterVictories }));
export function regionConfig(regionId: string) {
  const region = getWorldRegion(regionId);
  if (!region) throw new AuthError(400, 'Região inválida.');
  return region.config;
}
export function newExpedition(regionId: string) { return createDungeonRun(regionConfig(regionId).id); }
export function nextEncounter(regionId: string, state: DungeonRunState) {
  return pickDungeonRunEncounter(regionConfig(regionId), state);
}
export function settleExpedition(regionId: string, run: DungeonRunState, battle: BattleState) {
  if (battle.winnerId !== battle.hero.id) return { state: run, status: 'defeated' as const };
  const state = recordDungeonVictory(regionConfig(regionId), run, battle.enemy.id);
  state.expedition = addExpeditionRewards(run.expedition, battle.id, battle.rewards!);
  return { state, status: state.bossDefeated ? 'completed' as const : 'active' as const };
}
