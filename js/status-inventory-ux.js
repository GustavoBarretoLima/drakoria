const INVENTORY_UX_KEY = "drakoriaInventario";
const INVENTORY_UX_SLOTS = 20;

const INVENTORY_UX_SLOT_LABELS = {
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

const INVENTORY_UX_RARITIES = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

const INVENTORY_UX_STAT_LABELS = {
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

function inventoryUxEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inventoryUxLoad() {
  try {
    const parsed = JSON.parse(localStorage.getItem(INVENTORY_UX_KEY) || "{}");
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      equipped: parsed.equipped || {},
    };
  } catch {
    return { items: [], equipped: {} };
  }
}

function inventoryUxSave(inventory) {
  localStorage.setItem(INVENTORY_UX_KEY, JSON.stringify(inventory));
}

function inventoryUxHeroClass() {
  const heroClass = (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase();
  return ["guerreiro", "mago", "arqueiro"].includes(heroClass)
    ? heroClass
    : "guerreiro";
}

function inventoryUxHeroLevel() {
  return window.progressoDrakoria?.carregarProgresso?.()?.nivel ?? 1;
}

function inventoryUxCanEquip(item) {
  const heroClass = inventoryUxHeroClass();
  const heroLevel = inventoryUxHeroLevel();
  const allowed = Array.isArray(item.allowedClasses)
    ? item.allowedClasses
    : ["universal"];
  const classAllowed = allowed.includes("universal") || allowed.includes(heroClass);
  const levelAllowed = heroLevel >= Math.max(1, Number(item.level || 1));
  return { allowed: classAllowed && levelAllowed, classAllowed, levelAllowed };
}

function inventoryUxStatsHtml(stats = {}) {
  const entries = Object.entries(stats).filter(([, value]) => Number(value) !== 0);
  if (!entries.length) {
    return '<div class="inventory-item-stats"><span class="inventory-item-stat">Sem bônus</span></div>';
  }

  return `<div class="inventory-item-stats">${entries
    .map(([key, rawValue]) => {
      const value = Number(rawValue);
      const percentage = ["criticalChance", "criticalDamage", "dodgeChance"].includes(key);
      const sign = value >= 0 ? "+" : "";
      const label = INVENTORY_UX_STAT_LABELS[key] || key;
      return `<span class="inventory-item-stat">${inventoryUxEscape(label)} ${sign}${value}${percentage ? "%" : ""}</span>`;
    })
    .join("")}</div>`;
}

function inventoryUxEquippedEntries(inventory) {
  return Object.entries(inventory.equipped)
    .map(([slot, itemId]) => {
      const entry = inventory.items.find((candidate) => candidate.item.id === itemId);
      return entry ? { slot, item: entry.item } : null;
    })
    .filter(Boolean);
}

function inventoryUxItemSlot(entry, index, inventory) {
  if (!entry) {
    return `<div class="inventory-slot empty"><span>${index + 1}</span></div>`;
  }

  const { item, quantity } = entry;
  const equipped = inventory.equipped[item.slot] === item.id;
  const use = inventoryUxCanEquip(item);
  const rarity = item.rarity || "common";
  let restriction = "";
  if (!use.classAllowed) restriction = "Classe incompatível";
  else if (!use.levelAllowed) restriction = `Requer nível ${Math.max(1, Number(item.level || 1))}`;

  return `
    <div class="inventory-slot filled rarity-${rarity}${equipped ? " equipped" : ""}${use.allowed ? "" : " locked"}">
      <span class="inventory-slot-index">${index + 1}</span>
      <strong>${inventoryUxEscape(item.name)}</strong>
      ${quantity > 1 ? `<small>x${quantity}</small>` : ""}
      <em>${inventoryUxEscape(INVENTORY_UX_RARITIES[rarity] || rarity)}</em>
      ${inventoryUxStatsHtml(item.stats)}
      <small class="inventory-slot-description">${inventoryUxEscape(item.description || "Sem descrição.")}</small>
      ${restriction ? `<small class="inventory-restriction">${inventoryUxEscape(restriction)}</small>` : ""}
      <div class="inventory-slot-actions">
        <button type="button" ${use.allowed ? `onclick="equiparItemInventario('${inventoryUxEscape(item.id)}')"` : "disabled"}>${equipped ? "Equipado" : "Equipar"}</button>
        <button type="button" ${equipped ? "disabled" : `onclick="venderItemInventario('${inventoryUxEscape(item.id)}')"`}>Vender ${Number(item.sellPrice || 0)}g</button>
      </div>
    </div>
  `;
}

function inventoryUxOpen() {
  const panel = document.getElementById("painelPraca");
  if (!panel) return;

  const inventory = inventoryUxLoad();
  const equipped = inventoryUxEquippedEntries(inventory);
  const itemSlots = Array.from({ length: INVENTORY_UX_SLOTS }, (_, index) =>
    inventoryUxItemSlot(inventory.items[index], index, inventory),
  ).join("");

  const equipmentSlots = Object.entries(INVENTORY_UX_SLOT_LABELS)
    .map(([slot, label]) => {
      const current = equipped.find((entry) => entry.slot === slot);
      const rarity = current?.item?.rarity || "common";
      return `
        <button type="button" class="equipment-slot${current ? ` occupied rarity-${rarity}` : ""}" ${current ? `onclick="desequiparSlotInventario('${slot}')"` : "disabled"}>
          <span>${label}</span>
          <strong>${current ? inventoryUxEscape(current.item.name) : "Vazio"}</strong>
          ${current ? inventoryUxStatsHtml(current.item.stats) : ""}
          ${current ? "<small>Clique para desequipar</small>" : ""}
        </button>
      `;
    })
    .join("");

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="panel-header">
      <div><span class="panel-kicker">Mochila do aventureiro</span><h2>Inventário</h2></div>
      <span class="inventory-capacity">${inventory.items.length}/${INVENTORY_UX_SLOTS}</span>
    </div>
    <h3 class="section-title">Equipamentos</h3>
    <p class="inventory-help">Os bônus de cada equipamento aparecem diretamente no slot.</p>
    <div class="equipment-grid">${equipmentSlots}</div>
    <h3 class="section-title">Itens</h3>
    <p class="inventory-help">Cada item mostra seus atributos, raridade e requisitos antes de ser equipado.</p>
    <div class="inventory-grid">${itemSlots}</div>
    <div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Fechar</button></div>
  `;
}

function inventoryUxEquip(itemId) {
  const inventory = inventoryUxLoad();
  const entry = inventory.items.find((candidate) => candidate.item.id === itemId);
  if (!entry || !inventoryUxCanEquip(entry.item).allowed) return;

  inventory.equipped[entry.item.slot] = itemId;
  inventoryUxSave(inventory);
  inventoryUxOpen();
}

function inventoryUxUnequip(slot) {
  const inventory = inventoryUxLoad();
  delete inventory.equipped[slot];
  inventoryUxSave(inventory);
  inventoryUxOpen();
}

function inventoryUxSell(itemId) {
  const inventory = inventoryUxLoad();
  const index = inventory.items.findIndex((candidate) => candidate.item.id === itemId);
  if (index < 0) return;

  const entry = inventory.items[index];
  if (!entry || inventory.equipped[entry.item.slot] === itemId) return;

  const gold = Math.max(0, Number(entry.item.sellPrice || 0));
  entry.quantity -= 1;
  if (entry.quantity <= 0) inventory.items.splice(index, 1);
  inventoryUxSave(inventory);
  window.progressoDrakoria?.adicionarRecompensa?.({ ouro: gold, xp: 0 });
  inventoryUxOpen();
}

function positionPaperTooltip(slot) {
  const tooltip = slot.querySelector(".paper-tooltip");
  if (!tooltip) return;

  const slotRect = slot.getBoundingClientRect();
  const margin = 12;
  const gap = 10;
  const tooltipWidth = Math.min(280, window.innerWidth - margin * 2);

  tooltip.style.setProperty("--paper-tooltip-left", `${margin}px`);
  tooltip.style.setProperty("--paper-tooltip-top", `${margin}px`);

  const tooltipHeight = Math.min(tooltip.scrollHeight || 320, window.innerHeight * 0.7, 420);
  let left = slotRect.right + gap;
  if (left + tooltipWidth > window.innerWidth - margin) {
    left = slotRect.left - tooltipWidth - gap;
  }
  if (left < margin) {
    left = Math.max(margin, (window.innerWidth - tooltipWidth) / 2);
  }

  let top = slotRect.top;
  if (top + tooltipHeight > window.innerHeight - margin) {
    top = window.innerHeight - tooltipHeight - margin;
  }
  top = Math.max(margin, top);

  tooltip.style.setProperty("--paper-tooltip-left", `${Math.round(left)}px`);
  tooltip.style.setProperty("--paper-tooltip-top", `${Math.round(top)}px`);
}

document.addEventListener("mouseover", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled");
  if (slot) positionPaperTooltip(slot);
});

document.addEventListener("focusin", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled");
  if (slot) positionPaperTooltip(slot);
});

window.addEventListener("resize", () => {
  const active = document.querySelector(".paper-slot-filled:hover, .paper-slot-filled:focus-within");
  if (active) positionPaperTooltip(active);
});

window.abrirInventario = inventoryUxOpen;
window.equiparItemInventario = inventoryUxEquip;
window.desequiparSlotInventario = inventoryUxUnequip;
window.venderItemInventario = inventoryUxSell;
