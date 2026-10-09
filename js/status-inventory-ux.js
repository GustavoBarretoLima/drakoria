const INVENTORY_UX_KEY = "drakoriaInventario";
const INVENTORY_UX_SLOTS = 20;

const INVENTORY_UX_SLOT_LABELS = {
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

let paperTooltipPortal = null;
let paperTooltipActiveSlot = null;

function inventoryUxEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inventoryUxLoad() {
  window.ensureAssassinEquipment?.();
  window.ensureBerserkEquipment?.();
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
  const legacyWarriorOnly = ["orc-iron-axe", "orc-iron-chest", "orc-warlord-sword", "orc-warlord-chest", "orc-warlord-gloves", "weapon-universal-legendary-natal-lvl-100"].includes(item.id);
  const universalSlot = ["ring", "earring", "necklace"].includes(item.slot);
  let classAllowed = legacyWarriorOnly ? heroClass === "guerreiro" : item.id === "goblin-hide-gloves" ? heroClass !== "mago" : allowed.includes(heroClass) || (universalSlot && allowed.includes("universal"));
  let subclass;
  try { subclass = JSON.parse(localStorage.getItem("drakoriaSubclassProgress") || "{}").activeSubclass; } catch {}
  if (item.requiredSubclass && (subclass !== item.requiredSubclass)) classAllowed = false;
  if (heroClass === "arqueiro" && subclass === "assassin" && item.slot === "weapon" && item.requiredSubclass !== "assassin") classAllowed = false;
  if (heroClass === "guerreiro" && subclass === "berserker" && (item.slot === "shield" || (item.slot === "weapon" && item.weaponType !== "two-handed-axe"))) classAllowed = false;
  const levelAllowed = heroLevel >= Math.max(1, Number(item.level || 1));
  return { allowed: classAllowed && levelAllowed, classAllowed, levelAllowed };
}

function inventoryUxClassesLabel(item) {
  if (item.requiredSubclass === "berserker") return "Berserk • Duas mãos";
  if (item.requiredSubclass === "assassin") return "Assassino";
  const warriorOnly = ["orc-iron-axe", "orc-iron-chest", "orc-warlord-sword", "orc-warlord-chest", "orc-warlord-gloves", "weapon-universal-legendary-natal-lvl-100"].includes(item.id);
  if (warriorOnly) return "Guerreiro";
  if (item.id === "goblin-hide-gloves") return "Guerreiro, Arqueiro";
  const classes = Array.isArray(item.allowedClasses) ? item.allowedClasses : ["universal"];
  const labels = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro", universal: "Todas as classes" };
  if (classes.includes("universal") && ["ring", "earring", "necklace"].includes(item.slot)) return labels.universal;
  return classes.filter(heroClass => heroClass !== "universal").map(heroClass => labels[heroClass] || heroClass).join(", ") || "Nenhuma classe compatível";
}

function inventoryUxRequirementsHtml(item) {
  return `<small class="inventory-slot-description">Classe: ${inventoryUxEscape(inventoryUxClassesLabel(item))} • Nível ${Math.max(1, Number(item.level || 1))}</small>`;
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
      return entry && inventoryUxCanEquip(entry.item).allowed ? { slot, item: entry.item } : null;
    })
    .filter(Boolean);
}

