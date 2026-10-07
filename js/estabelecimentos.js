// ===============================
//  Estabelecimentos de Drakoria
// ===============================

const DRAKORIA_PROGRESS_KEY = "drakoriaProgresso";
const DRAKORIA_VITALS_KEY = "drakoriaHeroVitals";
const TAVERN_REST_COST = 20;

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

function getTavernStatus() {
  let ouro = 0;
  let vitals = null;
  try {
    const progress = JSON.parse(localStorage.getItem(DRAKORIA_PROGRESS_KEY) || "{}");
    ouro = Math.max(0, Math.floor(Number(progress.ouro || 0)));
  } catch {
    ouro = 0;
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(DRAKORIA_VITALS_KEY) || "null");
    if (parsed) vitals = parsed;
  } catch {
    vitals = null;
  }
  return { ouro, vitals };
}

function renderTavernRestStatus(message = "") {
  const status = document.getElementById("tabernaDescansoStatus");
  if (!status) return;
  const { ouro, vitals } = getTavernStatus();
  const resources = vitals
    ? `HP ${Math.max(0, Math.floor(vitals.hp))}/${Math.max(1, Math.floor(vitals.maxHp))} • Mana ${Math.max(0, Math.floor(vitals.mana))}/${Math.max(0, Math.floor(vitals.maxMana))}`
    : "HP e mana estão completos até sua primeira batalha.";
  status.textContent = `${message ? `${message} ` : ""}${resources} • Ouro: ${ouro}`;
}

function descansarTaberna() {
  let progress;
  try {
    progress = JSON.parse(localStorage.getItem(DRAKORIA_PROGRESS_KEY) || "{}");
  } catch {
    progress = {};
  }
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

function carregarTaberna() {
  document.getElementById("taberna").style.display = "block";
  document.getElementById("taberna").innerHTML = `
    <div class="taberna-interior">
      <h2>🍺 Bem-vindo à Taberna</h2>
      <p>O aroma de cerveja e carne assada preenche o ar, enquanto bardos cantam histórias de heróis e dragões.</p>
      <p>Descanse antes de uma nova expedição. O descanso custa <strong>${TAVERN_REST_COST} moedas de ouro</strong> e restaura totalmente HP e mana.</p>
      <p id="tabernaDescansoStatus"></p>
      <button type="button" onclick="descansarTaberna()">🛏️ Descansar — ${TAVERN_REST_COST} ouro</button>
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
  document.getElementById("guilda").style.display = "block";
  document.getElementById("guilda").innerHTML = `
    <div class="guilda-interior">
      <h2>🛡️ Guilda dos Aventureiros</h2>
      <p>Heróis se reúnem para missões e desafios maiores.</p>
      <button class="btn-voltar" onclick="window.location.href='praca.html'">⬅ Voltar à Praça</button>
    </div>
  `;
}

window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash === "taberna") {
    carregarTaberna();
  } else if (hash === "ferreiro") {
    carregarFerreiro();
  } else if (hash === "guilda") {
    carregarGuilda();
  }
});

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
