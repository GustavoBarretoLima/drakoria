import assert from "node:assert/strict";
import { recoverAfterDefeat } from "../client/src/battle/defeatRecovery.js";
import { loadHeroVitals } from "../client/src/battle/heroVitals.js";
import { enterWorldRegion } from "../client/src/battle/worldMapNavigation.js";

const saved = new Map<string, string>();
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), removeItem: (key: string) => saved.delete(key) };
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
saved.set("drakoriaProgresso", '{"ouro":0,"nivel":1}');
for (const maxHp of [1, 2, 99, 100, 240, 1000]) {
  const recovered = recoverAfterDefeat({ hp: 0, mana: 7, maxHp, maxMana: 20 });
  assert.equal(recovered.hp, Math.max(1, Math.floor(maxHp * .3)));
  assert.equal(recovered.maxHp, maxHp);
  assert.equal(recovered.mana, 7);
  assert.deepEqual(loadHeroVitals(maxHp, 20), recovered);
  assert.equal(enterWorldRegion(storage, "cemiterio-esquecido", () => 0), true);
  assert.equal(JSON.parse(saved.get("drakoriaProgresso")!).ouro, 0);
}
console.log("defeatRecovery.test.ts: 30% HP, minimum one life, mana/max HP preservation and exploration without gold passed");
