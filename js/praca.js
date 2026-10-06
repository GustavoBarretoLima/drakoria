window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("abrirMenuBtn");
  const menu = document.getElementById("menuPraca");

  if (!btn || !menu) return;
  btn.addEventListener("click", () => menu.classList.toggle("hidden"));
});

const DUNGEON_RANDOM_MONSTERS = [
  "goblin-normal-lvl-1",
  "orc-normal-lvl-1",
];
const INVENTORY_KEY = "drakoriaInventario";
const INVENTORY_SLOTS = 20;

const SLOT_LABELS = {
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

const RARITY_LABELS = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

const CLASS_STATUS_STATS = {
  guerreiro: {
    attack: 14,
    defense: 10,
    magicDefense: 6,
    magicPower: 14,
    speed: 10,
  },
  mago: {
    attack: 16,
    defense: 5,
    magicDefense: 12,
    magicPower: 16,
    speed: 11,
  },
  arqueiro: {
    attack: 13,
    defense: 7,
    magicDefense: 8,
    magicPower: 13,
    speed: 14,
  },
};

function getPainelPraca() {
  return document.getElementById("painelPraca");
}

function carregarInventarioPersistente() {
  const vazio = { items: [], equipped: {} };
  const salvo = localStorage.getItem(INVENTORY_KEY);
  if (!salvo) return vazio;

  try {
    const parsed = JSON.parse(salvo);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      equipped: parsed.equipped || {},
    };
  } catch {
    return vazio;
  }
}

function salvarInventarioPersistente(inventario) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventario));
}

function getEquipados(inventario) {
  return Object.entries(inventario.equipped)
    .map(([slot, itemId]) => {
      const entry = inventario.items.find(
        (candidate) => candidate.item.id === itemId,
      );
      return entry ? { slot, item: entry.item } : null;
    })
    .filter(Boolean);
}

function calcularStatusHeroi(classe, inventario) {
  const classeNormalizada = ["guerreiro", "mago", "arqueiro"].includes(classe)
    ? classe
    : "guerreiro";
  const base = { ...CLASS_STATUS_STATS[classeNormalizada] };

  for (const equipado of getEquipados(inventario)) {
    const bonus = equipado.item.stats || {};
    base.attack += Number(bonus.attack || 0);
    base.defense += Number(bonus.defense || 0);
    base.magicPower += Number(bonus.magicPower || 0);
  }

  return base;
}

function formatarStats(stats = {}) {
  const labels = {
    hp: "HP",
    mana: "Mana",
    attack: "Ataque",
    defense: "Defesa",
    criticalChance: "Crítico",
    criticalDamage: "Dano crítico",
    dodgeChance: "Esquiva",
    magicPower: "Magia",
  };

  return Object.entries(stats)
    .filter(([, valor]) => Number(valor) !== 0)
    .map(([chave, valor]) => `+${valor} ${labels[chave] || chave}`)
    .join(" • ");
}

function criarSlotInventario(entry, index, inventario) {
  if (!entry) {
    return `<div class="inventory-slot empty"><span>${index + 1}</span></div>`;
  }

  const { item, quantity } = entry;
  const equipado = inventario.equipped[item.slot] === item.id;
  return `
    <button
      type="button"
      class="inventory-slot filled rarity-${item.rarity}${equipado ? " equipped" : ""}"
      onclick="equiparItemInventario('${item.id}')"
      title="${item.description || item.name}"
    >
      <span class="inventory-slot-index">${index + 1}</span>
      <strong>${item.name}</strong>
      ${quantity > 1 ? `<small>x${quantity}</small>` : ""}
      <em>${RARITY_LABELS[item.rarity] || item.rarity}</em>
    </button>
  `;
}

function abrirInventario() {
  const painel = getPainelPraca();
  if (!painel) return;

  const inventario = carregarInventarioPersistente();
  const equipados = getEquipados(inventario);
  const slots = Array.from({ length: INVENTORY_SLOTS }, (_, index) =>
    criarSlotInventario(inventario.items[index], index, inventario),
  ).join("");

  const equipamentoSlots = Object.entries(SLOT_LABELS)
    .map(([slot, label]) => {
      const equipado = equipados.find((entry) => entry.slot === slot);
      return `
        <button
          type="button"
          class="equipment-slot${equipado ? " occupied" : ""}"
          ${equipado ? `onclick="desequiparSlotInventario('${slot}')"` : "disabled"}
        >
          <span>${label}</span>
          <strong>${equipado ? equipado.item.name : "Vazio"}</strong>
          ${equipado ? "<small>Clique para desequipar</small>" : ""}
        </button>
      `;
    })
    .join("");

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <div class="panel-header">
      <div>
        <span class="panel-kicker">Mochila do aventureiro</span>
        <h2>Inventário</h2>
      </div>
      <span class="inventory-capacity">${inventario.items.length}/${INVENTORY_SLOTS}</span>
    </div>

    <h3 class="section-title">Equipamentos</h3>
    <div class="equipment-grid">${equipamentoSlots}</div>

    <h3 class="section-title">Itens</h3>
    <p class="inventory-help">Enquanto não houver ícones próprios, os drops aparecem pelo nome. Clique em um item para equipar.</p>
    <div class="inventory-grid">${slots}</div>

    <div class="painel-acoes">
      <button type="button" onclick="fecharPainelPraca()">Fechar</button>
    </div>
  `;
}

function equiparItemInventario(itemId) {
  const inventario = carregarInventarioPersistente();
  const entry = inventario.items.find((candidate) => candidate.item.id === itemId);
  if (!entry) return;

  inventario.equipped[entry.item.slot] = itemId;
  salvarInventarioPersistente(inventario);
  abrirInventario();
}

function desequiparSlotInventario(slot) {
  const inventario = carregarInventarioPersistente();
  delete inventario.equipped[slot];
  salvarInventarioPersistente(inventario);
  abrirInventario();
}

function abrirDungeon() {
  const painel = getPainelPraca();
  if (!painel) return;

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Portão das Dungeons</h2>
    <p>Ao norte da Praça de Drakoria, um portal antigo pulsa com energia sombria. Goblins e Orcs vagam pelos corredores, e cada entrada pode levar a um encontro diferente.</p>
    <div class="painel-acoes">
      <button type="button" onclick="entrarDungeonAleatoria()">Entrar na Dungeon Aleatória</button>
      <button type="button" onclick="fecharPainelPraca()">Voltar</button>
    </div>
  `;
}

