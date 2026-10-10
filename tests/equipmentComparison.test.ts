import assert from "node:assert/strict";
import type { EquipmentItem, EquipmentSlot, EquipmentStats, HeroClass } from "../shared/src/types/equipment.js";

const saved = new Map<string, string>([
  ["classeHeroi", "guerreiro"],
  ["drakoriaProgresso", '{"nivel":25,"xp":0,"xpParaProximoNivel":100,"ouro":0}'],
]);
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  },
  configurable: true,
});

const events = new Set<string>();
const panel = { innerHTML: "", scrollTop: 0, classList: { remove() {} } };
const documentStub = {
  addEventListener(name: string) { events.add(name); },
  getElementById: (id: string) => id === "painelPraca" ? panel : null,
  createElement() { return { id: "", className: "", style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, getBoundingClientRect: () => ({ height: 0 }), scrollHeight: 0 }; },
  body: { appendChild() {} },
};
Object.defineProperty(globalThis, "document", { value: documentStub, configurable: true });
const windowStub: any = {
  addEventListener() {},
  innerWidth: 1280,
  innerHeight: 720,
  abrirStatus() {},
  fecharPainelPraca() {},
  criarFichaPersonagemJRPG: () => ({ profile: "", attributes: "" }),
  criarPocoesInventario: () => "",
};
Object.defineProperty(globalThis, "window", { value: windowStub, configurable: true });

const { openInventory } = await import("../client/src/pages/statusInventoryUx.js");

function item(
  id: string,
  name: string,
  slot: EquipmentSlot,
  stats: EquipmentStats,
  classes: HeroClass[] = ["guerreiro"],
): EquipmentItem {
  return {
    id,
    name,
    description: "Item de teste",
    slot,
    rarity: "common",
    level: 1,
    sellPrice: 10,
    allowedClasses: classes,
    stats,
    icon: "/img/itens/loot_monstros/icones_128/orc-iron-axe.png",
  };
}

function compare(
  stats: EquipmentStats,
  currentStats: EquipmentStats,
  equippedSlot: EquipmentSlot = "ring",
  classes: HeroClass[] = ["guerreiro"],
): string {
  const next = item("new", "<Anel novo>", "ring", stats, classes);
  const current = item("old", "Anel atual", equippedSlot, currentStats);
  saved.set("drakoriaInventario", JSON.stringify({
    items: [{ item: current, quantity: 1 }, { item: next, quantity: 1 }],
    equipped: { [equippedSlot]: current.id },
  }));
  openInventory();
  return panel.innerHTML;
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
assert.ok(compare({}, {}).includes("Sem bônus de atributos"));
assert.ok(compare({ magicPower: 5 }, {}, "ring", ["mago"]).includes("Classe incompatível"));
assert.ok(html.includes('tabindex="0"'));
assert.ok(html.includes('data-inventory-action="details"'));
for (const eventName of ["click", "keydown", "mouseover", "focusin"]) assert.ok(events.has(eventName));
console.log("equipmentComparison.test.ts: TypeScript comparison gains/losses, empty slots, restrictions, escaping and delegated interactions passed");
