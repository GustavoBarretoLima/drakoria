const STATUS_LEVEL_BASE = {
  guerreiro: {
    attack: 14,
    defense: 10,
    magicDefense: 6,
    speed: 10,
  },
  mago: {
    attack: 16,
    defense: 5,
    magicDefense: 12,
    speed: 11,
  },
  arqueiro: {
    attack: 13,
    defense: 7,
    magicDefense: 8,
    speed: 14,
  },
};

const STATUS_LEVEL_GROWTH = {
  guerreiro: {
    attack: 1.1,
    defense: 0.9,
    magicDefense: 0.45,
    speed: 0.16,
  },
  mago: {
    attack: 1.25,
    defense: 0.45,
    magicDefense: 0.9,
    speed: 0.18,
  },
  arqueiro: {
    attack: 1,
    defense: 0.6,
    magicDefense: 0.6,
    speed: 0.28,
  },
};

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

function carregarInventarioStatus() {
  try {
    const parsed = JSON.parse(localStorage.getItem("drakoriaInventario") || "{}");
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
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

function calcularStatusPorNivel(classe, nivel, inventario) {
  const safeLevel = Math.min(100, Math.max(1, Math.floor(Number(nivel) || 1)));
  const levelsGained = safeLevel - 1;
  const base = STATUS_LEVEL_BASE[classe];
  const growth = STATUS_LEVEL_GROWTH[classe];

  const stats = {
    attack: Math.floor(base.attack + growth.attack * levelsGained),
    defense: Math.floor(base.defense + growth.defense * levelsGained),
    magicDefense: Math.floor(
      base.magicDefense + growth.magicDefense * levelsGained,
    ),
    speed: Math.floor(base.speed + growth.speed * levelsGained),
  };

  for (const [slot, itemId] of Object.entries(inventario.equipped)) {
    void slot;
    const entry = inventario.items.find((candidate) => candidate.item.id === itemId);
    if (!entry) continue;

    const bonus = entry.item.stats || {};
    stats.attack += Number(bonus.attack || 0);
    stats.defense += Number(bonus.defense || 0);
    stats.magicDefense += Number(bonus.magicDefense || 0);
    stats.speed += Number(bonus.speed || 0);
  }

  return {
    ...stats,
    magicPower: stats.attack,
  };
}

function abrirStatusComProgressao() {
  const painel = document.getElementById("painelPraca");
  if (!painel) return;

  const nome = localStorage.getItem("nomeHeroi") || "Herói";
  const classe = normalizarClasseStatus();
  const classeTexto = localStorage.getItem("classeHeroiTexto") || classe;
  const genero = localStorage.getItem("generoHeroi") || "Masculino";
  const progresso = window.progressoDrakoria?.carregarProgresso?.() || {
    nivel: 1,
    xp: 0,
    xpParaProximoNivel: 100,
    ouro: 0,
  };
  const inventario = carregarInventarioStatus();
  const stats = calcularStatusPorNivel(classe, progresso.nivel, inventario);

  const equipamentosHtml = Object.entries(STATUS_SLOT_LABELS)
    .map(([slot, label]) => {
      const itemId = inventario.equipped[slot];
      const entry = inventario.items.find((candidate) => candidate.item.id === itemId);
      return `<div class="status-equipment-row"><span>${label}</span><strong>${entry ? entry.item.name : "—"}</strong></div>`;
    })
    .join("");

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <div class="panel-header status-header">
      <div>
        <span class="panel-kicker">Ficha do aventureiro</span>
        <h2>${nome}</h2>
        <p>${classeTexto} • ${genero}</p>
      </div>
      <div class="level-badge"><span>Nível</span><strong>${progresso.nivel}</strong></div>
    </div>
    <div class="progress-summary">
      <div><span>EXP</span><strong>${progresso.xp}/${progresso.xpParaProximoNivel}</strong></div>
      <div><span>Ouro</span><strong>${progresso.ouro}</strong></div>
    </div>
    <p class="inventory-help">Seus atributos base crescem levemente a cada nível e depois recebem os bônus dos equipamentos.</p>
    <h3 class="section-title">Atributos</h3>
    <div class="status-stats-grid">
      <div class="status-stat"><span>Ataque</span><strong>${stats.attack}</strong></div>
      <div class="status-stat"><span>DEF</span><strong>${stats.defense}</strong></div>
      <div class="status-stat"><span>DEF M</span><strong>${stats.magicDefense}</strong></div>
      <div class="status-stat"><span>Magia</span><strong>${stats.magicPower}</strong></div>
      <div class="status-stat"><span>Speed</span><strong>${stats.speed}</strong></div>
    </div>
    <h3 class="section-title">Equipamentos</h3>
    <div class="status-equipment-list">${equipamentosHtml}</div>
    <div class="painel-acoes">
      <button type="button" onclick="abrirInventario()">Abrir Inventário</button>
      <button type="button" onclick="fecharPainelPraca()">Fechar</button>
    </div>
  `;
}

window.abrirStatus = abrirStatusComProgressao;
