import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitialBattleState } from '../server/src/modules/combat/battleRoom.js';
import { parseAction, readyForHero, playTurn, characterStats } from '../server/src/game/rules.js';
import type { EquipmentItem } from '../shared/src/types/equipment.js';
import { AuthError } from '../server/src/auth/security.js';

test('online commands reject forged stats and skills from unknown catalogs', () => {
  assert.deepEqual(parseAction({ type: 'ATTACK' }), { type: 'ATTACK' });
  for (const action of [{ type: 'ATTACK', damage: 99999 }, { type: 'USE_SKILL', skillId: 'admin-kill' }, null]) {
    assert.throws(() => parseAction(action), AuthError);
  }
});
test('server advances enemy turns and validates class and mana before a hero command', () => {
  const messages: string[] = [];
  const state = readyForHero(createInitialBattleState('guerreiro'), messages);
  assert.equal(state.turnOwnerId, state.hero.id);
  assert.throws(() => playTurn(state, { type: 'USE_SKILL', skillId: 'mage-bolt' }, messages), AuthError);
  state.hero.stats.mana = 0;
  assert.throws(() => playTurn(state, { type: 'USE_SKILL', skillId: 'warrior-cleave' }, messages), AuthError);
  const next = playTurn(state, { type: 'ATTACK' }, messages);
  assert.ok(next.finished || next.turnOwnerId === next.hero.id);
  assert.ok(next.enemy.stats.hp < state.enemy.stats.hp);
  assert.ok(messages.length > 0);
});
test('online equipped stats reject incompatible class equipment', () => {
  const item: EquipmentItem = { id: 'orc-iron-axe', name: 'forged', description: '', slot: 'weapon', rarity: 'uncommon', level: 1,
    allowedClasses: ['guerreiro'], stats: { attack: 9 }, icon: '', sellPrice: 0 };
  const baseline = characterStats('mago', 1, []);
  assert.deepEqual(characterStats('mago', 1, [item]), baseline);
});
