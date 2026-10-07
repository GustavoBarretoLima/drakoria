import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { HABITAT_MONSTERS, createHabitatMonster } from "../shared/src/constants/habitatMonsters.js";
import { WORLD_REGIONS } from "../shared/src/dungeons/worldRegions.js";
import { createDungeonRun, pickDungeonRunEncounter, recordDungeonVictory } from "../shared/src/dungeons/dungeonRun.js";
import { createDemoMonster, getDemoMonsterRewards } from "../client/src/demo/demoMonsters.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { getMonsterById } from "../server/src/modules/monsters/monsterService.js";
import { rollMonsterDrops } from "../shared/src/loot/lootTables.js";
import { applyEnemyTurn } from "../shared/src/combat/combatEngine.js";

for (const monster of HABITAT_MONSTERS) {
  assert.deepEqual(getMonsterById(monster.id), monster);
  const demo = createDemoMonster(monster.id);
  assert.deepEqual(demo, createInitialBattleState("guerreiro", monster.id).enemy);
  assert.ok(demo.stats.speed > 0);
  assert.deepEqual(getDemoMonsterRewards(monster.id), { xp: monster.xpReward, gold: monster.goldReward });
  for (const sprite of Object.values(monster.sprites)) assert.ok(existsSync(`.${sprite}`), sprite);
}
for (const id of ["corruption-hydra-normal-lvl-10", "pestilent-spider-boss-lvl-1", "mutant-wolf-boss-lvl-11", "cemetery-specter-normal-lvl-0"]) assert.equal(createHabitatMonster(id), undefined);

const originalRandom = Math.random;
try {
  Math.random = () => 0;
  for (const monster of HABITAT_MONSTERS) {
    const drop = rollMonsterDrops(monster.id)[0]!;
    assert.ok(drop);
    assert.equal(drop.item.level, monster.level);
    assert.equal(drop.item.rarity, monster.rank === "boss" ? "rare" : "common");
  }
  for (const id of ["cemiterio-esquecido", "pantano-corrompido", "floresta-sombria"] as const) {
    const config = WORLD_REGIONS[id].config;
    let run = createDungeonRun(config.id);
    for (let i = 0; i < 5; i++) {
      const encounter = pickDungeonRunEncounter(config, run, () => .99);
      assert.ok(config.monsters.includes(encounter.type));
      assert.equal(encounter.danger, false);
      assert.equal(encounter.rank, "normal");
      // Defeating a boss from another habitat cannot complete this run.
      assert.equal(recordDungeonVictory(config, run, "orc-king-boss-lvl-20").bossDefeated, false);
      run = recordDungeonVictory(config, run, encounter.monsterId);
    }
    const boss = pickDungeonRunEncounter(config, run);
    assert.equal(boss.monsterId, `${config.bossMonster}-boss-lvl-10`);
    assert.equal(boss.danger, true);
    const state = createInitialBattleState("guerreiro", boss.monsterId);
    state.turnOwnerId = state.enemy.id;
    state.hero.stats.hp = state.hero.stats.maxHp = 10000;
    const special = applyEnemyTurn(state);
    assert.ok(special.lastEvent?.special);
    assert.ok(special.enemy.specialCooldown! > 0);
    special.turnOwnerId = special.enemy.id;
    assert.equal(applyEnemyTurn(special).lastEvent?.special, undefined);
    run = recordDungeonVictory(config, run, boss.monsterId);
    assert.equal(run.bossDefeated, true);
    assert.equal(run.bossPending, false);
  }
} finally { Math.random = originalRandom; }
console.log("habitatMonsters.test.ts: habitat bosses, progression, sprites, demo/backend parity, AI cooldown and rewards passed");
