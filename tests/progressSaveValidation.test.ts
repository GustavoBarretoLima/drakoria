import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { normalizeProgress, applyProgressRewards } from "../shared/src/progression/playerProgress.js";
import { loadProgress, saveProgress, awardBattleRewards, applyDefeatPenalty } from "../client/src/progression/progressionClient.js";
import { loadHeroVitals, saveHeroVitals, useHealthPotion } from "../client/src/battle/heroVitals.js";

const saved = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  },
});

test("malformed roots and JSON recover defaults, preserving independent saves", () => {
  for (const raw of ["{", "null", "[]", "1", "true", '"save"']) {
    saved.clear();
    saved.set("drakoriaInventario", "inventory-untouched");
    saved.set("drakoriaProgresso", raw);
    const progress = loadProgress();
    assert.deepEqual(progress, normalizeProgress(undefined));
    assert.deepEqual(JSON.parse(saved.get("drakoriaProgresso")!), progress);
    assert.equal(saved.get("drakoriaInventario"), "inventory-untouched");
  }
});

test("valid progress round-trips and legacy numeric strings are recovered", () => {
  const valid = {
    ...normalizeProgress(undefined), nivel: 20, xp: 12, xpParaProximoNivel: 500, ouro: 90,
    goblinInicialDerrotado: true, entrouEmDrakoria: true,
    dungeonsLiberadas: ["goblin", "orc"], missoesConcluidas: ["quest-1"],
  };
  saveProgress(valid);
  assert.deepEqual(loadProgress(), valid);
  const partial = '{"nivel":20,"xp":12,"xpParaProximoNivel":500,"ouro":90}';
  saved.set("drakoriaProgresso", partial);
  assert.equal(loadProgress().nivel, 20);
  assert.equal(saved.get("drakoriaProgresso"), partial);
  const legacy = normalizeProgress({ ...valid, nivel: "20", xp: "12", ouro: "90", xpParaProximoNivel: "500" });
  assert.deepEqual(legacy, valid);
  const mixed = normalizeProgress({ ...valid, xp: {}, ouro: -5, missoesConcluidas: ["quest-1", null, 3], dungeonsLiberadas: "goblin" });
  assert.equal(mixed.xp, 0);
  assert.equal(mixed.ouro, 0);
  assert.equal(mixed.nivel, 20);
  assert.deepEqual(mixed.missoesConcluidas, ["quest-1"]);
  assert.deepEqual(mixed.dungeonsLiberadas, ["goblin"]);
  for (const invalid of [undefined, null, 0, -1, NaN, Infinity, "bad", {}, []]) {
    assert.equal(normalizeProgress({ nivel: 2, xpParaProximoNivel: invalid }).xpParaProximoNivel, 125);
  }
  assert.equal(normalizeProgress({ nivel: 200 }).nivel, 100);
  assert.equal(normalizeProgress({ nivel: -1 }).nivel, 1);
});

test("normal rewards retain multi-level progression, gold and defeat penalties", () => {
  saved.clear();
  saveProgress({ ...normalizeProgress(undefined), xp: 90, ouro: 10 });
  const result = awardBattleRewards({ gold: 8, xp: 150 });
  assert.equal(result.levelsGained, 2);
  assert.equal(result.progress.nivel, 3);
  assert.equal(result.progress.xp, 15);
  assert.equal(result.progress.xpParaProximoNivel, 156);
  assert.equal(result.progress.ouro, 18);
  const penalty = applyDefeatPenalty();
  assert.equal(penalty.xpLost, 1);
  assert.equal(penalty.goldLost, 18);
  assert.equal(penalty.progress.xp, 14);
  assert.equal(penalty.progress.ouro, 0);
  const before = loadProgress();
  assert.deepEqual(awardBattleRewards({ gold: Infinity, xp: NaN }).progress, before);
  assert.deepEqual(awardBattleRewards({ gold: -10, xp: -5 }).progress, before);
});

