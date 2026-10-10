import { canEquipItem } from "../../../shared/src/equipment/equipmentRules.js";
import type { EquipmentItem, EquipmentSlot, EquipmentStats, HeroClass } from "../../../shared/src/types/equipment.js";
import { equipItem, loadInventory, saveInventory, unequipSlot, type InventoryEntry, type InventoryState } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import { loadProgress, saveProgress } from "../progression/progressionClient.js";
import { equipmentArt } from "../ui/equipmentArt.js";

const INVENTORY_SLOTS = 20;
const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: "Arma",
  armor: "Armadura",
  shield: "Mão secundária",
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

const STAT_LABELS: Record<keyof EquipmentStats, string> = {
  hp: "HP",
  mana: "Mana",
  attack: "ATQ",
  defense: "DEF",
  magicDefense: "DEF M",
  criticalChance: "Crítico",
  criticalDamage: "Dano crítico",
  dodgeChance: "Esquiva",
  magicPower: "Magia",
  speed: "Speed",
};

let tooltipPortal: HTMLDivElement | null = null;
let tooltipActiveSlot: HTMLElement | null = null;

declare global {
  interface Window {
    abrirInventario: () => void;
    equiparItemInventario: (itemId: string) => void;
    desequiparSlotInventario: (slot: EquipmentSlot) => void;
    venderItemInventario: (itemId: string) => void;
    abrirStatus: () => void;
    fecharPainelPraca: () => void;
    criarFichaPersonagemJRPG: () => { profile: string; attributes: string };
    criarPocoesInventario?: () => string;
    inventoryUxClassesLabel?: (item: EquipmentItem) => string;
    hidePaperTooltipPortal?: () => void;
    verItemMochila?: (id: string) => void;
    verEquipamentoInventario?: (slot: EquipmentSlot) => void;
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

function heroClass(): HeroClass {
  const value = (localStorage.getItem("classeHeroi") ?? "guerreiro").toLowerCase();
  return value === "mago" || value === "arqueiro" ? value : "guerreiro";
}

function equipState(item: EquipmentItem): { allowed: boolean; classAllowed: boolean; levelAllowed: boolean } {
  const cls = heroClass();
  const level = loadProgress().nivel;
  const subclass = getActiveSubclass(cls);
  const levelAllowed = level >= Math.max(1, item.level);
  const classAllowed = canEquipItem(item, cls, Math.max(level, item.level), subclass);
  return {
    allowed: canEquipItem(item, cls, level, subclass),
    classAllowed,
    levelAllowed,
  };
}

function classesLabel(item: EquipmentItem): string {
  if (item.requiredSubclass === "berserker") return "Berserk • Duas mãos";
  if (item.requiredSubclass === "assassin") return "Assassino";
  if (item.allowedClasses.includes("universal") && ["ring", "earring", "necklace"].includes(item.slot)) {
    return "Todas as classes";
  }
  const labels: Record<string, string> = {
    guerreiro: "Guerreiro",
    mago: "Mago",
    arqueiro: "Arqueiro",
    universal: "Todas as classes",
  };
  return item.allowedClasses
    .filter(cls => cls !== "universal")
    .map(cls => labels[cls] ?? cls)
    .join(", ") || "Nenhuma classe compatível";
}

function requirementsHtml(item: EquipmentItem): string {
  return `<small class="inventory-slot-description">Classe: ${escapeHtml(classesLabel(item))} • Nível ${Math.max(1, item.level)}</small>`;
}

function statsHtml(stats: EquipmentStats = {}): string {
  const entries = Object.entries(stats).filter(([, value]) => Number(value) !== 0) as Array<[keyof EquipmentStats, number]>;
  if (!entries.length) return '<div class="inventory-item-stats"><span class="inventory-item-stat">Sem bônus</span></div>';
  return `<div class="inventory-item-stats">${entries.map(([key, value]) => {
    const percentage = key === "criticalChance" || key === "criticalDamage" || key === "dodgeChance";
    return `<span class="inventory-item-stat">${escapeHtml(STAT_LABELS[key] ?? key)} ${value >= 0 ? "+" : ""}${value}${percentage ? "%" : ""}</span>`;
  }).join("")}</div>`;
}

function equippedEntries(inventory: InventoryState): Array<{ slot: EquipmentSlot; item: EquipmentItem }> {
  return Object.entries(inventory.equipped).flatMap(([slot, itemId]) => {
    const item = inventory.items.find(entry => entry.item.id === itemId)?.item;
    return item && equipState(item).allowed ? [{ slot: slot as EquipmentSlot, item }] : [];
  });
}

export function getBackpackEntries(inventory: InventoryState): InventoryEntry[] {
  return inventory.items.flatMap(entry => {
    const equippedQuantity = inventory.equipped[entry.item.slot] === entry.item.id ? 1 : 0;
    const quantity = entry.quantity - equippedQuantity;
    return quantity > 0 ? [{ ...entry, quantity }] : [];
  });
}

function comparisonHtml(item: EquipmentItem, inventory: InventoryState): string {
  const current = equippedEntries(inventory).find(entry => entry.slot === item.slot)?.item;
  const numeric = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
  const keys = (Object.keys(STAT_LABELS) as Array<keyof EquipmentStats>)
    .filter(key => numeric(item.stats?.[key]) || numeric(current?.stats?.[key]));
  const rows = keys.map(key => {
    const before = numeric(current?.stats?.[key]);
    const after = numeric(item.stats?.[key]);
    const delta = Math.round((after - before) * 100) / 100;
    const percentage = key === "criticalChance" || key === "criticalDamage" || key === "dodgeChance";
    return `<tr><th scope="row">${escapeHtml(STAT_LABELS[key])}</th><td>${before}${percentage ? "%" : ""}</td><td>${after}${percentage ? "%" : ""}</td><td class="comparison-${delta > 0 ? "gain" : delta < 0 ? "loss" : "same"}">${delta > 0 ? "+" : ""}${delta}${percentage ? " p.p." : ""}</td></tr>`;
  }).join("");
  const use = equipState(item);
  return `<div class="paper-tooltip inventory-comparison-source">
    <strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.description || "Sem descrição.")}</p>${requirementsHtml(item)}
    <p>Comparação: ${escapeHtml(SLOT_LABELS[item.slot] ?? item.slot)}</p><p>Equipado: ${current ? escapeHtml(current.name) : "Slot vazio"}</p>
    ${!use.allowed ? `<p class="inventory-restriction">${use.classAllowed ? `Requer nível ${Math.max(1, item.level)}` : "Classe incompatível"}</p>` : ""}
    <table class="inventory-comparison-table"><thead><tr><th>Atributo</th><th>Atual</th><th>Item</th><th>Troca</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Sem bônus de atributos</td></tr>'}</tbody></table>
    ${current?.uniqueEffect ? `<p>Efeito atual: ${escapeHtml(current.uniqueEffect.name)} — ${escapeHtml(current.uniqueEffect.description)}</p>` : ""}
    ${item.uniqueEffect ? `<p>Efeito do item: ${escapeHtml(item.uniqueEffect.name)} — ${escapeHtml(item.uniqueEffect.description)}</p>` : ""}
    <p class="comparison-note">Diferença dos bônus da peça. Percentuais são comparados em pontos percentuais.</p>
  </div>`;
}

function itemSlot(entry: InventoryEntry | undefined, index: number, inventory: InventoryState): string {
  if (!entry) return `<div class="inventory-slot empty"><span>${index + 1}</span></div>`;
  const { item, quantity } = entry;
  const use = equipState(item);
  const restriction = !use.classAllowed ? "Classe incompatível" : !use.levelAllowed ? `Requer nível ${Math.max(1, item.level)}` : "";
  return `<div tabindex="0" role="button" aria-label="${escapeHtml(item.name)} — ver detalhes" data-inventory-action="details" data-item-id="${escapeHtml(item.id)}" class="inventory-slot filled rarity-${item.rarity}${use.allowed ? "" : " locked"}${use.classAllowed ? "" : " class-incompatible"}">
    <span class="inventory-slot-index">${index + 1}</span>${equipmentArt(item)}<strong>${escapeHtml(item.name)}</strong>
    ${quantity > 1 ? `<small class="backpack-quantity">x${quantity}</small>` : ""}<em>${escapeHtml(RARITY_LABELS[item.rarity] ?? item.rarity)}</em>
    ${requirementsHtml(item)}${statsHtml(item.stats)}<small class="inventory-slot-description">${escapeHtml(item.description || "Sem descrição.")}</small>
    ${restriction ? `<small class="inventory-restriction">${escapeHtml(restriction)}</small>` : ""}${comparisonHtml(item, inventory)}
    <div class="inventory-slot-actions"><button type="button" data-inventory-action="equip" data-item-id="${escapeHtml(item.id)}" ${use.allowed ? "" : "disabled"}>Equipar</button>
      <button type="button" data-inventory-action="sell" data-item-id="${escapeHtml(item.id)}">Vender ${Math.max(0, item.sellPrice)}g</button></div>
  </div>`;
}

export function openInventory(): void {
  const panel = document.getElementById("painelPraca");
  if (!panel) return;
  hidePaperTooltipPortal();

  const inventory = loadInventory();
  const equipped = equippedEntries(inventory);
  const backpack = getBackpackEntries(inventory);
  const itemSlots = Array.from({ length: INVENTORY_SLOTS }, (_, index) => itemSlot(backpack[index], index, inventory)).join("");
  const equipmentSlots = (Object.entries(SLOT_LABELS) as Array<[EquipmentSlot, string]>).map(([slot, label]) => {
    const current = equipped.find(entry => entry.slot === slot);
    const rarity = current?.item.rarity ?? "common";
    return `<button type="button" class="equipment-slot${current ? ` occupied rarity-${rarity}` : ""}" ${current ? `aria-label="${escapeHtml(`${label}: ${current.item.name}`)}" data-inventory-action="equipped-details" data-slot="${slot}"` : "disabled"}>
      <span>${label}</span>${current ? equipmentArt(current.item) : ""}<strong>${current ? escapeHtml(current.item.name) : "Vazio"}</strong>
      ${current ? '<span class="item-equipped-badge">✓ Equipado</span>' : ""}
      ${current ? `<div class="paper-tooltip" role="tooltip"><div class="paper-tooltip-header"><strong>${escapeHtml(current.item.name)}</strong><span>${escapeHtml(RARITY_LABELS[rarity] ?? rarity)}</span></div><p>${escapeHtml(current.item.description || "Sem descrição.")}</p>${requirementsHtml(current.item)}${statsHtml(current.item.stats)}<small>Clique ou toque para ver detalhes e desequipar.</small></div><small>Clique para desequipar</small>` : ""}
    </button>`;
  }).join("");

  const sheet = window.criarFichaPersonagemJRPG?.() ?? { profile: "", attributes: "" };
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="jrpg-sheet" data-view="inventory">
    <header class="jrpg-sheet-header"><div><span class="panel-kicker">Mochila do aventureiro</span><h2>Inventário</h2></div>
      <nav aria-label="Tela do personagem"><button type="button" data-inventory-action="status">Status</button><button type="button" data-inventory-action="close">Fechar</button></nav></header>
    <div class="jrpg-sheet-columns">${sheet.profile}${sheet.attributes}
      <section class="jrpg-loadout"><h3 class="section-title">Equipamentos</h3><p class="inventory-help">Passe o mouse ou use Tab para ver os atributos. Clique ou toque para abrir os detalhes.</p><div class="equipment-grid" aria-label="Set equipado">${equipmentSlots}</div><div id="equippedItemDetails" class="equipped-item-details" hidden></div>
        <div class="jrpg-backpack-heading"><h3 class="section-title">Mochila</h3><span class="inventory-capacity">${backpack.length}/${INVENTORY_SLOTS}</span></div>
        <p class="inventory-help">Passe o mouse ou use Tab para ver informações e comparar. Clique ou toque para equipar ou vender.</p><div class="inventory-grid">${itemSlots}</div><div id="backpackItemDetails" class="equipped-item-details" hidden></div>
        ${window.criarPocoesInventario?.() ?? ""}</section>
    </div></div>`;
  panel.scrollTop = 0;
}

function openBackpackDetails(id: string): void {
  const inventory = loadInventory();
  const entry = getBackpackEntries(inventory).find(candidate => candidate.item.id === id);
  const detail = document.getElementById("backpackItemDetails");
  if (!entry || !detail) return;
  hidePaperTooltipPortal();
  const use = equipState(entry.item);
  detail.hidden = false;
  detail.innerHTML = `${comparisonHtml(entry.item, inventory).replace('class="paper-tooltip inventory-comparison-source"', 'class="backpack-detail-content"')}
    <button type="button" data-inventory-action="equip" data-item-id="${escapeHtml(id)}" ${use.allowed ? "" : "disabled"}>Equipar</button>
    <button type="button" data-inventory-action="sell" data-item-id="${escapeHtml(id)}">Vender ${Math.max(0, entry.item.sellPrice)}g</button>
    <button type="button" data-inventory-action="hide-details">Fechar detalhes</button>`;
  detail.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
}

function openEquippedDetails(slot: EquipmentSlot): void {
  const inventory = loadInventory();
  const entry = equippedEntries(inventory).find(candidate => candidate.slot === slot);
  const detail = document.getElementById("equippedItemDetails");
  if (!entry || !detail) return;
  hidePaperTooltipPortal();
  detail.hidden = false;
  detail.innerHTML = `<h4>${escapeHtml(entry.item.name)}</h4><p>${escapeHtml(entry.item.description || "Sem descrição.")}</p>${requirementsHtml(entry.item)}${statsHtml(entry.item.stats)}
    <button type="button" data-inventory-action="unequip" data-slot="${slot}">Desequipar</button><button type="button" data-inventory-action="hide-details">Fechar detalhes</button>`;
  detail.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
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

  const gold = Math.max(0, Math.floor(entry.item.sellPrice));
  entry.quantity -= 1;
  if (entry.quantity <= 0) inventory.items.splice(index, 1);
  saveInventory(inventory);
  const progress = loadProgress();
  progress.ouro += gold;
  saveProgress(progress);
  openInventory();
}

function ensureTooltipPortal(): HTMLDivElement {
  if (tooltipPortal?.isConnected) return tooltipPortal;
  tooltipPortal = document.createElement("div");
  tooltipPortal.id = "paperTooltipPortal";
  tooltipPortal.className = "paper-tooltip paper-tooltip-portal";
  tooltipPortal.setAttribute("role", "tooltip");
  tooltipPortal.setAttribute("aria-hidden", "true");
  document.body.appendChild(tooltipPortal);
  return tooltipPortal;
}

function positionTooltipPortal(slot: HTMLElement): void {
  const portal = ensureTooltipPortal();
  const rect = slot.getBoundingClientRect();
  const margin = 12;
  const gap = 10;
  const width = Math.min(slot.matches(".inventory-slot") ? 380 : 300, window.innerWidth - margin * 2);
  portal.style.width = `${width}px`;
  portal.style.maxHeight = `${Math.min(420, window.innerHeight - margin * 2)}px`;
  const portalRect = portal.getBoundingClientRect();
  const height = Math.min(portalRect.height || portal.scrollHeight || 320, window.innerHeight - margin * 2);
  let left = rect.right + gap;
  if (left + width > window.innerWidth - margin) left = rect.left - width - gap;
  if (left < margin) left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
  const top = Math.max(margin, Math.min(rect.top + rect.height / 2 - height / 2, window.innerHeight - height - margin));
  portal.style.left = `${Math.round(left)}px`;
  portal.style.top = `${Math.round(top)}px`;
}

function showTooltipPortal(slot: HTMLElement): void {
  const detail = document.getElementById("equippedItemDetails");
  if (detail && !detail.hidden && slot.matches(".equipment-slot")) return;
  const backpackDetail = document.getElementById("backpackItemDetails");
  if (backpackDetail && !backpackDetail.hidden && slot.matches(".inventory-slot")) return;
  const source = slot.querySelector<HTMLElement>(".paper-tooltip");
  if (!source) return;
  const portal = ensureTooltipPortal();
  const rarityClass = Array.from(slot.classList).find(className => className.startsWith("paper-rarity-"));
  portal.className = "paper-tooltip paper-tooltip-portal";
  if (slot.matches(".inventory-slot")) portal.classList.add("inventory-comparison-portal");
  if (rarityClass) portal.classList.add(rarityClass);
  portal.innerHTML = source.innerHTML;
  portal.classList.add("is-visible");
  portal.setAttribute("aria-hidden", "false");
  tooltipActiveSlot = slot;
  positionTooltipPortal(slot);
}

export function hidePaperTooltipPortal(): void {
  if (!tooltipPortal) return;
  tooltipPortal.classList.remove("is-visible");
  tooltipPortal.setAttribute("aria-hidden", "true");
  tooltipActiveSlot = null;
}

function closestTooltipSlot(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(".paper-slot-filled, .inventory-slot.filled, .equipment-slot.occupied") : null;
}

document.addEventListener("click", event => {
  const actionElement = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-inventory-action]") : null;
  if (!actionElement) return;
  const action = actionElement.dataset.inventoryAction;
  if (action === "details") openBackpackDetails(actionElement.dataset.itemId ?? "");
  else if (action === "equipped-details") openEquippedDetails(actionElement.dataset.slot as EquipmentSlot);
  else if (action === "equip") equipInventoryItem(actionElement.dataset.itemId ?? "");
  else if (action === "sell") sellInventoryItem(actionElement.dataset.itemId ?? "");
  else if (action === "unequip") unequipInventorySlot(actionElement.dataset.slot as EquipmentSlot);
  else if (action === "status") window.abrirStatus();
  else if (action === "close") window.fecharPainelPraca();
  else if (action === "hide-details") {
    const detail = actionElement.closest<HTMLElement>(".equipped-item-details");
    if (detail) detail.hidden = true;
  }
});

document.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-inventory-action="details"]') : null;
  if (!item || event.target !== item) return;
  event.preventDefault();
  openBackpackDetails(item.dataset.itemId ?? "");
});

document.addEventListener("mouseover", event => {
  const slot = closestTooltipSlot(event.target);
  if (slot && slot !== tooltipActiveSlot) showTooltipPortal(slot);
});

document.addEventListener("mouseout", event => {
  const related = event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (tooltipPortal?.contains(event.target instanceof Node ? event.target : null)) {
    if (!tooltipPortal.contains(related) && !tooltipActiveSlot?.contains(related)) hidePaperTooltipPortal();
    return;
  }
  if (tooltipPortal?.contains(related)) return;
  const slot = closestTooltipSlot(event.target);
  if (!slot || (related && slot.contains(related))) return;
  if (slot === tooltipActiveSlot && !slot.matches(":focus-within")) hidePaperTooltipPortal();
});

document.addEventListener("focusin", event => {
  const slot = closestTooltipSlot(event.target);
  if (slot) showTooltipPortal(slot);
});

document.addEventListener("focusout", event => {
  const slot = closestTooltipSlot(event.target);
  const related = event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (!slot || (related && slot.contains(related))) return;
  if (slot === tooltipActiveSlot && !slot.matches(":hover")) hidePaperTooltipPortal();
});

window.addEventListener("resize", () => {
  if (tooltipActiveSlot?.isConnected) positionTooltipPortal(tooltipActiveSlot);
  else hidePaperTooltipPortal();
});
window.addEventListener("scroll", () => {
  if (tooltipActiveSlot?.isConnected) positionTooltipPortal(tooltipActiveSlot);
}, true);

window.abrirInventario = openInventory;
window.equiparItemInventario = equipInventoryItem;
window.desequiparSlotInventario = unequipInventorySlot;
window.venderItemInventario = sellInventoryItem;
window.inventoryUxClassesLabel = classesLabel;
window.hidePaperTooltipPortal = hidePaperTooltipPortal;
window.verItemMochila = openBackpackDetails;
window.verEquipamentoInventario = openEquippedDetails;
