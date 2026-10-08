import assert from "node:assert/strict";
import { DUNGEON_CONFIG } from "../shared/src/dungeons/dungeonEncounters.js";
import {
  createDungeonRun,
  pickDungeonRunEncounter,
  recordDungeonVictory,
} from "../shared/src/dungeons/dungeonRun.js";

const fortress = DUNGEON_CONFIG.avancada!;

let run = createDungeonRun(fortress.id);
const first = pickDungeonRunEncounter(fortress, run, () => 0);
assert.equal(first.monsterId, "hobgoblin-elite-lvl-35");
assert.equal(first.danger, false);

for (let index = 0; index < 5; index += 1) {
  run = recordDungeonVictory(fortress, run, `hobgoblin-normal-lvl-${10 + index}`);
}

assert.equal(run.victories, 5);
assert.equal(run.depth, 6);
assert.equal(run.bossPending, true);

const boss = pickDungeonRunEncounter(fortress, run, () => 0.5);
assert.equal(boss.monsterId, "orc-king-boss-lvl-55");
assert.equal(boss.rank, "boss");
assert.equal(boss.danger, true);

run = recordDungeonVictory(fortress, run, boss.monsterId);
assert.equal(run.bossDefeated, true);
assert.equal(run.bossPending, false);

const starter = DUNGEON_CONFIG.iniciante!;
let starterRun = createDungeonRun(starter.id);
const levelOne = pickDungeonRunEncounter(starter, starterRun, () => 0);
assert.equal(levelOne.level, 25);
starterRun = { ...starterRun, depth: 5 };
const deeper = pickDungeonRunEncounter(starter, starterRun, () => 0);
assert.equal(deeper.level, 29);

console.log("dungeonRun.test.ts: ok");
