import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS } from '../shared/src/classes/subclasses.js';
import { SUBCLASS_TREES } from '../shared/src/classes/skillTrees.js';
import { heroPresentation, gameAssets } from '../server/src/game/assets.js';
import { characterStats, itemDefinition, playTurn, readyForHero } from '../server/src/game/rules.js';
import { parseSpecializationCommand } from '../server/src/game/specialization.js';
import { createInitialBattleState } from '../server/src/modules/combat/battleRoom.js';
import { adaptSubclassWeaponDrops } from '../shared/src/equipment/assassinWeapons.js';
import { createDungeonEquipment } from '../shared/src/loot/dungeonLoot.js';

test('all nine online subclasses use existing stats, talent rules, weapon catalog and original artwork', () => {
  for (const id of SUBCLASS_IDS) {
    const heroClass = SUBCLASS_DEFINITIONS[id].baseClass;
    const node = SUBCLASS_TREES[id].find(node => !node.requires.length)!;
    const ranks = { [node.id]: 1 };
    const weapon = itemDefinition(adaptSubclassWeaponDrops([{ item: createDungeonEquipment(heroClass, 'weapon', 1, 'common'), quantity: 1 }], id)[0]!.item.id);
    const state = createInitialBattleState(heroClass, 'goblin-normal-lvl-1', [weapon], 20, {}, id, 'Hero', ranks);
    assert.deepEqual(state.hero.stats, characterStats(heroClass, 20, [weapon], id, ranks));
    assert.equal(state.hero.subclassId, id);
    for (const path of Object.values(heroPresentation(heroClass, id))) assert.ok(gameAssets.has(path));
  }
  assert.equal(heroPresentation('mago', 'berserker').idle, '/game-assets/mago-idle.gif');
});
test('specialization commands reject client-controlled progression and malformed slots', () => {
  const valid = { requestId: '00000000-0000-0000-0000-000000000001', version: '1', nodeId: 'berserker-brutal' };
  assert.deepEqual(parseSpecializationCommand('invest', valid), { operation: 'invest', nodeId: valid.nodeId });
  for (const key of ['accountId', 'subclassId', 'treeRanks', 'stats', 'level', 'quantity', 'points', 'gold']) assert.throws(() => parseSpecializationCommand('invest', { ...valid, [key]: 999 }));
  for (const slot of [-1, 4, '0', null, 0.5]) assert.throws(() => parseSpecializationCommand('skill-slot', { requestId: valid.requestId, version: '1', slot, skillId: '' }));
  assert.throws(() => parseSpecializationCommand('reset', { requestId: valid.requestId, version: '1', nodeId: 'x' }));
  assert.throws(() => parseSpecializationCommand('admin', { requestId: valid.requestId, version: '1' }));
});
test('online combat refuses unlearned skills and Berserk magic while retaining authoritative fury', () => {
  const weapon = itemDefinition('berserk-dungeon-weapon-guerreiro-common-lvl-1');
  const state = readyForHero(createInitialBattleState('guerreiro', 'goblin-normal-lvl-1', [weapon], 20, {}, 'berserker', 'Hero', { 'berserker-brutal': 1 }, ['berserker-brutal']), []);
  assert.equal(state.hero.hasTwoHandedAxe, true);
  assert.throws(() => playTurn(state, { type: 'CAST_MAGIC' }, []));
  assert.throws(() => playTurn(state, { type: 'USE_SKILL', skillId: 'berserker-executor' }, []));
  const next = playTurn(state, { type: 'USE_SKILL', skillId: 'berserker-brutal' }, []);
  assert.notEqual(next, state);
});
