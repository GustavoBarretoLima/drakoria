import assert from "node:assert/strict";
import {
  SUBCLASS_DEFINITIONS,
  SUBCLASS_IDS,
  applySubclassStats,
  listSubclassesForClass,
} from "../shared/src/classes/subclasses.js";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import {
  SUBCLASS_BOOK_DROP_CHANCE,
  isBossMonsterId,
  rollSubclassBookDrops,
} from "../shared/src/loot/subclassBooks.js";
import {
  addSubclassBookDrops,
  loadSubclassProgress,
  useSubclassBook,
} from "../client/src/progression/subclassClient.js";

assert.equal(SUBCLASS_BOOK_DROP_CHANCE, 0.005);
assert.equal(SUBCLASS_IDS.length, 9);
assert.equal(listSubclassesForClass("guerreiro").length, 3);
assert.equal(listSubclassesForClass("mago").length, 3);
assert.equal(listSubclassesForClass("arqueiro").length, 3);
assert.equal(SUBCLASS_DEFINITIONS.necromancer.baseClass, "mago");
assert.equal(SUBCLASS_DEFINITIONS.hunter.baseClass, "arqueiro");

assert.equal(isBossMonsterId("orc-king-boss-lvl-20"), true);
assert.equal(isBossMonsterId("corruption-hydra-boss-lvl-10"), true);
assert.equal(isBossMonsterId("orc-warlord-mini-boss-lvl-10"), false);
assert.equal(isBossMonsterId("hobgoblin-elite-lvl-12"), false);
assert.deepEqual(rollSubclassBookDrops("goblin-normal-lvl-1", () => 0), []);
assert.deepEqual(rollSubclassBookDrops("orc-warlord-mini-boss-lvl-10", () => 0), []);
assert.deepEqual(rollSubclassBookDrops("orc-king-boss-lvl-20", () => 0.9), []);

{
  const values = [0.004, 0];
  const drops = rollSubclassBookDrops("orc-king-boss-lvl-20", () => values.shift() ?? 0);
  assert.equal(drops.length, 1);
  assert.equal(drops[0]?.subclassId, "paladin");
}

{
  const values = [0.004, 0.999];
  const drops = rollSubclassBookDrops("mutant-wolf-boss-lvl-10", () => values.shift() ?? 0);
  assert.equal(drops[0]?.subclassId, "dark-elf");
}

{
  const warrior = createStatsForLevel("guerreiro", 20);
  const paladin = applySubclassStats(warrior, "paladin");
  const berserk = applySubclassStats(warrior, "berserker");
  const swordsman = applySubclassStats(warrior, "swordsman");
  assert.ok(paladin.maxHp > warrior.maxHp);
  assert.ok(paladin.defense > warrior.defense);
  assert.ok(berserk.attack > warrior.attack);
  assert.ok(berserk.defense < warrior.defense);
  assert.ok(swordsman.speed > warrior.speed);
  assert.ok(swordsman.criticalChance > warrior.criticalChance);
}

{
  const mage = createStatsForLevel("mago", 20);
  const necromancer = applySubclassStats(mage, "necromancer");
  const warlock = applySubclassStats(mage, "warlock");
  const elemental = applySubclassStats(mage, "elementalist");
  assert.ok(necromancer.maxMana > mage.maxMana);
  assert.ok(necromancer.magicPower > mage.magicPower);
  assert.ok(warlock.magicPower > mage.magicPower);
  assert.ok(elemental.speed > mage.speed);
}

{
  const archer = createStatsForLevel("arqueiro", 20);
  const assassin = applySubclassStats(archer, "assassin");
  const hunter = applySubclassStats(archer, "hunter");
  const darkElf = applySubclassStats(archer, "dark-elf");
  assert.ok(assassin.speed > archer.speed);
  assert.ok(assassin.criticalChance > archer.criticalChance);
  assert.ok(hunter.attack > archer.attack);
  assert.ok(darkElf.magicPower > archer.magicPower);
  assert.ok(darkElf.dodgeChance > archer.dodgeChance);
}

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
  configurable: true,
});

addSubclassBookDrops([
  {
    bookId: "subclass-book-paladin",
    subclassId: "paladin",
    name: SUBCLASS_DEFINITIONS.paladin.bookName,
    description: "Teste",
    quantity: 1,
  },
  {
    bookId: "subclass-book-necromancer",
    subclassId: "necromancer",
    name: SUBCLASS_DEFINITIONS.necromancer.bookName,
    description: "Teste",
    quantity: 1,
  },
]);

assert.equal(loadSubclassProgress().books.paladin, 1);
assert.equal(loadSubclassProgress().books.necromancer, 1);

const wrongClass = useSubclassBook("necromancer", "guerreiro");
assert.equal(wrongClass.used, false);
assert.equal(loadSubclassProgress().books.necromancer, 1);

const learned = useSubclassBook("paladin", "guerreiro");
assert.equal(learned.used, true);
assert.equal(learned.state.activeSubclass, "paladin");
assert.equal(learned.state.books.paladin, 0);

const cannotChange = useSubclassBook("necromancer", "mago");
assert.equal(cannotChange.used, false);
assert.equal(loadSubclassProgress().activeSubclass, "paladin");

console.log("Passed: boss-only class books, random specialization, persistence and subclass combat passives.");
