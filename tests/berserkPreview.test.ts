import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { applySubclassStats, SUBCLASS_DEFINITIONS, SUBCLASS_IDS } from "../shared/src/classes/subclasses.js";
import { useSubclassBook } from "../client/src/progression/subclassClient.js";

const storage = new Map<string, string>();
const localStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) };
Object.assign(globalThis, { localStorage });
const handlers: Record<string, (event?: any) => void> = {};
const panel = { innerHTML: "", scrollTop: 99, classList: { remove() {}, add() {} },
  querySelector: (selector: string) => ({ focus() {}, textContent: "", addEventListener: (_: string, handler: any) => { handlers[selector] = handler; } }),
  querySelectorAll: () => [] };
const current = createStatsForLevel("guerreiro", 20);
current.attack += 50; // Preview includes equipped attack, rather than class defaults alone.
let syncs = 0;
const context = vm.createContext({ localStorage, window: {}, document: { getElementById: () => panel },
  SUBCLASS_DEFINITIONS, SUBCLASS_IDS, applySubclassStats, useSubclassBook, SPRITE_BOUNDS: {},
  getCurrentHeroStats: () => current, syncCharacterVitals: () => syncs++,
  getHeroGifs: (_: string, gender: string, id?: string) => ({ padrao: `img/personagens/${id === "berserker" ? "berserk_primal" : gender === "Feminino" ? "guerreira_anime" : "heroi_anime"}/idle.gif` }) });
const code = readFileSync("js/subclass-books.js", "utf8").replace(/import[\s\S]*?from\s+"[^"]+";/g, "");
vm.runInContext(code, context);
function seed() { storage.clear(); storage.set("classeHeroi", "guerreiro"); storage.set("drakoriaSubclassProgress", JSON.stringify({ books: { berserker: 1 } })); }
seed();
vm.runInContext('useBook("berserker")', context);
assert.ok(panel.innerHTML.includes("heroi_anime/idle.gif"));
assert.ok(panel.innerHTML.includes("berserk_primal/idle.gif"));
assert.ok(panel.innerHTML.includes(`<td>${Math.floor(current.attack * 1.2)}`));
assert.ok(panel.innerHTML.includes(`<td>${Math.floor(current.defense * .9)}`));
assert.ok(panel.innerHTML.includes("+20 p.p."));
assert.ok(panel.innerHTML.includes("Guarda imprudente"));
assert.equal(JSON.parse(storage.get("drakoriaSubclassProgress")!).books.berserker, 1);
handlers["[data-preview-cancel]"]!();
assert.equal(JSON.parse(storage.get("drakoriaSubclassProgress")!).activeSubclass, undefined);
vm.runInContext('useBook("berserker")', context);
const confirm = handlers["[data-preview-confirm]"]!;
confirm({ currentTarget: {} }); confirm({ currentTarget: {} });
assert.equal(syncs, 1);
assert.equal(JSON.parse(storage.get("drakoriaSubclassProgress")!).books.berserker, 0);
assert.equal(JSON.parse(storage.get("drakoriaSubclassProgress")!).activeSubclass, "berserker");
seed(); storage.set("generoHeroi", "feminino"); vm.runInContext('useBook("berserker")', context);
assert.ok(panel.innerHTML.includes("guerreira_anime/idle.gif"));
storage.set("classeHeroi", "mago"); panel.innerHTML = "unchanged";
vm.runInContext('useBook("berserker")', context); assert.equal(panel.innerHTML, "unchanged");
const gifsCode = readFileSync("client/src/assets/gifs.ts", "utf8");
for (const action of ["idle", "attack", "damage", "death"]) {
 assert.ok(gifsCode.includes(`berserk_primal/${action}.gif`));
 assert.ok(existsSync(`img/personagens/berserk_primal/${action}.gif`));
}
console.log("Berserk preview: equipped stats, penalties, portraits, cancellation, confirmation, duplicate clicks and class restrictions passed.");
