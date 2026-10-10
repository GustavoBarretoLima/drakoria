import { getForgeSet } from "../../../shared/src/equipment/forgeSets.js";
import { SPRITE_BOUNDS } from "../assets/spriteBounds.js";
import { SUBCLASS_SPRITE_FOLDERS } from "../../../shared/src/classes/subclassSprites.js";
import { ensureAssassinEquipment, ensureBerserkEquipment, loadInventory, type InventoryState } from "../inventory/inventoryClient.js";
import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { canonicalEquipment, canEquipItem } from "../../../shared/src/equipment/equipmentRules.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { getClassSkills, getHeroSkills } from "../../../shared/src/combat/classSkills.js";
import { applySubclassStats, SUBCLASS_DEFINITIONS, type SubclassDefinition, type SubclassId } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../../../shared/src/classes/skillTrees.js";
import { loadSubclassProgress } from "../progression/subclassClient.js";
import { getTreeRanks } from "../progression/skillTreeClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { loadHeroVitals } from "../battle/heroVitals.js";
import { equipmentArt } from "../ui/equipmentArt.js";
import { openSubclassTree } from "./subclassTree.js";
import type { HeroClass, Stats } from "../../../shared/src/types/combat.js";
import type { EquipmentItem, EquipmentSlot, EquipmentStats } from "../../../shared/src/types/equipment.js";

