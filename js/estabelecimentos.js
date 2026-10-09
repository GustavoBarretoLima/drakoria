// ===============================
//  Estabelecimentos de Drakoria
// ===============================

const DRAKORIA_PROGRESS_KEY = "drakoriaProgresso";
const DRAKORIA_VITALS_KEY = "drakoriaHeroVitals";
const DRAKORIA_CONSUMABLES_KEY = "drakoriaConsumables";
const TAVERN_REST_COST = 20;
const POTION_PRICE = 5;

function carregarInterior(id, titulo, descricao, icone, som) {
  const praca = document.getElementById("praca");
  const cena = document.getElementById(id);

  praca.classList.add("fade-out");

  setTimeout(() => {
    praca.style.display = "none";
    cena.innerHTML = `
      <div class="interior-${id} fade">
        <h2>${icone} ${titulo}</h2>
        <p>${descricao}</p>
        <button onclick="voltarPraca()">Voltar à Praça</button>
      </div>
    `;
    cena.style.display = "block";

    if (som) {
      const audio = new Audio(som);
      audio.play();
    }
  }, 800);
}

function loadProgressData() {
  try {
    return JSON.parse(localStorage.getItem(DRAKORIA_PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function loadConsumablesData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAKORIA_CONSUMABLES_KEY) || "{}");
    return {
      restorativePotion: Math.max(0, Math.floor(Number(parsed.restorativePotion || 0))),
      healthPotion: Math.max(0, Math.floor(Number(parsed.healthPotion || 0))),
      manaPotion: Math.max(0, Math.floor(Number(parsed.manaPotion || 0))),
    };
  } catch {
    return { restorativePotion: 0, healthPotion: 0, manaPotion: 0 };
  }
}

function saveConsumablesData(consumables) {
  localStorage.setItem(DRAKORIA_CONSUMABLES_KEY, JSON.stringify(consumables));
}

function getTavernStatus() {
  const progress = loadProgressData();
  const consumables = loadConsumablesData();
  const ouro = Math.max(0, Math.floor(Number(progress.ouro || 0)));
  let vitals = null;
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAKORIA_VITALS_KEY) || "null");
    if (parsed) vitals = parsed;
  } catch {
    vitals = null;
  }
  return { ouro, vitals, consumables };
}

function renderTavernRestStatus(message = "") {
  const status = document.getElementById("tabernaDescansoStatus");
  if (!status) return;
  const { ouro, vitals, consumables } = getTavernStatus();
  const resources = vitals
    ? `HP ${Math.max(0, Math.floor(vitals.hp))}/${Math.max(1, Math.floor(vitals.maxHp))} • Mana ${Math.max(0, Math.floor(vitals.mana))}/${Math.max(0, Math.floor(vitals.maxMana))}`
    : "HP e mana estão completos até sua primeira batalha.";
  status.textContent = `${message ? `${message} ` : ""}${resources} • Ouro: ${ouro} • Poções HP: ${consumables.healthPotion} • Poções Mana: ${consumables.manaPotion}`;
}

function descansarTaberna() {
  const progress = loadProgressData();
  const ouro = Math.max(0, Math.floor(Number(progress.ouro || 0)));

  let vitals = null;
  try {
    vitals = JSON.parse(localStorage.getItem(DRAKORIA_VITALS_KEY) || "null");
  } catch {
    vitals = null;
  }

  if (!vitals) {
    renderTavernRestStatus("Você já está descansado.");
    return;
  }

  const maxHp = Math.max(1, Math.floor(Number(vitals.maxHp || 1)));
  const maxMana = Math.max(0, Math.floor(Number(vitals.maxMana || 0)));
  const hp = Math.max(0, Math.floor(Number(vitals.hp || 0)));
  const mana = Math.max(0, Math.floor(Number(vitals.mana || 0)));

  if (hp >= maxHp && mana >= maxMana) {
    renderTavernRestStatus("Você já está com HP e mana completos.");
    return;
  }

  if (ouro < TAVERN_REST_COST) {
    renderTavernRestStatus(`Você precisa de ${TAVERN_REST_COST} moedas de ouro para descansar.`);
    return;
  }

  progress.ouro = ouro - TAVERN_REST_COST;
  localStorage.setItem(DRAKORIA_PROGRESS_KEY, JSON.stringify(progress));
  localStorage.setItem(DRAKORIA_VITALS_KEY, JSON.stringify({
    hp: maxHp,
    mana: maxMana,
    maxHp,
    maxMana,
  }));
  renderTavernRestStatus("Você descansou e recuperou completamente HP e mana.");
}

