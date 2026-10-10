import assert from "node:assert/strict";
import { equipItem, unequipSlot, loadInventory, getEquippedItems } from "../client/src/inventory/inventoryClient.js";
import { STARTER_LOOT_ITEMS } from "../shared/src/loot/lootTables.js";

const saved = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  },
  configurable: true,
});
saved.set("classeHeroi", "guerreiro");
saved.set("drakoriaProgresso", '{"nivel":25,"xp":0,"xpParaProximoNivel":100,"ouro":0}');
const axe = STARTER_LOOT_ITEMS["orc-iron-axe"]!;
const sword = STARTER_LOOT_ITEMS["orc-warlord-sword"]!;
saved.set("drakoriaInventario", JSON.stringify({
  items: [{ item: axe, quantity: 2 }, { item: sword, quantity: 1 }],
  equipped: {},
}));

const panel = { innerHTML: "", scrollTop: 0, classList: { remove() {} } };
const documentStub = {
  addEventListener() {},
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

const { getBackpackEntries, openInventory } = await import("../client/src/pages/statusInventoryUx.js");
const backpack = () => getBackpackEntries(loadInventory());

equipItem(axe.id);
assert.equal(backpack().find(entry => entry.item.id === axe.id)?.quantity, 1);
assert.equal(getEquippedItems()[0]?.id, axe.id);
equipItem(sword.id);
assert.equal(backpack().some(entry => entry.item.id === sword.id), false);
assert.equal(backpack().find(entry => entry.item.id === axe.id)?.quantity, 2);
unequipSlot("weapon");
assert.equal(backpack().find(entry => entry.item.id === sword.id)?.quantity, 1);
assert.equal(loadInventory().items.reduce((sum, entry) => sum + entry.quantity, 0), 3);
assert.equal(getEquippedItems().length, 0);

windowStub.equiparItemInventario(sword.id);
const [loadoutHtml = "", backpackHtml = ""] = panel.innerHTML.split('<div class="inventory-grid">');
// The equipped sword is named in another item's comparison tooltip. Check
// actionable item IDs instead of treating any mention of its name as a copy.
assert.ok(backpackHtml.includes(`Equipado: ${sword.name}`));
assert.ok(!backpackHtml.includes(`data-item-id="${sword.id}"`));
assert.ok(backpackHtml.includes(`data-item-id="${axe.id}"`));
assert.ok(loadoutHtml.includes(sword.name));
windowStub.desequiparSlotInventario("weapon");
assert.ok(panel.innerHTML.split('<div class="inventory-grid">')[1]!.includes(`data-item-id="${sword.id}"`));

windowStub.equiparItemInventario(axe.id);
windowStub.venderItemInventario(axe.id);
assert.equal(loadInventory().items.find(entry => entry.item.id === axe.id)?.quantity, 1);
windowStub.venderItemInventario(axe.id);
assert.equal(loadInventory().items.find(entry => entry.item.id === axe.id)?.quantity, 1);
assert.equal(getEquippedItems()[0]?.id, axe.id);
openInventory();
assert.ok(panel.innerHTML.includes('data-inventory-action="unequip"') || panel.innerHTML.includes('data-inventory-action="equipped-details"'));
console.log("inventoryBackpack.test.ts: TypeScript backpack ownership, swap, unequip and equipped-copy sale protection passed");
