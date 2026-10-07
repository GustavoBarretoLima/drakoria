import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const events: Record<string, (event: any) => void> = {};
const context = vm.createContext({
  window: { addEventListener() {}, progressoDrakoria: { carregarProgresso: () => ({ nivel: 25 }) } },
  document: { addEventListener(name: string, handler: (event: any) => void) { events[name] = handler; } },
  localStorage: { getItem: () => "guerreiro" },
});
vm.runInContext(readFileSync("js/status-inventory-ux.js", "utf8"), context);
function compare(stats: object, currentStats: object, equippedSlot = "ring", classes = ["guerreiro"]) {
  context.input = { item: { id: "new", name: '<Anel novo>', slot: "ring", level: 1, allowedClasses: classes, stats },
    inventory: { items: [{ item: { id: "old", name: "Anel atual", slot: equippedSlot, level: 1, allowedClasses: ["guerreiro"], stats: currentStats } }], equipped: { [equippedSlot]: "old" } } };
  return vm.runInContext("inventoryUxComparisonHtml(input.item, input.inventory)", context) as string;
}
const html = compare({ attack: 5, dodgeChance: 4 }, { attack: 2, hp: 10, dodgeChance: 6 });
assert.ok(html.includes("Anel atual"));
assert.ok(html.includes("&lt;Anel novo&gt;"));
assert.ok(html.includes('comparison-gain">+3'));
assert.ok(html.includes('comparison-loss">-10'));
assert.ok(html.includes('comparison-loss">-2 p.p.'));
assert.ok(compare({ attack: 2 }, { attack: 2 }).includes('comparison-same">0'));
const empty = compare({ attack: 5 }, { attack: 50 }, "weapon");
assert.ok(empty.includes("Slot vazio"));
assert.ok(empty.includes('comparison-gain">+5'));
assert.ok(!empty.includes("Anel atual"));
assert.ok(compare({}, {}).includes("Sem bônus de atributos"));
assert.ok(compare({ magicPower: 5 }, {}, "ring", ["mago"]).includes("Classe incompatível"));
// The real delegated mouse and keyboard handlers must activate backpack cards.
vm.runInContext("showPaperTooltipPortal = slot => { window.shown = slot; }", context);
const card = {};
for (const name of ["mouseover", "focusin"]) {
  events[name]!({ target: { closest(selector: string) { assert.ok(selector.includes(".inventory-slot.filled")); return card; } } });
  assert.equal(vm.runInContext("window.shown", context), card);
}
console.log("equipmentComparison.test.ts: same-slot comparison, gains/losses, empty slots, restrictions, escaping and hover/focus passed");
