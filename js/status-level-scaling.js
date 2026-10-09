import { SPRITE_BOUNDS } from "../client/src/assets/spriteBounds.ts";
import { SUBCLASS_SPRITE_FOLDERS } from "../shared/src/classes/subclassSprites.ts";
import { ensureAssassinEquipment, ensureBerserkEquipment } from "../client/src/inventory/inventoryClient.ts";
import { createStatsForLevel } from "../shared/src/combat/classStats.ts";
import { canonicalEquipment, canEquipItem } from "../shared/src/equipment/equipmentRules.ts";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.ts";
import { getClassSkills, getHeroSkills } from "../shared/src/combat/classSkills.ts";
import { applySubclassStats, SUBCLASS_DEFINITIONS } from "../shared/src/classes/subclasses.ts";
import { applyTreeStats } from "../shared/src/classes/skillTrees.ts";
import { loadSubclassProgress } from "../client/src/progression/subclassClient.ts";
import { getTreeRanks } from "../client/src/progression/skillTreeClient.ts";
import "../client/src/pages/subclassTree.ts";

const STATUS_SLOT_LABELS = {
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

const STATUS_RARITY_LABELS = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

const STATUS_STAT_LABELS = {
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

function carregarInventarioStatus() {
  window.ensureAssassinEquipment?.();
  window.ensureBerserkEquipment?.();
  try {
    const parsed = JSON.parse(localStorage.getItem("drakoriaInventario") || "{}");
    return {
      items: Array.isArray(parsed.items) ? parsed.items.map(entry => ({ ...entry, item: canonicalEquipment(entry.item) })) : [],
      equipped: parsed.equipped || {},
    };
  } catch {
    return { items: [], equipped: {} };
  }
}

function normalizarClasseStatus() {
  const classe = (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase();
  return ["guerreiro", "mago", "arqueiro"].includes(classe)
    ? classe
    : "guerreiro";
}

function carregarSubclasseStatus(classe) {
  try {
    const parsed = JSON.parse(localStorage.getItem("drakoriaSubclassProgress") || "{}");
    const definition = SUBCLASS_DEFINITIONS[parsed.activeSubclass];
    return definition?.baseClass === classe ? definition : null;
  } catch {
    return null;
  }
}

function normalizarGeneroStatus() {
  const genero = (localStorage.getItem("generoHeroi") || "masculino").toLowerCase();
  return genero.includes("fem") ? "feminino" : "masculino";
}

function escaparHtmlStatus(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getImagemHeroiStatus(classe, genero) {
  const subclasse = carregarSubclasseStatus(classe);
  if (subclasse && typeof SUBCLASS_SPRITE_FOLDERS !== "undefined") return `../img/personagens/${SUBCLASS_SPRITE_FOLDERS[subclasse.id][genero]}/idle.gif`;
  if (subclasse?.id === "berserker") return "../img/personagens/berserk_primal/idle.gif";
  const imagens = {
    guerreiro: {
      masculino: "../img/personagens/guerreiro.png",
      feminino: "../img/personagens/guerreira.png",
    },
    mago: {
      masculino: "../img/personagens/mago.png",
      feminino: "../img/personagens/maga.png",
    },
    arqueiro: {
      masculino: "../img/personagens/arqueiro.png",
      feminino: "../img/personagens/arqueira.png",
    },
  };

  return imagens[classe]?.[genero] || imagens.guerreiro.masculino;
}

function calcularStatusPorNivel(classe, nivel, inventario, subclasse) {
  const items = Object.values(inventario.equipped)
    .map(id => inventario.items.find(entry => entry.item.id === id)?.item)
    .filter(Boolean)
    .map(canonicalEquipment)
    .filter(item => canEquipItem(item, classe, Number(nivel), subclasse?.id));
  const stats = applyEquipmentStats(createStatsForLevel(classe, Number(nivel)), items);
  return applyTreeStats(applySubclassStats(stats, subclasse?.id), subclasse?.id, Number(nivel), getTreeRanks());
}

function formatarBonusEquipamentoStatus(stats = {}) {
  const entries = Object.entries(stats).filter(([, value]) => Number(value) !== 0);
  if (!entries.length) return '<span class="paper-tooltip-empty">Sem bônus de atributo</span>';

  return entries
    .map(([key, value]) => {
      const percentual = ["criticalChance", "criticalDamage", "dodgeChance"].includes(key);
      const numero = Number(value);
      const sinal = numero >= 0 ? "+" : "";
      return `<span>${escaparHtmlStatus(STATUS_STAT_LABELS[key] || key)} <strong>${sinal}${numero}${percentual ? "%" : ""}</strong></span>`;
    })
    .join("");
}

function formatarClassesStatus(classes = []) {
  if (!Array.isArray(classes) || classes.includes("universal")) return "Todas as classes";
  return classes
    .map((classe) => classe.charAt(0).toUpperCase() + classe.slice(1))
    .join(", ");
}

function criarSlotPaperDollStatus(slot, label, inventario) {
  const itemId = inventario.equipped[slot];
  const entry = inventario.items.find((candidate) => candidate.item.id === itemId);

  if (!entry) {
    return `
      <div class="paper-slot paper-slot-${slot} paper-slot-empty" data-slot="${slot}">
        <span class="paper-slot-label">${label}</span>
        <strong>Vazio</strong>
      </div>
    `;
  }

  const item = entry.item;
  const rarity = item.rarity || "common";
  const rarityLabel = STATUS_RARITY_LABELS[rarity] || rarity;
  const descricao = escaparHtmlStatus(item.description || "Sem descrição.");
  const nome = escaparHtmlStatus(item.name);
  const requisitoNivel = Math.max(1, Number(item.level || 1));
  const classes = escaparHtmlStatus(typeof window.inventoryUxClassesLabel === "function" ? window.inventoryUxClassesLabel(item) : formatarClassesStatus(item.allowedClasses));

  return `
    <div class="paper-slot paper-slot-${slot} paper-slot-filled paper-rarity-${rarity}" data-slot="${slot}" tabindex="0">
      <span class="paper-slot-label">${label}</span>
      <strong>${nome}</strong>
      <span class="paper-slot-rarity">${rarityLabel}</span>
      <span class="item-equipped-badge">✓ Equipado</span>
      <div class="paper-tooltip" role="tooltip">
        <div class="paper-tooltip-header">
          <strong>${nome}</strong>
          <span class="paper-tooltip-rarity">${rarityLabel}</span>
        </div>
        <p>${descricao}</p>
        <div class="paper-tooltip-bonuses">
          ${formatarBonusEquipamentoStatus(item.stats)}
        </div>
        <div class="paper-tooltip-requirements">
          <span>Nível ${requisitoNivel}</span>
          <span>Classe: ${classes}</span>
        </div>
      </div>
    </div>
  `;
}

function criarPaperDollStatus(classe, genero, nome, inventario) {
  const slots = Object.entries(STATUS_SLOT_LABELS)
    .map(([slot, label]) => criarSlotPaperDollStatus(slot, label, inventario))
    .join("");

  const imagemHeroi = getImagemHeroiStatus(classe, genero);

  return `
    <div class="status-paper-doll" aria-label="Equipamentos equipados">
      <div class="paper-doll-character">
        <div class="paper-character-aura"></div>
        <img src="${imagemHeroi}" alt="${escaparHtmlStatus(nome)}" />
        <span>${escaparHtmlStatus(nome)}</span>
      </div>
      ${slots}
    </div>
    <p class="paper-doll-help">Passe o mouse ou use Tab sobre um equipamento para ver descrição, bônus, requisitos e raridade.</p>
  `;
}

function abrirStatusComProgressao() {
  const painel = document.getElementById("painelPraca");
  if (!painel) return;

  window.hidePaperTooltipPortal?.();
  const classe = normalizarClasseStatus();
  const subclasse = carregarSubclasseStatus(classe);
  const inventario = carregarInventarioStatus();
  const progresso = window.progressoDrakoria?.carregarProgresso?.() || { nivel: 1 };
  const ficha = criarFichaPersonagemJRPG();
  const equipmentRows = Object.entries(STATUS_SLOT_LABELS).map(([slot, label]) => criarSlotPaperDollStatus(slot, label, inventario)).join("");
  const heroSkills = subclasse?.id === "berserker" ? (typeof getHeroSkills === "function" && typeof loadSubclassProgress === "function" ? getHeroSkills({ className: classe, level: progresso.nivel, subclassId: "berserker", treeRanks: getTreeRanks(), equippedSkills: loadSubclassProgress().equippedSkills }) : []) : getClassSkills(classe);
  const skills = heroSkills.map(skill => `<div class="jrpg-skill-row"><span>${escaparHtmlStatus(skill.name)}</span><small>${progresso.nivel >= skill.unlockLevel ? "Liberada" : `Nível ${skill.unlockLevel}`}</small></div>`).join("");
  document.getElementById("menuPraca")?.classList?.add?.("hidden");
  painel.classList.remove("hidden");
  painel.innerHTML = `<div class="jrpg-sheet" data-view="status">
    <header class="jrpg-sheet-header"><div><span class="panel-kicker">Ficha do aventureiro</span><h2>Status</h2></div>
      <nav aria-label="Tela do personagem"><button type="button" onclick="abrirInventario()">Inventário</button><button type="button" onclick="fecharPainelPraca()">Fechar</button></nav></header>
    <div class="jrpg-sheet-columns">${ficha.profile}${ficha.attributes}
      <section class="jrpg-loadout"><h3 class="section-title">Equipamentos</h3><div class="jrpg-equipment-list">${equipmentRows}</div>
        <h3 class="section-title">Habilidades da classe</h3><div class="jrpg-skill-list">${skills || (subclasse?.id === "berserker" ? "<p>Aprenda e equipe até quatro habilidades na árvore de subclasse.</p>" : "")}</div>
        <div class="jrpg-subclass"><h3 class="section-title">Subclasse</h3>
        ${subclasse ? `<strong>${escaparHtmlStatus(subclasse.name)}</strong><p>${escaparHtmlStatus(subclasse.passiveSummary)}</p><button type="button" onclick="abrirArvoreSubclasse()">Subclasse</button>` : '<p>Use um livro de subclasse para liberar sua especialização.</p>'}</div>
      </section>
    </div></div>`;
  painel.scrollTop = 0;
}

window.abrirStatus = abrirStatusComProgressao;

/** Shared character columns keep inventory and status on the same build calculation. */
function criarFichaPersonagemJRPG() {
  const classe = normalizarClasseStatus();
  const subclasse = carregarSubclasseStatus(classe);
  const nome = localStorage.getItem("nomeHeroi") || "Herói";
  const progresso = window.progressoDrakoria?.carregarProgresso?.() || { nivel: 1, xp: 0, xpParaProximoNivel: 100, ouro: 0 };
  const stats = calcularStatusPorNivel(classe, progresso.nivel, carregarInventarioStatus(), subclasse);
  let vitals = {};
  try { vitals = JSON.parse(localStorage.getItem("drakoriaHeroVitals") || "{}"); } catch {}
  const resource = (value, max) => Number.isFinite(Number(value)) && value != null ? Math.min(max, Math.max(0, Number(value))) : max;
  const hp = resource(vitals.hp, stats.maxHp), mana = resource(vitals.mana, stats.maxMana);
  const baseClass = localStorage.getItem("classeHeroiTexto") || classe.charAt(0).toUpperCase() + classe.slice(1);
  const portrait = getImagemHeroiStatus(classe, normalizarGeneroStatus());
  const bounds = typeof SPRITE_BOUNDS !== "undefined" ? SPRITE_BOUNDS[portrait.replace(/^\.\.\//, "")] : undefined;
  const portraitStyle = bounds ? `style="--sprite-width:${bounds[0]};--sprite-height:${bounds[1]};--sprite-center:${bounds[2]};--sprite-top:${bounds[3]}"` : "";
  const profile = `<aside class="jrpg-profile${subclasse ? " jrpg-profile-animated" : ""}">
    <div class="jrpg-portrait" ${portraitStyle}><img src="${portrait}" alt="${escaparHtmlStatus(nome)}" /></div>
    <div class="jrpg-profile-details"><span class="jrpg-level">Nv. ${progresso.nivel}</span><h3>${escaparHtmlStatus(nome)}</h3><p>${escaparHtmlStatus(baseClass)}${subclasse ? ` · ${escaparHtmlStatus(subclasse.name)}` : ""}</p>
      <div class="jrpg-resource jrpg-hp"><span>HP</span><strong>${hp}/${stats.maxHp}</strong><div><i style="width:${hp / stats.maxHp * 100}%"></i></div></div>
      <div class="jrpg-resource jrpg-mp"><span>MP</span><strong>${mana}/${stats.maxMana}</strong><div><i style="width:${stats.maxMana ? mana / stats.maxMana * 100 : 0}%"></i></div></div>
      <dl><div><dt>EXP</dt><dd>${progresso.xp}/${progresso.xpParaProximoNivel ?? 100}</dd></div><div><dt>Ouro</dt><dd>${progresso.ouro}</dd></div></dl>
    </div></aside>`;
  const rows = [["Ataque físico", stats.attack], ["Defesa física", stats.defense], ["Poder mágico", stats.magicPower], ["Defesa mágica", stats.magicDefense], ["Vida máxima", stats.maxHp], ["Mana máxima", stats.maxMana], ["Velocidade", stats.speed], ["Chance crítica", `${stats.criticalChance}%`], ["Dano crítico", `${stats.criticalDamage}%`], ["Esquiva", `${stats.dodgeChance.toFixed(1)}%`]];
  const attributes = `<section class="jrpg-attributes"><h3 class="section-title">Classe</h3><p class="jrpg-role">${escaparHtmlStatus(subclasse?.role || baseClass)}</p><h3 class="section-title">Atributos</h3><dl>${rows.map(([label, value]) => `<div class="jrpg-attribute-row"><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl><p class="jrpg-build-note">Inclui nível, equipamentos e passivas aprendidas.</p></section>`;
  return { profile, attributes };
}
window.criarFichaPersonagemJRPG = criarFichaPersonagemJRPG;

if (typeof ensureAssassinEquipment === "function") window.ensureAssassinEquipment = ensureAssassinEquipment;

if (typeof ensureBerserkEquipment === "function") window.ensureBerserkEquipment = ensureBerserkEquipment;