const STATUS_SLOT_LABELS: Record<EquipmentSlot, string> = {
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

const STATUS_RARITY_LABELS: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

const STATUS_STAT_LABELS: Record<keyof EquipmentStats, string> = {
  hp: "HP",
  mana: "Mana",
  attack: "Ataque",
  defense: "Defesa",
  magicDefense: "DEF M",
  criticalChance: "Chance crítica",
  criticalDamage: "Dano crítico",
  dodgeChance: "Esquiva",
  magicPower: "Magia",
  speed: "Speed",
};

declare global {
  interface Window {
    abrirStatus?: () => void;
    abrirInventario: () => void;
    fecharPainelPraca?: () => void;
    criarFichaPersonagemJRPG: () => CharacterSheetColumns;
    inventoryUxClassesLabel?: (item: EquipmentItem) => string;
    hidePaperTooltipPortal?: () => void;
    ensureAssassinEquipment?: (grantStarter?: boolean) => void;
    ensureBerserkEquipment?: (grantStarter?: boolean) => void;
  }
}

export interface CharacterSheetColumns {
  profile: string;
  attributes: string;
}

function heroClass(): HeroClass {
  const value = (localStorage.getItem("classeHeroi") ?? "guerreiro").toLowerCase();
  return value === "mago" || value === "arqueiro" ? value : "guerreiro";
}

function heroGender(): "masculino" | "feminino" {
  return (localStorage.getItem("generoHeroi") ?? "masculino").toLowerCase().includes("fem") ? "feminino" : "masculino";
}

function activeSubclass(cls: HeroClass): SubclassDefinition | null {
  const id = loadSubclassProgress().activeSubclass;
  return id && SUBCLASS_DEFINITIONS[id].baseClass === cls ? SUBCLASS_DEFINITIONS[id] : null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function heroImage(cls: HeroClass, gender: "masculino" | "feminino"): string {
  const subclass = activeSubclass(cls);
  if (subclass) return `../img/personagens/${SUBCLASS_SPRITE_FOLDERS[subclass.id][gender]}/idle.gif`;
  const images: Record<HeroClass, Record<"masculino" | "feminino", string>> = {
    guerreiro: { masculino: "../img/personagens/guerreiro.png", feminino: "../img/personagens/guerreira.png" },
    mago: { masculino: "../img/personagens/mago.png", feminino: "../img/personagens/maga.png" },
    arqueiro: { masculino: "../img/personagens/arqueiro.png", feminino: "../img/personagens/arqueira.png" },
  };
  return images[cls][gender];
}

export function calculateStatusForLevel(
  cls: HeroClass,
  level: number,
  inventory: InventoryState,
  subclass?: SubclassDefinition | null,
): Stats {
  const items = Object.values(inventory.equipped)
    .map(id => inventory.items.find(entry => entry.item.id === id)?.item)
    .filter((item): item is EquipmentItem => Boolean(item))
    .map(canonicalEquipment)
    .filter(item => canEquipItem(item, cls, level, subclass?.id));
  const stats = applyEquipmentStats(createStatsForLevel(cls, level), items);
  return applyTreeStats(applySubclassStats(stats, subclass?.id), subclass?.id, level, getTreeRanks());
}

function formatEquipmentStats(stats: EquipmentStats = {}): string {
  const entries = Object.entries(stats).filter(([, value]) => Number(value) !== 0) as Array<[keyof EquipmentStats, number]>;
  if (!entries.length) return '<span class="paper-tooltip-empty">Sem bônus de atributo</span>';
  return entries.map(([key, value]) => {
    const percentage = key === "criticalChance" || key === "criticalDamage" || key === "dodgeChance";
    return `<span>${escapeHtml(STATUS_STAT_LABELS[key] ?? key)} <strong>${value >= 0 ? "+" : ""}${value}${percentage ? "%" : ""}</strong></span>`;
  }).join("");
}

function classesLabel(item: EquipmentItem): string {
  if (window.inventoryUxClassesLabel) return window.inventoryUxClassesLabel(item);
  if (item.allowedClasses.includes("universal")) return "Todas as classes";
  return item.allowedClasses.map(cls => cls.charAt(0).toUpperCase() + cls.slice(1)).join(", ");
}

function paperDollSlot(slot: EquipmentSlot, label: string, inventory: InventoryState): string {
  const itemId = inventory.equipped[slot];
  const item = inventory.items.find(entry => entry.item.id === itemId)?.item;
  if (!item) return `<div class="paper-slot paper-slot-${slot} paper-slot-empty" data-slot="${slot}"><span class="paper-slot-label">${label}</span><strong>Vazio</strong></div>`;

  const rarity = item.rarity || "common";
  const rarityLabel = STATUS_RARITY_LABELS[rarity] ?? rarity;
  return `<div class="paper-slot paper-slot-${slot} paper-slot-filled paper-rarity-${rarity}" data-slot="${slot}" tabindex="0">
    <span class="paper-slot-label">${label}</span>${equipmentArt(item)}<strong>${escapeHtml(item.name)}</strong>
    <span class="paper-slot-rarity">${escapeHtml(rarityLabel)}</span><span class="item-equipped-badge">✓ Equipado</span>
    <div class="paper-tooltip" role="tooltip"><div class="paper-tooltip-header"><strong>${escapeHtml(item.name)}</strong><span class="paper-tooltip-rarity">${escapeHtml(rarityLabel)}</span></div>
      <p>${escapeHtml(item.description || "Sem descrição.")}</p><div class="paper-tooltip-bonuses">${formatEquipmentStats(item.stats)}</div>
      <div class="paper-tooltip-requirements"><span>Nível ${Math.max(1, item.level)}</span><span>Classe: ${escapeHtml(classesLabel(item))}</span></div></div>
  </div>`;
}

function equipmentRows(inventory: InventoryState): string {
  return Object.entries(STATUS_SLOT_LABELS)
    .map(([slot, label]) => paperDollSlot(slot as EquipmentSlot, label, inventory))
    .join("");
}

export function createCharacterSheet(): CharacterSheetColumns {
  const cls = heroClass();
  const subclass = activeSubclass(cls);
  const progress = loadProgress();
  const inventory = loadInventory();
  const stats = calculateStatusForLevel(cls, progress.nivel, inventory, subclass);
  const vitals = loadHeroVitals(stats.maxHp, stats.maxMana);
  const name = localStorage.getItem("nomeHeroi") || "Herói";
  const baseClass = localStorage.getItem("classeHeroiTexto") || cls.charAt(0).toUpperCase() + cls.slice(1);
  const portrait = heroImage(cls, heroGender());
  const bounds = SPRITE_BOUNDS[portrait.replace(/^\.\.\//, "")];
  const portraitStyle = bounds ? `style="--sprite-width:${bounds[0]};--sprite-height:${bounds[1]};--sprite-center:${bounds[2]};--sprite-top:${bounds[3]}"` : "";

  const profile = `<aside class="jrpg-profile${subclass ? " jrpg-profile-animated" : ""}">
    <div class="jrpg-portrait" ${portraitStyle}><img src="${portrait}" alt="${escapeHtml(name)}" /></div>
    <div class="jrpg-profile-details"><span class="jrpg-level">Nv. ${progress.nivel}</span><h3>${escapeHtml(name)}</h3><p>${escapeHtml(baseClass)}${subclass ? ` · ${escapeHtml(subclass.name)}` : ""}</p>
      <div class="jrpg-resource jrpg-hp"><span>HP</span><strong>${vitals.hp}/${stats.maxHp}</strong><div><i style="width:${vitals.hp / stats.maxHp * 100}%"></i></div></div>
      <div class="jrpg-resource jrpg-mp"><span>MP</span><strong>${vitals.mana}/${stats.maxMana}</strong><div><i style="width:${stats.maxMana ? vitals.mana / stats.maxMana * 100 : 0}%"></i></div></div>
      <dl><div><dt>EXP</dt><dd>${progress.xp}/${progress.xpParaProximoNivel}</dd></div><div><dt>Ouro</dt><dd>${progress.ouro}</dd></div></dl>
    </div></aside>`;

  const rows: Array<[string, string | number]> = [
    ["Ataque físico", stats.attack], ["Defesa física", stats.defense], ["Poder mágico", stats.magicPower], ["Defesa mágica", stats.magicDefense],
    ["Vida máxima", stats.maxHp], ["Mana máxima", stats.maxMana], ["Velocidade", stats.speed], ["Chance crítica", `${stats.criticalChance}%`],
    ["Dano crítico", `${stats.criticalDamage}%`], ["Esquiva", `${stats.dodgeChance.toFixed(1)}%`],
  ];
  const setItems = Object.entries(inventory.equipped)
    .map(([slot, id]) => inventory.items.find(entry => entry.item.id === id && entry.item.slot === slot)?.item)
    .filter((item): item is EquipmentItem => Boolean(item))
    .filter(item => canEquipItem(item, cls, progress.nivel, subclass?.id));
  const set = getForgeSet(setItems, cls);
  const setInfo = `<h3 class="section-title">${escapeHtml(set.name)} · ${set.count}/8</h3><p class="jrpg-build-note">${set.active ? "Ativo" : "Inativo"} — ${escapeHtml(set.description)}</p>`;
  const attributes = `<section class="jrpg-attributes"><h3 class="section-title">Classe</h3><p class="jrpg-role">${escapeHtml(subclass?.role || baseClass)}</p><h3 class="section-title">Atributos</h3><dl>${rows.map(([label, value]) => `<div class="jrpg-attribute-row"><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><p class="jrpg-build-note">Inclui nível, equipamentos, conjunto ativo e passivas aprendidas.</p>${setInfo}</section>`;
  return { profile, attributes };
}

export function openStatus(): void {
  const panel = document.getElementById("painelPraca");
  if (!panel) return;
  window.hidePaperTooltipPortal?.();
  ensureAssassinEquipment();
  ensureBerserkEquipment();

  const cls = heroClass();
  const subclass = activeSubclass(cls);
  const progress = loadProgress();
  const inventory = loadInventory();
  const sheet = createCharacterSheet();
  const subclassProgress = loadSubclassProgress();
  const heroSkills = subclass?.id === "berserker"
    ? getHeroSkills({
      className: cls,
      level: progress.nivel,
      subclassId: "berserker",
      treeRanks: getTreeRanks(),
      ...(subclassProgress.equippedSkills !== undefined ? { equippedSkills: subclassProgress.equippedSkills } : {}),
    })
    : getClassSkills(cls);
  const skills = heroSkills.map(skill => `<div class="jrpg-skill-row"><span>${escapeHtml(skill.name)}</span><small>${progress.nivel >= skill.unlockLevel ? "Liberada" : `Nível ${skill.unlockLevel}`}</small></div>`).join("");

  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="jrpg-sheet" data-view="status">
    <header class="jrpg-sheet-header"><div><span class="panel-kicker">Ficha do aventureiro</span><h2>Status</h2></div>
      <nav aria-label="Tela do personagem"><button type="button" data-status-action="inventory">Inventário</button><button type="button" data-status-action="close">Fechar</button></nav></header>
    <div class="jrpg-sheet-columns">${sheet.profile}${sheet.attributes}
      <section class="jrpg-loadout"><h3 class="section-title">Equipamentos</h3><div class="jrpg-equipment-list">${equipmentRows(inventory)}</div>
        <h3 class="section-title">Habilidades da classe</h3><div class="jrpg-skill-list">${skills || (subclass?.id === "berserker" ? "<p>Aprenda e equipe até quatro habilidades na árvore de subclasse.</p>" : "")}</div>
        <div class="jrpg-subclass"><h3 class="section-title">Subclasse</h3>${subclass ? `<strong>${escapeHtml(subclass.name)}</strong><p>${escapeHtml(subclass.passiveSummary)}</p><button type="button" data-status-action="subclass">Subclasse</button>` : '<p>Use um livro de subclasse para liberar sua especialização.</p>'}</div>
      </section>
    </div></div>`;
  panel.scrollTop = 0;
}

document.addEventListener("click", event => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-status-action]");
  if (!button) return;
  if (button.dataset.statusAction === "inventory") window.abrirInventario();
  else if (button.dataset.statusAction === "close") window.fecharPainelPraca?.();
  else if (button.dataset.statusAction === "subclass") openSubclassTree();
});

window.abrirStatus = openStatus;
window.criarFichaPersonagemJRPG = createCharacterSheet;
window.ensureAssassinEquipment = ensureAssassinEquipment;
window.ensureBerserkEquipment = ensureBerserkEquipment;
