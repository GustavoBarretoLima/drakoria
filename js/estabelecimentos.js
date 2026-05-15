// ===============================
//  Estabelecimentos de Drakoria
// ===============================

// Função genérica para carregar interiores
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

    // toca som se existir
    if (som) {
      const audio = new Audio(som);
      audio.play();
    }
  }, 800);
}

// Funções específicas
// 🌟 Taberna
function carregarTaberna() {
  document.getElementById("taberna").style.display = "block";
  document.getElementById("taberna").innerHTML = `
    <div class="taberna-interior">
      <h2>🍺 Bem-vindo à Taberna</h2>
      <p>O aroma de cerveja e carne assada preenche o ar, enquanto bardos cantam histórias de heróis e dragões.</p>
      <p>O ambiente é animado, cheio de aventureiros e histórias.</p>
      <button class="btn-voltar" onclick="window.location.href='praca.html'">⬅ Voltar à Praça</button>
    </div>
  `;
}

// ⚒️ Ferreiro
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

// 🛡️ Guilda
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

// 🔹 Detecta hash da URL e carrega interior correspondente
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

// Função para retornar à praça
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
// 🔹 Detecta hash da URL e carrega interior correspondente
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
