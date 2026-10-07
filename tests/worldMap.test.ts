import assert from "node:assert/strict";
import { WORLD_REGIONS, getWorldRegion } from "../shared/src/dungeons/worldRegions.js";
import { createDungeonRun, pickDungeonRunEncounter, recordDungeonVictory } from "../shared/src/dungeons/dungeonRun.js";
import { enterWorldRegion, getBattleExitPage } from "../client/src/battle/worldMapNavigation.js";
import { prepareNextMonster, clearBattleStorage } from "../client/src/battle/victoryNavigation.js";
import { getMonsterById } from "../server/src/modules/monsters/monsterService.js";
import { createDemoMonster } from "../client/src/demo/demoMonsters.js";

const saved = new Map<string, string>();
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), removeItem: (key: string) => saved.delete(key) };
const families: Record<string, string[]> = {
  "cemiterio-esquecido": ["skeleton-warrior"],
  "pantano-corrompido": ["mutant-rat"],
  "acampamento-orc": ["goblin", "orc"],
  "fortaleza-rei-orc": ["hobgoblin"],
};
for (const [id, region] of Object.entries(WORLD_REGIONS)) {
  for (const random of [0, .19, .5, .99]) {
    saved.clear();
    saved.set("drakoriaHeroVitals", '{"hp":42,"mana":13}');
    saved.set("drakoriaInventario", '{"items":[]}');
    saved.set("drakoriaProgresso", '{"nivel":10,"ouro":70}');
    assert.equal(enterWorldRegion(storage, id, () => random), true);
    assert.equal(getBattleExitPage(storage), "mapa.html");
    let run = createDungeonRun(region.config.id);
    for (let depth = 1; depth <= 12; depth++) {
      saved.set("drakoriaDungeonRun", JSON.stringify({ ...run, depth }));
      prepareNextMonster(storage, () => random);
      const monsterId = saved.get("monsterIdAtual")!;
      assert.ok(families[id]!.some(family => monsterId.startsWith(`${family}-`)), monsterId);
      assert.ok(getMonsterById(monsterId), `Backend: ${monsterId}`);
      assert.equal(createDemoMonster(monsterId).id, monsterId);
    }
    assert.equal(saved.get("drakoriaHeroVitals"), '{"hp":42,"mana":13}');
    assert.equal(saved.get("drakoriaProgresso"), '{"nivel":10,"ouro":70}');
    clearBattleStorage(storage);
    assert.equal(getBattleExitPage(storage), "praca.html");
    assert.equal(saved.size, 3);
  }
}

const fortress = WORLD_REGIONS["fortaleza-rei-orc"].config;
let run = createDungeonRun(fortress.id);
for (let i = 0; i < 5; i++) run = recordDungeonVictory(fortress, run, "hobgoblin-normal-lvl-10");
const boss = pickDungeonRunEncounter(fortress, run);
assert.equal(boss.monsterId, "orc-king-boss-lvl-20");
assert.equal(boss.danger, true);
assert.ok(getMonsterById(boss.monsterId));
assert.equal(createDemoMonster(boss.monsterId).id, boss.monsterId);
assert.equal(recordDungeonVictory(fortress, run, boss.monsterId).bossDefeated, true);

saved.clear();
saved.set("drakoriaHeroVitals", '{"hp":0,"mana":8}');
const before = [...saved];
assert.equal(enterWorldRegion(storage, "cemiterio-esquecido"), false);
assert.deepEqual([...saved], before);
for (const id of ["floresta-sombria", "ruinas-da-vigilia", "invalid", "__proto__"]) {
  assert.equal(getWorldRegion(id), undefined);
  assert.equal(enterWorldRegion(storage, id), false);
}
saved.set("drakoriaHeroVitals", '{"hp":10}');
assert.equal(enterWorldRegion(storage, "pantano-corrompido", () => 0), true);
assert.equal(enterWorldRegion(storage, "acampamento-orc", () => .99), true);
assert.ok(saved.get("monsterIdAtual")!.startsWith("orc-"));
assert.equal(JSON.parse(saved.get("drakoriaDungeonRun")!).depth, 1);
console.log("worldMap.test.ts: regions, demo/backend encounters, continuation, boss, exits, vitals and unfinished regions passed");
