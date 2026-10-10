import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WORLD_REGIONS } from '../shared/src/dungeons/worldRegions.js';
import { createInitialBattleState } from '../server/src/modules/combat/battleRoom.js';
import { getMonsterById } from '../server/src/modules/monsters/monsterService.js';
import { onlineRegions, newExpedition, settleExpedition, regionConfig } from '../server/src/game/world.js';
import { pickDungeonRunEncounter } from '../shared/src/dungeons/dungeonRun.js';
import { enemyPresentation, gameAssets } from '../server/src/game/assets.js';

test('all existing regional encounters and bosses have canonical monsters and online art', () => {
  assert.equal(onlineRegions.length, 5);
  for (const [id, region] of Object.entries(WORLD_REGIONS)) {
    const config = region.config;
    const run = newExpedition(id);
    assert.equal(run.dungeonId, config.id);
    const monsterIds = [];
    for (const type of config.monsters) {
      for (let level = config.minLevel; level <= config.maxLevel; level++) {
        for (const rank of type === 'hobgoblin' ? ['normal', 'elite'] : ['normal']) monsterIds.push(`${type}-${rank}-lvl-${level}`);
      }
    }
    monsterIds.push(`${config.bossMonster}-boss-lvl-${config.bossLevel}`);
    for (const monsterId of monsterIds) {
      assert.ok(getMonsterById(monsterId), monsterId);
      for (const path of Object.values(enemyPresentation(monsterId))) assert.ok(gameAssets.has(path), path);
    }
    assert.equal(pickDungeonRunEncounter(config, { ...run, bossPending: true }).monsterId, monsterIds.at(-1));
  }
  for (const id of ['__proto__', 'admin', 'ruinas-da-vigilia']) assert.throws(() => regionConfig(id));
});
test('regional victories preserve original boss threshold and aggregate only server rewards', () => {
  for (const [id, region] of Object.entries(WORLD_REGIONS)) {
    let run = newExpedition(id);
    for (let victory = 1; victory <= 6; victory++) {
      const encounter = pickDungeonRunEncounter(region.config, run, () => 0);
      const battle = createInitialBattleState('guerreiro', encounter.monsterId, [], 100);
      battle.id = `${id}:${victory}`; battle.finished = true; battle.winnerId = battle.hero.id;
      battle.rewards = { xp: 7, gold: 3, drops: [], classBooks: [] };
      const result = settleExpedition(id, run, battle); run = result.state;
      assert.equal(run.victories, victory); assert.equal(run.expedition?.xp, 7 * victory);
      assert.equal(run.bossPending, victory === 5);
      assert.equal(result.status, victory === 6 ? 'completed' : 'active');
    }
    assert.equal(run.bossDefeated, true);
    const lost = createInitialBattleState('guerreiro', `${region.config.monsters[0]}-normal-lvl-${region.config.minLevel}`);
    lost.finished = true; lost.winnerId = lost.enemy.id;
    assert.deepEqual(settleExpedition(id, newExpedition(id), lost), { state: newExpedition(id), status: 'defeated' });
  }
});