function inventoryUxComparisonHtml(item, inventory) {
  const current = inventoryUxEquippedEntries(inventory).find(entry => entry.slot === item.slot)?.item;
  const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const keys = Object.keys(INVENTORY_UX_STAT_LABELS).filter(key => numeric(item.stats?.[key]) || numeric(current?.stats?.[key]));
  const rows = keys.map(key => {
    const before = numeric(current?.stats?.[key]);
    const after = numeric(item.stats?.[key]);
    const delta = Math.round((after - before) * 100) / 100;
    const percentage = ["criticalChance", "criticalDamage", "dodgeChance"].includes(key);
    const unit = percentage ? "%" : "";
    const change = `${delta > 0 ? "+" : ""}${delta}${percentage ? " p.p." : ""}`;
    return `<tr><th scope="row">${inventoryUxEscape(INVENTORY_UX_STAT_LABELS[key])}</th><td>${before}${unit}</td><td>${after}${unit}</td><td class="comparison-${delta > 0 ? "gain" : delta < 0 ? "loss" : "same"}">${change}</td></tr>`;
  }).join("");
  const use = inventoryUxCanEquip(item);
  return `<div class="paper-tooltip inventory-comparison-source">
    <strong>${inventoryUxEscape(item.name)}</strong>
    <p>Comparação: ${inventoryUxEscape(INVENTORY_UX_SLOT_LABELS[item.slot] || item.slot)}</p>
    <p>Equipado: ${current ? inventoryUxEscape(current.name) : "Slot vazio"}</p>
    ${!use.allowed ? `<p class="inventory-restriction">${use.classAllowed ? `Requer nível ${Math.max(1, Number(item.level || 1))}` : "Classe incompatível"}</p>` : ""}
    <table class="inventory-comparison-table"><thead><tr><th>Atributo</th><th>Atual</th><th>Item</th><th>Troca</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Sem bônus de atributos</td></tr>'}</tbody></table>
    ${current?.uniqueEffect ? `<p>Efeito atual: ${inventoryUxEscape(current.uniqueEffect.name)} — ${inventoryUxEscape(current.uniqueEffect.description)}</p>` : ""}
    ${item.uniqueEffect ? `<p>Efeito do item: ${inventoryUxEscape(item.uniqueEffect.name)} — ${inventoryUxEscape(item.uniqueEffect.description)}</p>` : ""}
    <p class="comparison-note">Diferença dos bônus da peça. Percentuais são comparados em pontos percentuais.</p>
  </div>`;
}

function inventoryUxItemSlot(entry, index, inventory) {
  if (!entry) {
    return `<div class="inventory-slot empty"><span>${index + 1}</span></div>`;
  }

  const { item, quantity } = entry;
  const use = inventoryUxCanEquip(item);
  const rarity = item.rarity || "common";
  let restriction = "";
  if (!use.classAllowed) restriction = "Classe incompatível";
  else if (!use.levelAllowed) restriction = `Requer nível ${Math.max(1, Number(item.level || 1))}`;

  return `
    <div tabindex="0" class="inventory-slot filled rarity-${rarity}${use.allowed ? "" : " locked"}${use.classAllowed ? "" : " class-incompatible"}">
      <span class="inventory-slot-index">${index + 1}</span>
      <strong>${inventoryUxEscape(item.name)}</strong>
      ${quantity > 1 ? `<small>x${quantity}</small>` : ""}
      <em>${inventoryUxEscape(INVENTORY_UX_RARITIES[rarity] || rarity)}</em>
      ${inventoryUxRequirementsHtml(item)}
      ${inventoryUxStatsHtml(item.stats)}
      <small class="inventory-slot-description">${inventoryUxEscape(item.description || "Sem descrição.")}</small>
      ${restriction ? `<small class="inventory-restriction">${inventoryUxEscape(restriction)}</small>` : ""}
      ${inventoryUxComparisonHtml(item, inventory)}
      <div class="inventory-slot-actions">
        <button type="button" ${use.allowed ? `onclick="equiparItemInventario('${inventoryUxEscape(item.id)}')"` : "disabled"}>Equipar</button>
        <button type="button" onclick="venderItemInventario('${inventoryUxEscape(item.id)}')">Vender ${Number(item.sellPrice || 0)}g</button>
      </div>
    </div>
  `;
}