test("zero thresholds and extreme rewards terminate in an isolated process", () => {
  // A timeout in a separate process can actually catch an infinite synchronous
  // loop; a node:test timeout in the same event loop cannot interrupt it.
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import { awardBattleRewards } from "./client/src/progression/progressionClient.ts";
    const saved = new Map([["drakoriaProgresso", '{"nivel":1,"xpParaProximoNivel":0}']]);
    globalThis.localStorage = {getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
    assert.equal(awardBattleRewards({gold:1,xp:10}).progress.nivel,1);
    saved.set("drakoriaProgresso",'{"nivel":1,"xpParaProximoNivel":1}');
    const result = awardBattleRewards({gold:Number.MAX_VALUE,xp:Number.MAX_VALUE});
    assert.equal(result.progress.nivel,100);
    assert.equal(result.levelsGained,99);
    assert.ok(Number.isSafeInteger(result.progress.xp));
    assert.ok(Number.isSafeInteger(result.progress.ouro));
  `], { cwd: resolve("."), encoding: "utf8", timeout: 5000 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr);
  const maxLevel = applyProgressRewards({ nivel: 100, xpParaProximoNivel: 1 }, 20, 1000);
  assert.equal(maxLevel.nivel, 100);
  assert.equal(maxLevel.xp, 1000);
});

test("HP and mana never load or save non-finite values; zero HP stays zero", () => {
  for (const raw of ["null", "[]", "1", "{", '{"hp":"bad","mana":{}}']) {
    saved.set("drakoriaHeroVitals", raw);
    assert.deepEqual(loadHeroVitals(100, 50), { hp: 100, mana: 50, maxHp: 100, maxMana: 50 });
  }
  saved.set("drakoriaHeroVitals", '{"hp":0,"mana":"7","maxHp":100,"maxMana":50}');
  assert.deepEqual(loadHeroVitals(100, 50), { hp: 0, mana: 7, maxHp: 100, maxMana: 50 });
  saved.set("drakoriaHeroVitals", '{"hp":999,"mana":-10}');
  assert.deepEqual(loadHeroVitals(100, 50), { hp: 100, mana: 0, maxHp: 100, maxMana: 50 });
  saveHeroVitals({ hp: NaN, mana: Infinity, maxHp: 100, maxMana: 50 });
  assert.deepEqual(JSON.parse(saved.get("drakoriaHeroVitals")!), { hp: 100, mana: 50, maxHp: 100, maxMana: 50 });
  assert.deepEqual(loadHeroVitals(NaN, Infinity), { hp: 1, mana: 0, maxHp: 1, maxMana: 0 });
});

test("city potions do not consume stock for invalid vitals or revive a dead hero", () => {
  saved.set("drakoriaConsumables", '{"healthPotion":2}');
  for (const raw of ["null", "[]", '{"hp":"bad","maxHp":"bad","mana":{},"maxMana":[]}']) {
    saved.set("drakoriaHeroVitals", raw);
    const result = useHealthPotion();
    assert.equal(result.used, false);
    assert.equal(result.remaining, 2);
    assert.deepEqual(result.vitals, { hp: 1, mana: 0, maxHp: 1, maxMana: 0 });
  }
  saveHeroVitals({ hp: 0, mana: 7, maxHp: 100, maxMana: 50 });
  assert.equal(useHealthPotion().used, false);
});

test("legacy progress API uses the same repair and awards intro rewards once", async () => {
  const legacyWindow = { progressoDrakoria: undefined as undefined | {
    carregarProgresso: typeof loadProgress;
    adicionarRecompensa: (reward: { ouro: number; xp: number }) => ReturnType<typeof loadProgress>;
    marcarGoblinInicialDerrotado: () => ReturnType<typeof loadProgress>;
    marcarEntradaDrakoria: () => void;
    resetarProgresso: () => void;
  } };
  Object.defineProperty(globalThis, "window", { value: legacyWindow, configurable: true });
  await import(pathToFileURL(resolve("js/progresso.js")).href);
  const api = legacyWindow.progressoDrakoria;
  assert.ok(api);
  saved.clear();
  saved.set("drakoriaProgresso", '{"xpParaProximoNivel":0}');
  assert.equal(api.carregarProgresso().xpParaProximoNivel, 100);
  assert.equal(api.adicionarRecompensa({ ouro: 0, xp: 10 }).nivel, 1);
  const first = api.marcarGoblinInicialDerrotado();
  assert.equal(first.ouro, 25);
  assert.equal(first.xp, 40);
  assert.deepEqual(api.marcarGoblinInicialDerrotado(), first);
  api.marcarEntradaDrakoria();
  assert.equal(loadProgress().entrouEmDrakoria, true);
  api.resetarProgresso();
  assert.deepEqual(loadProgress(), normalizeProgress(undefined));
  for (const page of ["praca", "caminho-drakoria"]) {
    assert.ok(readFileSync(`pages/${page}.html`, "utf8").includes('<script type="module" src="../js/progresso.js"></script>'));
  }
});
