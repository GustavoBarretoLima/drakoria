import assert from "node:assert/strict";
import { INSIGHT_ACCESSORY, hasMonsterInsight } from "../shared/src/equipment/monsterInsight.js";
import { rollDungeonDrops } from "../shared/src/loot/dungeonLoot.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { renderStatus } from "../client/src/ui/renderStatus.js";

assert.equal(hasMonsterInsight([], 25), false);
assert.equal(hasMonsterInsight([INSIGHT_ACCESSORY], 14), false);
assert.equal(hasMonsterInsight([{ ...INSIGHT_ACCESSORY, slot: "ring" }], 25), false);
for (const heroClass of ["guerreiro", "mago", "arqueiro"] as const) {
  assert.equal(createInitialBattleState(heroClass, "goblin-normal-lvl-1", [INSIGHT_ACCESSORY], 15).revealEnemyStats, true);
}
const originalRandom = Math.random;
try {
  for (let level = 15; level <= 25; level++) {
    for (const [chance, count] of [[0.00999, 2], [0.01, 1]] as const) {
      let index = 0;
      Math.random = () => [0, 0, 0, 0, chance][index++] ?? 0;
      const drops = rollDungeonDrops(`orc-king-boss-lvl-${level}`)!;
      assert.equal(drops.length, count);
      assert.equal(drops[0]!.item.level, level);
      if (count === 2) {
        assert.equal(drops[1]!.item.id, INSIGHT_ACCESSORY.id);
        assert.notEqual(drops[1]!.item.stats, INSIGHT_ACCESSORY.stats);
      }
    }
  }
  Math.random = () => 0;
  assert.ok(!rollDungeonDrops("hobgoblin-elite-lvl-15")!.some(drop => drop.item.id === INSIGHT_ACCESSORY.id));
} finally { Math.random = originalRandom; }

const elements = new Map<string, { textContent: string; style: { width: string }; hidden: boolean }>();
(globalThis as any).document = { getElementById(id: string) {
  if (!elements.has(id)) elements.set(id, { textContent: "", style: { width: "" }, hidden: false });
  return elements.get(id);
} };
(globalThis as any).localStorage = { getItem: () => "Aventureiro" };
const battle = createInitialBattleState("mago", "orc-king-boss-lvl-25", [], 20);
renderStatus(battle);
assert.equal(elements.get("nomeHeroi")!.textContent, "Aventureiro");
assert.equal(elements.get("classeHeroi")!.textContent, "Mago");
assert.equal(elements.get("nivelHeroi")!.textContent, "20");
assert.equal(elements.get("hpHeroiTexto")!.textContent, "Vida");
assert.equal(elements.get("hpInimigoTexto")!.textContent, "Vida");
assert.equal(elements.get("atributosInimigo")!.hidden, true);
assert.equal(elements.get("ataqueInimigo")!.textContent, "");
renderStatus({ ...battle, revealEnemyStats: true });
assert.equal(elements.get("atributosInimigo")!.hidden, false);
assert.equal(elements.get("ataqueInimigo")!.textContent, String(battle.enemy.stats.attack));
assert.match(elements.get("hpInimigoTexto")!.textContent, /^\d+\/\d+$/);
renderStatus(battle);
assert.equal(elements.get("atributosInimigo")!.hidden, true);
assert.equal(elements.get("ataqueInimigo")!.textContent, "");
assert.equal(elements.get("hpHeroiBar")!.style.width, "100%");
console.log("Passed: legendary drop boundaries, all boss levels, equipped effect and battle visibility reset.");
