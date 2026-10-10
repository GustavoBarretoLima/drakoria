import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTS } from '../shared/src/quests/regionalQuests.js';
import { createDungeonEquipment } from '../shared/src/loot/dungeonLoot.js';
import { itemDefinition } from '../server/src/game/rules.js';
import { questDefinition } from '../server/src/game/guild.js';
import { gameAssets } from '../server/src/game/assets.js';
test('all existing Guild boss rewards resolve to canonical class weapons and allowed art', () => {
  for (const quest of QUESTS) {
    assert.equal(questDefinition(quest.id), quest);
    if (!quest.gear) continue;
    for (const heroClass of ['guerreiro', 'mago', 'arqueiro'] as const) {
      const weapon = createDungeonEquipment(heroClass, 'weapon', quest.gear, 'epic');
      assert.deepEqual(itemDefinition(weapon.id), weapon);
      assert.ok(gameAssets.has(weapon.icon.replace('/img/itens/loot_monstros/icones_128/', '/game-assets/items/')));
    }
  }
  for (const id of ['', '__proto__', 'admin']) assert.throws(() => questDefinition(id));
});
