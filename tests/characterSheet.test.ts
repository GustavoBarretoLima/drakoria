import assert from "node:assert/strict";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.js";
import { applySubclassStats } from "../shared/src/classes/subclasses.js";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { getTestCharacterEquipment } from "../shared/src/testing/testCharacter.js";
import { createBerserkAxe } from "../shared/src/equipment/berserkWeapons.js";

const items = getTestCharacterEquipment("guerreiro")
  .filter(item => item.slot !== "shield")
  .map(item => item.slot === "weapon" ? createBerserkAxe(item) : item);
const inventory = {
  items: items.map(item => ({ item, quantity: item.slot === "ring" ? 2 : 1 })),
  equipped: Object.fromEntries(items.map(item => [item.slot, item.id])),
};
const data = new Map<string, string>([
  ["classeHeroi", "guerreiro"],
  ["classeHeroiTexto", "Guerreiro"],
  ["generoHeroi", "masculino"],
  ["nomeHeroi", "<Taichou>"],
  ["drakoriaInventario", JSON.stringify(inventory)],
  ["drakoriaHeroVitals", '{"hp":37,"mana":8}'],
  ["drakoriaProgresso", '{"nivel":20,"xp":12,"xpParaProximoNivel":500,"ouro":90}'],
  ["drakoriaSubclassProgress", '{"activeSubclass":"berserker","books":{},"treeRanks":{},"equippedSkills":[],"berserkTreeVersion":2}'],
]);
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  },
  configurable: true,
});

const panel = { innerHTML: "", scrollTop: 0, classList: { remove() {}, add() {} } };
const listeners: Record<string, Array<(event: any) => void>> = {};
const documentStub = {
  getElementById: (id: string) => id === "painelPraca" ? panel : null,
  addEventListener(name: string, handler: (event: any) => void) { (listeners[name] ??= []).push(handler); },
  createElement() { return { id: "", className: "", style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, getBoundingClientRect: () => ({ height: 0 }), scrollHeight: 0 }; },
  body: { appendChild() {} },
};
Object.defineProperty(globalThis, "document", { value: documentStub, configurable: true });
const windowStub: any = {
  addEventListener() {},
  innerWidth: 1280,
  innerHeight: 720,
  fecharPainelPraca() {},
  criarPocoesInventario: () => "",
};
Object.defineProperty(globalThis, "window", { value: windowStub, configurable: true });

const { openStatus } = await import("../client/src/pages/statusLevelScaling.js");
const { openInventory } = await import("../client/src/pages/statusInventoryUx.js");

const before = JSON.stringify(Object.fromEntries(data));
openStatus();
assert.ok(panel.innerHTML.includes("37/"));
assert.ok(panel.innerHTML.includes("8/"));
assert.ok(panel.innerHTML.includes("&lt;Taichou&gt;"));
assert.ok(!panel.innerHTML.includes("<Taichou>"));
assert.ok(panel.innerHTML.includes("berserk_primal/idle.gif"));
const expected = applySubclassStats(applyEquipmentStats(createStatsForLevel("guerreiro", 20), items), "berserker");
assert.ok(panel.innerHTML.includes(`<dt>Ataque físico</dt><dd>${expected.attack}</dd>`));
assert.ok(panel.innerHTML.includes('data-status-action="subclass"'));

openInventory();
assert.ok(panel.innerHTML.includes(`<dt>Ataque físico</dt><dd>${expected.attack}</dd>`));
assert.ok(panel.innerHTML.includes("1/20"));
assert.ok(panel.innerHTML.includes("Equipar"));
assert.ok(panel.innerHTML.includes("Vender"));
assert.ok(panel.innerHTML.includes("inventory-comparison-source"));
assert.equal(JSON.stringify(Object.fromEntries(data)), before);
console.log("JRPG sheets: TypeScript status/inventory share build stats, current resources, escaping, subclass sprite and spare ownership.");
