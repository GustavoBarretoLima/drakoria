import { canEquipItem } from "../../../shared/src/equipment/equipmentRules.js";
import type { EquipmentItem, EquipmentSlot, HeroClass } from "../../../shared/src/types/equipment.js";
import { equipItem, loadInventory, saveInventory, unequipSlot, type InventoryEntry, type InventoryState } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import { getCurrentHeroStats } from "../progression/heroStats.js";
import { loadProgress, saveProgress } from "../progression/progressionClient.js";

const INVENTORY_SLOTS = 20;
const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: "Arma",
  armor: "Armadura",
  shield: "Escudo",
  legs: "Perna",
  boots: "Bota",
  gloves: "Luva",
  earring: "Brinco",
  necklace: "Colar",
  ring: "Anel",
};

const RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

declare global {
  interface Window {
    abrirInventario: () => void;
    equiparItemInventario: (itemId: string) => void;
    desequiparSlotInventario: (slot: EquipmentSlot) => void;
    venderItemInventario: (itemId: string) => void;
    abrirStatus?: () => void;
    abrirLoja: () => void;
    abrirMissoes: () => void;
    fecharPainelPraca?: () => void;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function panel(): HTMLElement | null {
  return document.getElementById("painelPraca");
}

function heroClass(): HeroClass {
  const value = (localStorage.getItem("classeHeroi") ?? "guerreiro").toLowerCase();
  return value === "mago" || value === "arqueiro" ? value : "guerreiro";
}

function equippedEntries(inventory: InventoryState): Array<{ slot: EquipmentSlot; item: EquipmentItem }> {
  return Object.entries(inventory.equipped).flatMap(([slot, itemId]) => {
    const item = inventory.items.find(entry => entry.item.id === itemId)?.item;
    return item ? [{ slot: slot as EquipmentSlot, item }] : [];
  });
}

function backpackEntries(inventory: InventoryState): InventoryEntry[] {
  return inventory.items.flatMap(entry => {
    const equipped = inventory.equipped[entry.item.slot] === entry.item.id ? 1 : 0;
    const quantity = entry.quantity - equipped;
    return quantity > 0 ? [{ ...entry, quantity }] : [];
  });
}

function equipState(item: EquipmentItem): { allowed: boolean; classAllowed: boolean; levelAllowed: boolean } {
  const cls = heroClass();
  const level = loadProgress().nivel;
  const subclass = getActiveSubclass(cls);
  const levelAllowed = level >= item.level;
  const classAllowed = canEquipItem(item, cls, Math.max(level, item.level), subclass);
  return { allowed: classAllowed && levelAllowed, classAllowed, levelAllowed };
}

function inventorySlot(entry: InventoryEntry | undefined, index: number): string {
  if (!entry) return `<div class="inventory-slot empty"><span>${index + 1}</span></div>`;
  const { item, quantity } = entry;
  const use = equipState(item);
  const restriction = !use.classAllowed ? "Classe incompatível" : !use.levelAllowed ? `Requer nível ${item.level}` : "";
  return `<div class="inventory-slot filled rarity-${escapeHtml(item.rarity)}${use.allowed ? "" : " locked"}" title="${escapeHtml(item.description || item.name)}">
    <span class="inventory-slot-index">${index + 1}</span>
    <strong>${escapeHtml(item.name)}</strong>
    ${quantity > 1 ? `<small>x${quantity}</small>` : ""}
    <em>${escapeHtml(RARITY_LABELS[item.rarity] ?? item.rarity)}</em>
    ${restriction ? `<small class="inventory-restriction">${escapeHtml(restriction)}</small>` : ""}
    <div class="inventory-slot-actions">
      <button type="button" data-square-action="equip" data-item-id="${escapeHtml(item.id)}" ${use.allowed ? "" : "disabled"}>Equipar</button>
      <button type="button" data-square-action="sell" data-item-id="${escapeHtml(item.id)}">Vender ${Math.max(0, Number(item.sellPrice || 0))}g</button>
    </div>
  </div>`;
}

function openInventory(): void {
  const host = panel();
  if (!host) return;
  const inventory = loadInventory();
  const equipped = equippedEntries(inventory);
  const backpack = backpackEntries(inventory);
  const slots = Array.from({ length: INVENTORY_SLOTS }, (_, index) => inventorySlot(backpack[index], index)).join("");
  const equipment = Object.entries(SLOT_LABELS).map(([slot, label]) => {
    const current = equipped.find(entry => entry.slot === slot);
    return `<button type="button" class="equipment-slot${current ? " occupied" : ""}" ${current ? `data-square-action="unequip" data-slot="${slot}"` : "disabled"}>
      <span>${label}</span><strong>${current ? escapeHtml(current.item.name) : "Vazio"}</strong>${current ? "<small>Clique para desequipar</small>" : ""}
    </button>`;
  }).join("");
  host.classList.remove("hidden");
  host.innerHTML = `<div class="panel-header"><div><span class="panel-kicker">Mochila do aventureiro</span><h2>Inventário</h2></div><span class="inventory-capacity">${backpack.length}/${INVENTORY_SLOTS}</span></div>
    <h3 class="section-title">Equipamentos</h3><div class="equipment-grid">${equipment}</div>
    <h3 class="section-title">Itens</h3><p class="inventory-help">Itens podem exigir classe e nível. Equipamentos não equipados podem ser vendidos por ouro.</p>
    <div class="inventory-grid">${slots}</div><div class="painel-acoes"><button type="button" data-square-action="close">Fechar</button></div>`;
}

function equipInventoryItem(itemId: string): void {
  equipItem(itemId);
  openInventory();
}

function unequipInventorySlot(slot: EquipmentSlot): void {
  unequipSlot(slot);
  openInventory();
}

function sellInventoryItem(itemId: string): void {
  const inventory = loadInventory();
  const index = inventory.items.findIndex(entry => entry.item.id === itemId);
  if (index < 0) return;
  const entry = inventory.items[index];
  if (!entry || (inventory.equipped[entry.item.slot] === itemId && entry.quantity <= 1)) return;
  const gold = Math.max(0, Math.floor(Number(entry.item.sellPrice || 0)));
  entry.quantity -= 1;
  if (entry.quantity <= 0) inventory.items.splice(index, 1);
  saveInventory(inventory);
  const progress = loadProgress();
  progress.ouro += gold;
  saveProgress(progress);
  openInventory();
}

function openStatus(): void {
  const host = panel();
  if (!host) return;
  const progress = loadProgress();
  const stats = getCurrentHeroStats();
  const name = escapeHtml(localStorage.getItem("nomeHeroi") || "Herói");
  const classText = escapeHtml(localStorage.getItem("classeHeroiTexto") || heroClass());
  const gender = escapeHtml(localStorage.getItem("generoHeroi") || "Masculino");
  const equipped = equippedEntries(loadInventory());
  const equipment = Object.entries(SLOT_LABELS).map(([slot, label]) => {
    const current = equipped.find(entry => entry.slot === slot);
    return `<div class="status-equipment-row"><span>${label}</span><strong>${current ? escapeHtml(current.item.name) : "—"}</strong></div>`;
  }).join("");
  host.classList.remove("hidden");
  host.innerHTML = `<div class="panel-header status-header"><div><span class="panel-kicker">Ficha do aventureiro</span><h2>${name}</h2><p>${classText} • ${gender}</p></div><div class="level-badge"><span>Nível</span><strong>${progress.nivel}</strong></div></div>
    <div class="progress-summary"><div><span>EXP</span><strong>${progress.xp}/${progress.xpParaProximoNivel}</strong></div><div><span>Ouro</span><strong>${progress.ouro}</strong></div></div>
    <h3 class="section-title">Atributos</h3><div class="status-stats-grid"><div class="status-stat"><span>Ataque</span><strong>${stats.attack}</strong></div><div class="status-stat"><span>DEF</span><strong>${stats.defense}</strong></div><div class="status-stat"><span>DEF M</span><strong>${stats.magicDefense}</strong></div><div class="status-stat"><span>Magia</span><strong>${stats.magicPower}</strong></div><div class="status-stat"><span>Speed</span><strong>${stats.speed}</strong></div></div>
    <h3 class="section-title">Equipamentos</h3><div class="status-equipment-list">${equipment}</div><div class="painel-acoes"><button type="button" data-square-action="inventory">Abrir Inventário</button><button type="button" data-square-action="close">Fechar</button></div>`;
}

function openShopFallback(): void {
  const host = panel();
  if (!host) return;
  host.classList.remove("hidden");
  host.innerHTML = `<h2>Loja da Praça</h2><p>O mercador está preparando as mercadorias.</p><div class="painel-acoes"><button type="button" data-square-action="close">Fechar</button></div>`;
}

function openQuestsFallback(): void {
  const host = panel();
  if (!host) return;
  const completed = loadProgress().missoesConcluidas.includes("derrotar-goblin-inicial");
  host.classList.remove("hidden");
  host.innerHTML = `<h2>Quadro de Missões</h2><div class="missao-card"><h3>O caminho para Drakoria</h3><p>Derrote o Goblin que bloqueia a estrada e prove seu valor diante dos guardas.</p><strong>Status:</strong> ${completed ? "Concluída" : "Em andamento"}</div><div class="painel-acoes"><button type="button" data-square-action="close">Fechar</button></div>`;
}

function closePanel(): void {
  const host = panel();
  if (!host) return;
  host.classList.add("hidden");
  host.innerHTML = "";
}

function isEquipmentSlot(value: string | undefined): value is EquipmentSlot {
  return Boolean(value && Object.hasOwn(SLOT_LABELS, value));
}

document.addEventListener("click", event => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-square-action]");
  if (!button) return;
  const action = button.dataset.squareAction;
  if (action === "close") closePanel();
  else if (action === "inventory") openInventory();
  else if (action === "equip" && button.dataset.itemId) equipInventoryItem(button.dataset.itemId);
  else if (action === "sell" && button.dataset.itemId) sellInventoryItem(button.dataset.itemId);
  else if (action === "unequip" && isEquipmentSlot(button.dataset.slot)) unequipInventorySlot(button.dataset.slot);
});

window.abrirInventario = openInventory;
window.equiparItemInventario = equipInventoryItem;
window.desequiparSlotInventario = unequipInventorySlot;
window.venderItemInventario = sellInventoryItem;
window.abrirStatus = openStatus;
window.abrirLoja = openShopFallback;
window.abrirMissoes = openQuestsFallback;
window.fecharPainelPraca = closePanel;
