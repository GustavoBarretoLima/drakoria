import assert from "node:assert/strict";
import { prepareNextMonster, clearBattleStorage } from "../client/src/battle/victoryNavigation.js";
import { DUNGEON_CONFIG } from "../shared/src/dungeons/dungeonEncounters.js";
import { getMonsterById } from "../server/src/modules/monsters/monsterService.js";
import { renderVictoryRewardOverlay } from "../client/src/ui/rewardOverlay.js";
import type { RewardResult } from "../client/src/progression/progressionClient.js";

const saved = new Map<string, string>();
const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), removeItem: (key: string) => saved.delete(key) };
for (const config of Object.values(DUNGEON_CONFIG)) for (const random of [0, 0.199, 0.20, 0.99]) {
  saved.clear(); saved.set("dungeonAtual", config.id);
  saved.set("drakoriaProgresso", '{"nivel":15,"ouro":120}'); saved.set("drakoriaInventario", '{"items":[]}');
  prepareNextMonster(storage, () => random);
  const monster = getMonsterById(saved.get("monsterIdAtual")!)!;
  assert.ok(monster); assert.equal(saved.get("dungeonAtual"), config.id);
  assert.equal(saved.get("tipoBatalhaAtual"), config.id);
  assert.ok(monster.level >= config.minLevel && monster.level <= config.maxLevel);
  if (config.eliteChance) assert.equal(monster.rank, random < 0.20 ? "elite" : "normal");
  assert.equal(saved.get("drakoriaProgresso"), '{"nivel":15,"ouro":120}');
  clearBattleStorage(storage);
  assert.equal(saved.size, 2); assert.ok(saved.has("drakoriaInventario"));
}
for (const id of [null, "historia-goblin-inicial", "invalid", "dungeon-orc-1-5", "dungeon-orc-5-15", "dungeon-mini-boss-orc"]) {
  saved.clear(); if (id) saved.set("tipoBatalhaAtual", id);
  prepareNextMonster(storage, () => 0);
  assert.ok(getMonsterById(saved.get("monsterIdAtual")!));
}

// Small DOM harness exercises rendered actions and protects against double clicks.
class Element {
  id = ""; className = ""; textContent = ""; type = ""; disabled = false;
  children: Element[] = []; parent: Element | null = null;
  attributes = new Map<string, string>(); listeners = new Map<string, Array<(event: any) => void>>();
  classList = { add: (name: string) => { this.className += ` ${name}`; } };
  append(...children: Element[]) { for (const child of children) this.appendChild(child); }
  appendChild(child: Element) { child.parent = this; this.children.push(child); return child; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  addEventListener(key: string, listener: (event: any) => void) { this.listeners.set(key, [...(this.listeners.get(key) ?? []), listener]); }
  click() { for (const listener of this.listeners.get("click") ?? []) listener({}); }
  focus() { documentStub.activeElement = this; }
}
const body = new Element();
function all(element: Element): Element[] { return [element, ...element.children.flatMap(all)]; }
const documentStub = { body, activeElement: null as Element | null, createElement: () => new Element(), getElementById: (id: string) => all(body).find(el => el.id === id) ?? null };
const frames: Array<() => void> = [];
Object.defineProperty(globalThis, "document", { value: documentStub, configurable: true });
Object.defineProperty(globalThis, "requestAnimationFrame", { value: (callback: () => void) => { frames.push(callback); return frames.length; }, configurable: true });
const result: RewardResult = { levelsGained: 1, progress: { goblinInicialDerrotado: true, entrouEmDrakoria: true, dungeonsLiberadas: [], missoesConcluidas: [], nivel: 2, xp: 10, xpParaProximoNivel: 150, ouro: 50 } };
let next = 0; let city = 0;
function render() {
  renderVictoryRewardOverlay({ xp: 15, gold: 8 }, result, [{ name: "Cajado Rúnico", rarity: "rare" }], { onNextMonster: () => next++, onReturnToCity: () => city++ });
  while (frames.length) frames.shift()!();
}
render();
const overlay = documentStub.getElementById("battleRewardOverlay")!;
assert.equal(overlay.attributes.get("role"), "dialog");
assert.equal(overlay.attributes.get("aria-modal"), "true");
const buttons = all(overlay).filter(el => el.type === "button");
assert.deepEqual(buttons.map(button => button.textContent), ["Continuar explorando", "Sair da dungeon"]);
assert.equal(documentStub.activeElement, buttons[0]);
assert.ok(all(overlay).some(el => el.textContent.includes("Cajado Rúnico")));
buttons[0]!.click(); buttons[0]!.click(); buttons[1]!.click();
assert.equal(next, 1); assert.equal(city, 0); assert.ok(buttons.every(button => button.disabled));
render();
assert.equal(all(body).filter(el => el.id === "battleRewardOverlay").length, 1);
const newButtons = all(body).filter(el => el.type === "button");
newButtons[1]!.click(); newButtons[0]!.click(); assert.equal(city, 1); assert.equal(next, 1);
renderVictoryRewardOverlay({ xp: 50, gold: 20 }, result, [], { onNextMonster: () => next++, onReturnToCity: () => city++, danger: true, bossName: "Hidra da Corrupção", regionName: "Pântano Corrompido", exitLabel: "Voltar ao mapa" });
assert.ok(all(body).some(el => el.textContent.includes("Hidra da Corrupção")));
assert.ok(all(body).some(el => el.textContent === "Enfrentar Hidra da Corrupção"));
renderVictoryRewardOverlay({ xp: 50, gold: 20 }, result, [], { onNextMonster: () => next++, onReturnToCity: () => city++, bossDefeated: true, bossName: "Lobo Mutante", regionName: "Floresta Sombria", exitLabel: "Voltar ao mapa" });
assert.ok(all(body).some(el => el.textContent.includes("Floresta Sombria: Lobo Mutante foi derrotado")));
assert.deepEqual(all(body).filter(el => el.type === "button").map(el => el.textContent), ["Voltar ao mapa"]);
console.log("Passed: victory buttons, keyboard focus, single action, all dungeon continuations, elite odds, legacy/story fallback and rewards/inventory preservation.");

let prepared=0;let square=0;
renderVictoryRewardOverlay({xp:1,gold:1},result,[],{
 onNextMonster:()=>next++,onReturnToCity:()=>city++,onReturnToSquare:()=>square++,danger:true,bossName:"Coveiro Maldito",
 expedition:{xp:80,gold:40,loot:[{name:"Espada",quantity:2}],battles:[]},victories:5,depth:6,
 preparationPotions:[{label:"Elixir",count:1,use:()=>{prepared++;return {used:true,remaining:0,vitals:{hp:100,mana:50,maxHp:100,maxMana:50}};}}],
});
const prep=all(body).find(el=>el.textContent==="Usar Elixir (1)")!;prep.click();assert.equal(prepared,1);assert.equal(prep.textContent,"Usar Elixir (0)");assert.equal(prep.disabled,true);
assert.ok(all(body).some(el=>el.textContent.includes("80 XP • 40 ouro")));
assert.ok(all(body).some(el=>el.textContent==="2× Espada"));
all(body).find(el=>el.textContent==="Retornar à cidade")!.click();
all(body).find(el=>el.textContent==="Enfrentar Coveiro Maldito")!.click();assert.equal(square,1);assert.equal(next,1);
