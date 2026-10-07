import { createStatsForLevel } from "../shared/src/combat/classStats.ts";
import { canonicalEquipment, canEquipItem } from "../shared/src/equipment/equipmentRules.ts";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.ts";
import { getClassSkills } from "../shared/src/combat/classSkills.ts";

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

function calcularStatusPorNivel(classe, nivel, inventario) {
  const items = Object.values(inventario.equipped)
    .map(id => inventario.items.find(entry => entry.item.id === id)?.item)
    .filter(Boolean)
    .map(canonicalEquipment)
    .filter(item => canEquipItem(item, classe, Number(nivel)));
  return applyEquipmentStats(createStatsForLevel(classe, Number(nivel)), items);
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

  const nome = localStorage.getItem("nomeHeroi") || "Herói";
  const classe = normalizarClasseStatus();
  const generoNormalizado = normalizarGeneroStatus();
  const classeTexto = localStorage.getItem("classeHeroiTexto") || classe;
  const generoTexto = localStorage.getItem("generoHeroi") || "Masculino";
  const progresso = window.progressoDrakoria?.carregarProgresso?.() || {
    nivel: 1,
    xp: 0,
    xpParaProximoNivel: 100,
    ouro: 0,
  };
  const inventario = carregarInventarioStatus();
  const stats = calcularStatusPorNivel(classe, progresso.nivel, inventario);
  const paperDoll = criarPaperDollStatus(
    classe,
    generoNormalizado,
    nome,
    inventario,
  );

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <div class="panel-header status-header">
      <div>
        <span class="panel-kicker">Ficha do aventureiro</span>
        <h2>${escaparHtmlStatus(nome)}</h2>
        <p>${escaparHtmlStatus(classeTexto)} • ${escaparHtmlStatus(generoTexto)}</p>
      </div>
      <div class="level-badge"><span>Nível</span><strong>${progresso.nivel}</strong></div>
    </div>
    <div class="progress-summary">
      <div><span>EXP</span><strong>${progresso.xp}/${progresso.xpParaProximoNivel}</strong></div>
      <div><span>Ouro</span><strong>${progresso.ouro}</strong></div>
    </div>
    <p class="inventory-help">Ataque, DEF, DEF M, HP e Mana crescem a cada nível. Speed e crítico sobem em um ritmo mais lento.</p>
    <h3 class="section-title">Atributos</h3>
    <div class="status-stats-grid">
      <div class="status-stat"><span>Ataque</span><strong>${stats.attack}</strong></div>
      <div class="status-stat"><span>DEF</span><strong>${stats.defense}</strong></div>
      <div class="status-stat"><span>DEF M</span><strong>${stats.magicDefense}</strong></div>
      <div class="status-stat"><span>Magia</span><strong>${stats.magicPower}</strong></div>
      <div class="status-stat"><span>Esquiva</span><strong>${stats.dodgeChance.toFixed(1)}%</strong></div>
      <div class="status-stat"><span>Crítico</span><strong>${stats.criticalChance}%</strong></div>
      <div class="status-stat"><span>Speed</span><strong>${stats.speed}</strong></div>
    </div>
    <h3 class="section-title">Habilidades da classe</h3>
    <p class="inventory-help">${getClassSkills(classe).map(skill => `${escaparHtmlStatus(skill.name)} — ${progresso.nivel >= skill.unlockLevel ? "Liberada" : `Nível ${skill.unlockLevel}`}`).join("<br>")}</p>
    <h3 class="section-title">Equipamentos</h3>
    ${paperDoll}
    <div class="painel-acoes">
      <button type="button" onclick="abrirInventario()">Abrir Inventário</button>
      <button type="button" onclick="fecharPainelPraca()">Fechar</button>
    </div>
  `;
}

window.abrirStatus = abrirStatusComProgressao;