function comprarPocao(tipo) {
 const message=window.comprarPocaoCatalogo?.(tipo === "hp" ? "healthPotion" : tipo === "mana" ? "manaPotion" : tipo);
 renderTavernRestStatus(message ?? "Poção comprada.");
}

function carregarTaberna() {
  document.getElementById("taberna").style.display = "block";
  document.getElementById("taberna").innerHTML = `
    <div class="taberna-interior">
      <h2>🍺 Bem-vindo à Taberna</h2>
      <p>O aroma de cerveja e carne assada preenche o ar, enquanto bardos cantam histórias de heróis e dragões.</p>
      <p>Descanse antes de uma nova expedição. O descanso custa <strong>${TAVERN_REST_COST} moedas de ouro</strong> e restaura totalmente HP e mana.</p>
      <p id="tabernaDescansoStatus"></p>
      <button type="button" onclick="descansarTaberna()">🛏️ Descansar — ${TAVERN_REST_COST} ouro</button>

      <div class="taberna-loja-pocoes">
        <h3>🧪 Poções</h3><p><a href="praca.html?loja=1">Ver todas as poções e preços na Loja da Praça</a></p>
        <p>Compre suprimentos para usar entre as batalhas da dungeon.</p>
        <button type="button" onclick="comprarPocao('hp')">❤️ Poção de HP — ${POTION_PRICE} ouro</button>
        <button type="button" onclick="comprarPocao('mana')">💧 Poção de Mana — ${POTION_PRICE} ouro</button>
        <p><small>Poção de HP recupera até 40 HP. Poção de Mana recupera até 20 mana.</small></p>
      </div>

      <button class="btn-voltar" onclick="window.location.href='praca.html'">⬅ Voltar à Praça</button>
    </div>
  `;
  renderTavernRestStatus();
}

function carregarFerreiro() {
  document.getElementById("ferreiro").style.display = "block";
  document.getElementById("ferreiro").innerHTML = `
    <div class="ferreiro-interior">
      <h2>⚒️ Oficina do Ferreiro</h2>
      <p>O som do martelo ecoa enquanto armas e armaduras são forjadas.</p>
      <button class="btn-voltar" onclick="window.location.href='praca.html'">⬅ Voltar à Praça</button>
    </div>
  `;
}

function carregarGuilda() {
  const guilda = document.getElementById("guilda");
  guilda.style.display = "block";
  guilda.innerHTML = '<section class="guilda-interior"><h2>Guilda dos Aventureiros</h2></section>';
}

function carregarInteriorAtual() {
  const hash = window.location.hash.replace("#", "");
  ["taberna", "ferreiro", "guilda"].forEach(id => { document.getElementById(id).style.display = "none"; });
  if (hash === "taberna") carregarTaberna();
  else if (hash === "ferreiro") carregarFerreiro();
  else if (hash === "guilda") carregarGuilda();
}
window.addEventListener("DOMContentLoaded", carregarInteriorAtual);
window.addEventListener("hashchange", carregarInteriorAtual);

function voltarPraca() {
  const praca = document.getElementById("praca");
  const interiores = ["taberna", "ferreiro", "guilda"];

  interiores.forEach((id) => {
    const cena = document.getElementById(id);
    if (cena.style.display === "block") {
      cena.classList.add("fade-out");
      setTimeout(() => {
        cena.style.display = "none";
        praca.style.display = "block";
        praca.classList.add("fade");
      }, 800);
    }
  });
}

window.descansarTaberna = descansarTaberna;
window.comprarPocao = comprarPocao;