function inventoryUxOpen() {
  const panel = document.getElementById("painelPraca");
  if (!panel) return;

  hidePaperTooltipPortal();

  const inventory = inventoryUxLoad();
  const equipped = inventoryUxEquippedEntries(inventory);
  const backpack = window.getBackpackEntries(inventory);
  const itemSlots = Array.from({ length: INVENTORY_UX_SLOTS }, (_, index) =>
    inventoryUxItemSlot(backpack[index], index, inventory),
  ).join("");

  const equipmentSlots = Object.entries(INVENTORY_UX_SLOT_LABELS)
    .map(([slot, label]) => {
      const current = equipped.find((entry) => entry.slot === slot);
      const rarity = current?.item?.rarity || "common";
      return `
        <button type="button" class="equipment-slot${current ? ` occupied rarity-${rarity}` : ""}" ${current ? `onclick="desequiparSlotInventario('${slot}')"` : "disabled"}>
          <span>${label}</span>
          <strong>${current ? inventoryUxEscape(current.item.name) : "Vazio"}</strong>
          ${current ? '<span class="item-equipped-badge">✓ Equipado</span>' : ""}
          ${current ? `<div class="paper-tooltip" role="tooltip"><div class="paper-tooltip-header"><strong>${inventoryUxEscape(current.item.name)}</strong><span>${inventoryUxEscape(INVENTORY_UX_RARITIES[rarity] || rarity)}</span></div><p>${inventoryUxEscape(current.item.description || "Sem descrição.")}</p>${inventoryUxRequirementsHtml(current.item)}${inventoryUxStatsHtml(current.item.stats)}<small>Selecione para desequipar.</small></div>` : ""}
          ${current ? "<small>Clique para desequipar</small>" : ""}
        </button>
      `;
    })
    .join("");

  panel.classList.remove("hidden");
  const ficha = window.criarFichaPersonagemJRPG?.() || { profile: "", attributes: "" };
  document.getElementById("menuPraca")?.classList?.add?.("hidden");
  panel.innerHTML = `<div class="jrpg-sheet" data-view="inventory">
    <header class="jrpg-sheet-header"><div><span class="panel-kicker">Mochila do aventureiro</span><h2>Inventário</h2></div>
      <nav aria-label="Tela do personagem"><button type="button" onclick="abrirStatus()">Status</button><button type="button" onclick="fecharPainelPraca()">Fechar</button></nav></header>
    <div class="jrpg-sheet-columns">${ficha.profile}${ficha.attributes}
      <section class="jrpg-loadout"><h3 class="section-title">Equipamentos</h3><p class="inventory-help">Selecione uma peça equipada para desequipar.</p><div class="equipment-grid">${equipmentSlots}</div>
        <div class="jrpg-backpack-heading"><h3 class="section-title">Mochila</h3><span class="inventory-capacity">${backpack.length}/${INVENTORY_UX_SLOTS}</span></div>
        <p class="inventory-help">Passe o mouse ou use Tab para comparar com o item equipado no mesmo slot.</p><div class="inventory-grid">${itemSlots}</div>
        ${window.criarPocoesInventario?.() || ""}
      </section>
    </div></div>`;
  panel.scrollTop = 0;
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
  if (!entry || (inventory.equipped[entry.item.slot] === itemId && entry.quantity <= 1)) return;

  const gold = Math.max(0, Number(entry.item.sellPrice || 0));
  entry.quantity -= 1;
  if (entry.quantity <= 0) inventory.items.splice(index, 1);
  inventoryUxSave(inventory);
  window.progressoDrakoria?.adicionarRecompensa?.({ ouro: gold, xp: 0 });
  inventoryUxOpen();
}

function ensurePaperTooltipPortal() {
  if (paperTooltipPortal?.isConnected) return paperTooltipPortal;

  paperTooltipPortal = document.createElement("div");
  paperTooltipPortal.id = "paperTooltipPortal";
  paperTooltipPortal.className = "paper-tooltip paper-tooltip-portal";
  paperTooltipPortal.setAttribute("role", "tooltip");
  paperTooltipPortal.setAttribute("aria-hidden", "true");
  document.body.appendChild(paperTooltipPortal);
  return paperTooltipPortal;
}

function getPaperTooltipRarityClass(slot) {
  return Array.from(slot.classList).find((className) =>
    className.startsWith("paper-rarity-"),
  );
}

