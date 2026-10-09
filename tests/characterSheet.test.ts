import { getForgeSet } from "../shared/src/equipment/forgeSets.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.js";
import { canonicalEquipment, canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { applySubclassStats, SUBCLASS_DEFINITIONS } from "../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../shared/src/classes/skillTrees.js";
import { getTestCharacterEquipment } from "../shared/src/testing/testCharacter.js";
import { createBerserkAxe } from "../shared/src/equipment/berserkWeapons.js";
const items = getTestCharacterEquipment("guerreiro").filter(item => item.slot !== "shield").map(item => item.slot === "weapon" ? createBerserkAxe(item) : item);
const inventory = { items: items.map(item => ({ item, quantity: item.slot === "ring" ? 2 : 1 })), equipped: Object.fromEntries(items.map(item => [item.slot, item.id])) };
const data: Record<string,string> = { classeHeroi: "guerreiro", nomeHeroi: "<Taichou>", drakoriaInventario: JSON.stringify(inventory), drakoriaHeroVitals: '{"hp":37,"mana":8}', drakoriaSubclassProgress: '{"activeSubclass":"berserker","books":{}}' };
const panel = { innerHTML: "", classList: { remove() {}, add() {} } };
const window: any = { addEventListener() {}, progressoDrakoria: { carregarProgresso: () => ({ nivel: 20, xp: 12, xpParaProximoNivel: 500, ouro: 90 }) } };
const context = vm.createContext({ getForgeSet, window, document: { getElementById: () => panel, addEventListener() {} },
 localStorage: { getItem: (key: string) => data[key] || null }, createStatsForLevel, applyEquipmentStats, canonicalEquipment, canEquipItem,
 applySubclassStats, SUBCLASS_DEFINITIONS, applyTreeStats, getTreeRanks: () => ({}), getClassSkills: () => [] });
vm.runInContext(readFileSync("js/status-level-scaling.js", "utf8").replace(/^import .*;\r?\n/gm,""), context);
vm.runInContext(readFileSync("js/inventory-backpack.js", "utf8"), context);
vm.runInContext(readFileSync("js/status-inventory-ux.js", "utf8"), context);
const before = JSON.stringify(data);
vm.runInContext("window.abrirStatus()", context);
assert.ok(panel.innerHTML.includes("37/")); assert.ok(panel.innerHTML.includes("8/"));
assert.ok(panel.innerHTML.includes("&lt;Taichou&gt;")); assert.ok(!panel.innerHTML.includes("<Taichou>"));
assert.ok(panel.innerHTML.includes("berserk_primal/idle.gif"));
const expected = applySubclassStats(applyEquipmentStats(createStatsForLevel("guerreiro",20),items),"berserker");
assert.ok(panel.innerHTML.includes(`<dt>Ataque físico</dt><dd>${expected.attack}</dd>`));
assert.ok(panel.innerHTML.includes('onclick="abrirArvoreSubclasse()"'));
vm.runInContext("window.abrirInventario()", context);
assert.ok(panel.innerHTML.includes(`<dt>Ataque físico</dt><dd>${expected.attack}</dd>`));
assert.ok(panel.innerHTML.includes("1/20")); // Only the spare ring appears in the backpack.
assert.ok(panel.innerHTML.includes("Equipar")); assert.ok(panel.innerHTML.includes("Vender"));
assert.ok(panel.innerHTML.includes("inventory-comparison-source"));
assert.equal(JSON.stringify(data), before); // Rendering never heals, consumes, or rewrites the save.
console.log("JRPG sheets: shared build stats, current resources, escaping, subclass sprite, spare ownership and comparison preserved.");