function sortearMonstroDungeon() {
  const index = Math.floor(Math.random() * DUNGEON_RANDOM_MONSTERS.length);
  return DUNGEON_RANDOM_MONSTERS[index] || "goblin-normal-lvl-1";
}

function entrarDungeonAleatoria() {
  const monsterId = sortearMonstroDungeon();
  localStorage.setItem("tipoBatalhaAtual", "dungeon-random");
  localStorage.setItem("monsterIdAtual", monsterId);
  window.location.href = "batalha.html";
}

function entrarDungeonGoblin() {
  entrarDungeonAleatoria();
}

function entrarDungeonOrc() {
  localStorage.setItem("tipoBatalhaAtual", "dungeon-orc");
  localStorage.setItem("monsterIdAtual", "orc-normal-lvl-1");
  window.location.href = "batalha.html";
}

function abrirStatus() {
  const painel = getPainelPraca();
  if (!painel) return;

  const nome = localStorage.getItem("nomeHeroi") || "Herói";
  const classeRaw = (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase();
  const classeTexto = localStorage.getItem("classeHeroiTexto") || classeRaw;
  const genero = localStorage.getItem("generoHeroi") || "Masculino";
  const progresso = window.progressoDrakoria?.carregarProgresso?.();
  const inventario = carregarInventarioPersistente();
  const equipados = getEquipados(inventario);
  const stats = calcularStatusHeroi(classeRaw, inventario);

  const equipamentosHtml = Object.entries(SLOT_LABELS)
    .map(([slot, label]) => {
      const equipado = equipados.find((entry) => entry.slot === slot);
      return `
        <div class="status-equipment-row">
          <span>${label}</span>
          <strong>${equipado ? equipado.item.name : "—"}</strong>
        </div>
      `;
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
      <div class="level-badge">
        <span>Nível</span>
        <strong>${progresso?.nivel ?? 1}</strong>
      </div>
    </div>

    <div class="progress-summary">
      <div><span>EXP</span><strong>${progresso?.xp ?? 0}/${progresso?.xpParaProximoNivel ?? 100}</strong></div>
      <div><span>Ouro</span><strong>${progresso?.ouro ?? 0}</strong></div>
    </div>

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

function abrirLoja() {
  const painel = getPainelPraca();
  if (!painel) return;
  painel.classList.remove("hidden");
  painel.innerHTML = `<h2>Loja da Praça</h2><p>Um mercador observa seus equipamentos e sorri. "Ainda estou organizando minhas mercadorias, herói."</p><div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Fechar</button></div>`;
}

function abrirMissoes() {
  const painel = getPainelPraca();
  if (!painel) return;
  const progresso = window.progressoDrakoria?.carregarProgresso?.();
  const goblinConcluido = progresso?.missoesConcluidas?.includes("derrotar-goblin-inicial");

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Quadro de Missões</h2>
    <div class="missao-card"><h3>O caminho para Drakoria</h3><p>Derrote o Goblin que bloqueia a estrada e prove seu valor diante dos guardas.</p><strong>Status:</strong> ${goblinConcluido ? "Concluída" : "Em andamento"}</div>
    <div class="missao-card"><h3>Sussurros nas Dungeons</h3><p>Criaturas continuam surgindo além das muralhas. Investigue a dungeon e enfrente o que encontrar.</p><strong>Status:</strong> Disponível</div>
    <div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Fechar</button></div>
  `;
}

function fecharPainelPraca() {
  const painel = getPainelPraca();
  if (!painel) return;
  painel.classList.add("hidden");
  painel.innerHTML = "";
}

window.abrirInventario = abrirInventario;
window.equiparItemInventario = equiparItemInventario;
window.desequiparSlotInventario = desequiparSlotInventario;
window.abrirDungeon = abrirDungeon;
window.entrarDungeonAleatoria = entrarDungeonAleatoria;
window.entrarDungeonGoblin = entrarDungeonGoblin;
window.entrarDungeonOrc = entrarDungeonOrc;
window.abrirStatus = abrirStatus;
window.abrirLoja = abrirLoja;
window.abrirMissoes = abrirMissoes;
window.fecharPainelPraca = fecharPainelPraca;