function positionPaperTooltipPortal(slot) {
  const portal = ensurePaperTooltipPortal();
  const slotRect = slot.getBoundingClientRect();
  const margin = 12;
  const gap = 10;
  const tooltipWidth = Math.min(slot.matches(".inventory-slot") ? 380 : 300, window.innerWidth - margin * 2);

  portal.style.width = `${tooltipWidth}px`;
  portal.style.maxHeight = `${Math.min(420, window.innerHeight - margin * 2)}px`;

  const portalRect = portal.getBoundingClientRect();
  const tooltipHeight = Math.min(portalRect.height || portal.scrollHeight || 320, window.innerHeight - margin * 2);

  let left = slotRect.right + gap;
  if (left + tooltipWidth > window.innerWidth - margin) {
    left = slotRect.left - tooltipWidth - gap;
  }
  if (left < margin) {
    left = Math.max(margin, Math.min(slotRect.left, window.innerWidth - tooltipWidth - margin));
  }

  let top = slotRect.top + slotRect.height / 2 - tooltipHeight / 2;
  top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

  portal.style.left = `${Math.round(left)}px`;
  portal.style.top = `${Math.round(top)}px`;
}

function showPaperTooltipPortal(slot) {
  const source = slot.querySelector(".paper-tooltip");
  if (!source) return;

  const portal = ensurePaperTooltipPortal();
  const rarityClass = getPaperTooltipRarityClass(slot);

  portal.className = "paper-tooltip paper-tooltip-portal";
  if (slot.matches(".inventory-slot")) portal.classList.add("inventory-comparison-portal");
  if (rarityClass) portal.classList.add(rarityClass);
  portal.innerHTML = source.innerHTML;
  portal.classList.add("is-visible");
  portal.setAttribute("aria-hidden", "false");
  paperTooltipActiveSlot = slot;

  positionPaperTooltipPortal(slot);
}

function hidePaperTooltipPortal() {
  if (!paperTooltipPortal) return;
  paperTooltipPortal.classList.remove("is-visible");
  paperTooltipPortal.setAttribute("aria-hidden", "true");
  paperTooltipActiveSlot = null;
}

document.addEventListener("mouseover", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled, .inventory-slot.filled, .equipment-slot.occupied");
  if (!slot || slot === paperTooltipActiveSlot) return;
  showPaperTooltipPortal(slot);
});

document.addEventListener("mouseout", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled, .inventory-slot.filled, .equipment-slot.occupied");
  if (!slot) return;
  if (event.relatedTarget && slot.contains(event.relatedTarget)) return;
  if (slot === paperTooltipActiveSlot && !slot.matches(":focus-within")) {
    hidePaperTooltipPortal();
  }
});

document.addEventListener("focusin", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled, .inventory-slot.filled, .equipment-slot.occupied");
  if (slot) showPaperTooltipPortal(slot);
});

document.addEventListener("focusout", (event) => {
  const slot = event.target.closest?.(".paper-slot-filled, .inventory-slot.filled, .equipment-slot.occupied");
  if (!slot) return;
  if (event.relatedTarget && slot.contains(event.relatedTarget)) return;
  if (slot === paperTooltipActiveSlot && !slot.matches(":hover")) {
    hidePaperTooltipPortal();
  }
});

window.addEventListener("resize", () => {
  if (paperTooltipActiveSlot?.isConnected) {
    positionPaperTooltipPortal(paperTooltipActiveSlot);
  } else {
    hidePaperTooltipPortal();
  }
});

window.addEventListener("scroll", () => {
  if (paperTooltipActiveSlot?.isConnected) {
    positionPaperTooltipPortal(paperTooltipActiveSlot);
  }
}, true);

window.abrirInventario = inventoryUxOpen;
window.equiparItemInventario = inventoryUxEquip;
window.desequiparSlotInventario = inventoryUxUnequip;
window.venderItemInventario = inventoryUxSell;

window.inventoryUxClassesLabel = inventoryUxClassesLabel;
