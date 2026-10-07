import assert from "node:assert/strict";
import {
  loadConsumables,
  saveHeroVitals,
  useHealthPotion,
  useManaPotion,
} from "../client/src/battle/heroVitals.js";

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
});

values.set(
  "drakoriaConsumables",
  JSON.stringify({ restorativePotion: 0, healthPotion: 2, manaPotion: 2 }),
);
saveHeroVitals({ hp: 30, mana: 10, maxHp: 100, maxMana: 50 });

const hpResult = useHealthPotion();
assert.equal(hpResult.used, true);
assert.equal(hpResult.remaining, 1);
assert.equal(hpResult.vitals.hp, 70);
assert.equal(hpResult.vitals.mana, 10);

const manaResult = useManaPotion();
assert.equal(manaResult.used, true);
assert.equal(manaResult.remaining, 1);
assert.equal(manaResult.vitals.hp, 70);
assert.equal(manaResult.vitals.mana, 30);

saveHeroVitals({ hp: 100, mana: 50, maxHp: 100, maxMana: 50 });
const fullHp = useHealthPotion();
const fullMana = useManaPotion();
assert.equal(fullHp.used, false);
assert.equal(fullMana.used, false);
assert.equal(loadConsumables().healthPotion, 1);
assert.equal(loadConsumables().manaPotion, 1);

console.log("Passed: separate HP and mana potion usage and no consumption at full resources.");
