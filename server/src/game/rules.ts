import { applySubclassStats, type SubclassId } from '../../../shared/src/classes/subclasses.js';
import { applyTreeStats } from '../../../shared/src/classes/skillTrees.js';
import type { BattleState, HeroClass } from '../../../shared/src/types/combat.js';
import { advanceBattleAtb } from '../../../shared/src/combat/atb.js';
import { applyBattleAction, applyEnemyTurn } from '../../../shared/src/combat/combatEngine.js';
import { isBattleAction, type BattleAction } from '../../../shared/src/combat/actions.js';
import { getEquipmentById } from '../modules/equipment/equipmentService.js';
import { STARTER_LOOT_ITEMS } from '../../../shared/src/loot/lootTables.js';
import { createStatsForLevel } from '../../../shared/src/combat/classStats.js';
import { applyEquipmentStats } from '../../../shared/src/equipment/equipmentStats.js';
import { canEquipItem } from '../../../shared/src/equipment/equipmentRules.js';
import { AuthError } from '../auth/security.js';
import type { EquipmentItem } from '../../../shared/src/types/equipment.js';

export const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function onlyFields(body: Record<string, unknown>, fields: string[]) {
  if (Object.keys(body).some(key => !fields.includes(key))) throw new AuthError(400, 'Campos inválidos.');
}
export function parseAction(value: unknown): BattleAction {
  if (!isBattleAction(value)) throw new AuthError(400, 'Ação inválida.');
  onlyFields(value as unknown as Record<string, unknown>, value.type === 'USE_SKILL' ? ['type', 'skillId'] : ['type']);
  return value;
}
export function itemDefinition(id: string): EquipmentItem {
  const item = getEquipmentById(id) ?? (Object.hasOwn(STARTER_LOOT_ITEMS, id) ? STARTER_LOOT_ITEMS[id] : undefined);
  if (!item) throw new Error('Equipamento salvo não consta no catálogo.');
  return item;
}
export function characterStats(heroClass: HeroClass, level: number, items: EquipmentItem[], subclassId?: SubclassId, treeRanks?: unknown) {
  return applyTreeStats(applySubclassStats(applyEquipmentStats(createStatsForLevel(heroClass, level), items.filter(item => canEquipItem(item, heroClass, level, subclassId))), subclassId), subclassId, level, treeRanks);
}
// Online v1 is turn-based: ATB runs on the server until the hero can act.
// No client clock, elapsed time, stats or battle result participates in this loop.
export function readyForHero(initial: BattleState, messages: string[]): BattleState {
  let state = initial;
  for (let tick = 0; tick < 1000 && !state.finished && state.turnOwnerId !== state.hero.id; tick++) {
    state = advanceBattleAtb(state);
    if (state.turnOwnerId === state.enemy.id) {
      state = applyEnemyTurn(state);
      if (state.lastEvent) messages.push(state.lastEvent.message);
    }
  }
  if (!state.finished && state.turnOwnerId !== state.hero.id) throw new Error('Combate sem turno válido.');
  return state;
}
export function playTurn(state: BattleState, action: BattleAction, messages: string[]): BattleState {
  const next = applyBattleAction(state, action);
  if (next === state) throw new AuthError(409, 'Ação indisponível neste turno.');
  if (next.lastEvent) messages.push(next.lastEvent.message);
  return readyForHero(next, messages);
}
