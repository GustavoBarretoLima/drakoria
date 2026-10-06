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

function formatarStats(stats = {}) {
  const labels = {
    hp: "HP",
    mana: "Mana",
    attack: "Ataque",
    defense: "Defesa",
    criticalChance: "Crítico",
    criticalDamage: "Dano crítico",
    dodgeChance: "Esquiva",
    magicPower: "Poder mágico",
  };

  return Object.entries(stats)
    .filter(([, valor]) => Number(valor) !== 0)
    .map(([chave, valor]) => `+${valor} ${labels[chave] || chave}`)
    .join(" • ");
}

function abrirInventario() {
  const painel = getPainelPraca();
  if (!painel) return;

  const inventario = carregarInventarioPersistente();
  const cards = inventario.items.length
    ? inventario.items
        .map(({ item, quantity }) => {
          const equipado = inventario.equipped[item.slot] === item.id;
          return `
            <div class="missao-card inventory-item-card">
              <h3>${item.name}${quantity > 1 ? ` x${quantity}` : ""}</h3>
              <p><strong>${RARITY_LABELS[item.rarity] || item.rarity}</strong> • ${SLOT_LABELS[item.slot] || item.slot} • Nv.${item.level}</p>
              <p>${item.description || "Equipamento obtido em batalha."}</p>
              <p>${formatarStats(item.stats)}</p>
              <button type="button" onclick="${equipado ? `desequiparSlotInventario('${item.slot}')` : `equiparItemInventario('${item.id}')`}">
                ${equipado ? "Desequipar" : "Equipar"}
              </button>
            </div>
          `;
        })
        .join("")
    : "<p>Seu inventário ainda está vazio. Explore as dungeons para encontrar equipamentos.</p>";

  const equipados = Object.entries(inventario.equipped)
    .map(([slot, itemId]) => {
      const entry = inventario.items.find((candidate) => candidate.item.id === itemId);
      return entry ? `${SLOT_LABELS[slot] || slot}: ${entry.item.name}` : null;
    })
    .filter(Boolean);

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Inventário</h2>
    <p><strong>Equipados:</strong> ${equipados.length ? equipados.join(" • ") : "Nenhum"}</p>
    <div class="inventory-list">${cards}</div>
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
  const classe = localStorage.getItem("classeHeroiTexto") || localStorage.getItem("classeHeroi") || "guerreiro";
  const genero = localStorage.getItem("generoHeroi") || "Masculino";
  const progresso = window.progressoDrakoria?.carregarProgresso?.();
  const inventario = carregarInventarioPersistente();
  const equipados = Object.keys(inventario.equipped).length;

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Status do Herói</h2>
    <p><strong>Nome:</strong> ${nome}</p>
    <p><strong>Classe:</strong> ${classe}</p>
    <p><strong>Gênero:</strong> ${genero}</p>
    <p><strong>Nível:</strong> ${progresso?.nivel ?? 1}</p>
    <p><strong>XP:</strong> ${progresso?.xp ?? 0}/${progresso?.xpParaProximoNivel ?? 100}</p>
    <p><strong>Ouro:</strong> ${progresso?.ouro ?? 0}</p>
    <p><strong>Equipamentos ativos:</strong> ${equipados}</p>
    <div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Fechar</button></div>
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
