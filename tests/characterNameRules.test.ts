import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS } from "../shared/src/classes/subclasses.js";
import { useSubclassBook, loadSubclassProgress } from "../client/src/progression/subclassClient.js";
import { BattleManager } from "../server/src/modules/combat/battleManager.js";
import { startDemoBattle, subscribeDemoBattle } from "../client/src/demo/demoBattle.js";
import type { BattleState, HeroClass } from "../shared/src/types/combat.js";

const saved = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => saved.get(key) ?? null,
  setItem: (key: string, value: string) => { saved.set(key, value); },
};
Object.assign(globalThis, { localStorage, window: { setInterval: () => 1, clearInterval() {} } });

// Exercise the real creation script: no module-ready event or test initializer.
for (const name of ["Taichou", " TaIcHoU ", "Jogador"]) {
  for (const heroClass of ["guerreiro", "mago", "arqueiro"] as const) {
    saved.clear();
    const input = { value: name, classList: { add() {} }, focus() {} };
    const error = { textContent: "", style: { display: "" } };
    const context = vm.createContext({
      localStorage,
      window: { location: { href: "" } },
      document: { getElementById: (id: string) => id === "nomeHeroi" ? input : error },
    });
    vm.runInContext(readFileSync("js/personagens.js", "utf8"), context);
    vm.runInContext(`selecionarPersonagem("${heroClass}")`, context);
    assert.equal(context.window.location.href, "intro.html");
    assert.equal(saved.get("nomeHeroi"), name.trim());
    assert.equal(saved.get("classeHeroi"), heroClass);
    for (const key of ["drakoriaProgresso", "drakoriaInventario", "drakoriaHeroVitals", "drakoriaSubclassProgress"]) {
      assert.equal(saved.has(key), false, `${name} must not receive boosted ${key}`);
    }
  }
}

// Existing saves and all nine subclass choices retain ordinary restrictions.
for (const name of ["Taichou", "TAICHOU", " TaIcHoU ", "Jogador"]) {
  for (const id of SUBCLASS_IDS) {
    saved.clear(); saved.set("nomeHeroi", name);
    const base = SUBCLASS_DEFINITIONS[id].baseClass;
    const wrong: HeroClass = base === "guerreiro" ? "mago" : "guerreiro";
    saved.set("classeHeroi", wrong);
    saved.set("drakoriaSubclassProgress", JSON.stringify({ books: { [id]: 2 } }));
    const original = saved.get("drakoriaSubclassProgress");
    assert.equal(useSubclassBook(id, wrong).used, false);
    assert.equal(saved.get("classeHeroi"), wrong);
    assert.equal(saved.get("drakoriaSubclassProgress"), original);
    saved.set("classeHeroi", base);
    assert.equal(useSubclassBook(id, base).used, true);
    assert.equal(loadSubclassProgress().books[id], 1);
    assert.equal(useSubclassBook(id, base).used, false);
    assert.equal(loadSubclassProgress().activeSubclass, id);
    assert.equal(loadSubclassProgress().books[id], 1);
  }
}

// Both combat entry points use the normal boss drop probability for every name.
let demo: BattleState | undefined;
subscribeDemoBattle(state => { demo = state; });
const originalRandom = Math.random;
try {
  for (const name of ["Taichou", " TAICHOU ", "Jogador"]) {
    saved.clear(); saved.set("nomeHeroi", name); saved.set("classeHeroi", "guerreiro");
    for (const roll of [0.999999, 0.004]) {
      Math.random = () => roll;
      const expected = roll === 0.004 ? 1 : 0;
      const state = new BattleManager().create("test", "guerreiro", "orc-king-boss-lvl-20", [], 20, {}, undefined, name);
      assert.equal(state.rewards?.classBooks?.length, expected);
      startDemoBattle("guerreiro", "orc-king-boss-lvl-20", 20);
      assert.equal(demo?.rewards?.classBooks?.length ?? 0, expected);
    }
  }
} finally { Math.random = originalRandom; }

console.log("Character names: ordinary creation, class restrictions, permanent specialization and demo/server boss drops passed.");
