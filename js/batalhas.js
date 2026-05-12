// ---------------- VARIÁVEIS ----------------
let hpHeroi;
let manaHeroi;
let hpInimigo;
let turnoHeroi;

// ---------------- FUNÇÃO DE INICIALIZAÇÃO ----------------
function iniciarBatalha() {
  hpHeroi = 100;
  manaHeroi = 50;
  hpInimigo = 60;
  turnoHeroi = true;

  atualizarStatus();
  atualizarIndicadorTurno(true);
}

// ---------------- CONTROLE DE TURNO ----------------
function podeAgir() {
  return turnoHeroi;
}

// ---------------- STATUS ----------------
function atualizarStatus() {
  document.getElementById("hpHeroiBar").style.width =
    Math.max(hpHeroi, 0) + "%";
  document.getElementById("manaHeroiBar").style.width =
    Math.max(manaHeroi, 0) + "%";
  document.getElementById("hpInimigoBar").style.width =
    Math.max(hpInimigo, 0) + "%";

  document.getElementById("hpHeroiTexto").textContent = hpHeroi + "/100";
  document.getElementById("manaHeroiTexto").textContent = manaHeroi + "/50";
  document.getElementById("hpInimigoTexto").textContent = hpInimigo + "/60";

  const nomeHeroi = localStorage.getItem("nomeHeroi") || "Herói";
  const classeHeroi = localStorage.getItem("classeEscolhida") || "Guerreiro";
  document.getElementById("nomeHeroi").textContent = nomeHeroi;
  document.getElementById("classeHeroi").textContent = classeHeroi;
  document.getElementById("nomeInimigo").textContent = "Goblin";
}

function mensagem(texto) {
  document.getElementById("mensagens").innerHTML = texto;
}

// ---------------- INDICADOR DE TURNO ----------------
function atualizarIndicadorTurno(turnoHeroi = true) {
  const indicador = document.getElementById("indicadorTurno");
  if (turnoHeroi) {
    indicador.textContent = "Seu turno";
    indicador.classList.remove("inimigo");
  } else {
    indicador.textContent = "Turno do Goblin";
    indicador.classList.add("inimigo");
  }
  atualizarBotoes();
}

// ---------------- AÇÕES ----------------
function atacar() {
  if (!podeAgir()) return;
  turnoHeroi = false;
  atualizarIndicadorTurno(false);

  let dano = Math.floor(Math.random() * 15) + 5;
  let critico = Math.random() < 0.2;
  const classeHeroi = (
    localStorage.getItem("classeEscolhida") || "Guerreiro"
  ).toLowerCase();

  if (critico) {
    dano *= 2;
    mostrarDanoCritico(dano);

    if (classeHeroi.includes("mago")) {
      efeitoCriticoMagico();
    } else if (classeHeroi.includes("arqueiro")) {
      efeitoCriticoFlecha();
    } else {
      efeitoCritico();
    }

    mensagem(`💥 CRÍTICO! Você causou ${dano} de dano!`);
  } else {
    mostrarDano(dano);
    mensagem(`Você atacou e causou ${dano} de dano!`);
  }

  hpInimigo -= dano;

  if (classeHeroi.includes("guerreiro")) {
    efeitoCorteSequencial();
  } else if (classeHeroi.includes("mago")) {
    efeitoExplosaoMagica();
  } else if (classeHeroi.includes("arqueiro")) {
    efeitoFlechaHeroi();
  }

  efeitoDanoInimigo();
  atualizarStatus();

  setTimeout(() => turnoInimigo(), 1500);
}

function defender() {
  if (!podeAgir()) return;
  turnoHeroi = false;
  atualizarIndicadorTurno(false);

  const classeHeroi = (
    localStorage.getItem("classeEscolhida") || "Guerreiro"
  ).toLowerCase();

  if (efeitosDefesaHeroi[classeHeroi]) {
    efeitosDefesaHeroi[classeHeroi]();
  } else {
    mensagem("Você se defendeu, reduzindo o próximo dano!");
  }

  atualizarStatus();
  setTimeout(() => turnoInimigo(true), 1500);
}

function magia() {
  if (!podeAgir()) return;
  turnoHeroi = false;
  atualizarIndicadorTurno(false);

  if (manaHeroi >= 10) {
    manaHeroi -= 10;
    let dano = Math.floor(Math.random() * 25) + 10;
    hpInimigo -= dano;
    mensagem(`Você lançou uma magia e causou ${dano} de dano!`);
    mostrarDano(dano);
    efeitoMagiaHeroi();
    efeitoDanoInimigo();
  } else {
    mensagem("Mana insuficiente!");
  }

  atualizarStatus();
  setTimeout(() => turnoInimigo(), 1500);
}

function fugir() {
  if (!podeAgir()) return;
  turnoHeroi = false;
  atualizarIndicadorTurno(false);

  const chanceFuga = Math.random();
  if (chanceFuga < 0.3) {
    mensagem("🏃 Você conseguiu escapar da batalha!");
    atualizarStatus();
    document
      .querySelectorAll(".acoes button")
      .forEach((b) => (b.disabled = true));
    return;
  } else {
    mensagem("Você tenta fugir... mas o Goblin bloqueia sua saída!");
    atualizarStatus();
    setTimeout(() => turnoInimigo(), 1500);
  }
}

// ---------------- TURNO DO INIMIGO ----------------
function turnoInimigo(defesa = false) {
  if (hpInimigo > 0) {
    let dano = Math.floor(Math.random() * 12) + 3;
    if (defesa) dano = Math.floor(dano / 2);

    hpHeroi -= dano;
    mensagem(`O Goblin atacou e causou ${dano} de dano!`);
    efeitoDanoInimigo();
    atualizarStatus();
  } else {
    mensagem("🏆 Você derrotou o Goblin!");
    return;
  }

  turnoHeroi = true;
  atualizarIndicadorTurno(true);
}

// ---------------- BOTÕES ----------------
function atualizarBotoes() {
  document.querySelectorAll(".acoes button").forEach((botao) => {
    botao.disabled = !turnoHeroi;
    if (turnoHeroi) {
      botao.classList.add("ativo");
      setTimeout(() => botao.classList.remove("ativo"), 600);
    }
  });
}

// ---------------- NÚMEROS DE DANO ----------------
function mostrarDano(valor) {
  const inimigo = document.querySelector(".inimigo");
  const numero = document.createElement("div");
  numero.classList.add("dano-numero");
  numero.textContent = `-${valor}`;
  inimigo.appendChild(numero);
  setTimeout(() => numero.remove(), 1000);
}

function mostrarDanoCritico(valor) {
  const inimigo = document.querySelector(".inimigo");
  const numero = document.createElement("div");
  numero.classList.add("dano-critico");
  numero.textContent = `CRIT! -${valor}`;
  inimigo.appendChild(numero);
  setTimeout(() => numero.remove(), 1500);
}

// ---------------- EFEITOS VISUAIS ----------------
// ---------------- EFEITO DE DANO NO INIMIGO ----------------
function efeitoDanoInimigo() {
  const inimigo = document.querySelector(".inimigo-img");
  inimigo.classList.add("dano");
  setTimeout(() => inimigo.classList.remove("dano"), 400);
}

// ---------------- MAGO ----------------
function efeitoMagiaHeroi() {
  const heroi = document.querySelector(".heroi-img");
  heroi.classList.add("magia");
  setTimeout(() => heroi.classList.remove("magia"), 600);
}

function efeitoExplosaoMagica() {
  const inimigo = document.querySelector(".inimigo");
  const explosao = document.createElement("div");
  explosao.classList.add("explosao-magica");
  inimigo.appendChild(explosao);
  setTimeout(() => explosao.remove(), 800);
}

function efeitoDefesaMagica() {
  const heroi = document.querySelector(".heroi");
  const barreira = document.createElement("div");
  barreira.classList.add("barreira-magica");
  heroi.appendChild(barreira);
  setTimeout(() => barreira.remove(), 1000);
}

function efeitoCriticoMagico() {
  const inimigo = document.querySelector(".inimigo");
  const raio = document.createElement("div");
  raio.classList.add("raio-magico");
  inimigo.appendChild(raio);
  setTimeout(() => raio.remove(), 600);
}

// ---------------- GUERREIRO ----------------
let contadorCorte = 0;
const tiposCorte = ["corte-amplo", "corte-c", "corte-pesado"];

function efeitoCorteSequencial() {
  const inimigo = document.querySelector(".inimigo");
  const corte = document.createElement("div");
  corte.classList.add(tiposCorte[contadorCorte]);
  inimigo.appendChild(corte);

  contadorCorte = (contadorCorte + 1) % tiposCorte.length;
  setTimeout(() => corte.remove(), 800);
}

function efeitoCritico() {
  const inimigo = document.querySelector(".inimigo");
  const corte = document.createElement("div");
  corte.classList.add("corte-critico");
  inimigo.appendChild(corte);
  setTimeout(() => corte.remove(), 1200);
}

function efeitoEscudoHeroi() {
  const heroi = document.querySelector(".heroi");
  const escudo = document.createElement("div");
  escudo.classList.add("escudo");
  heroi.appendChild(escudo);
  setTimeout(() => escudo.remove(), 1000);
}

// ---------------- ARQUEIRO ----------------
function efeitoFlechaHeroi() {
  const inimigo = document.querySelector(".inimigo");
  const flecha = document.createElement("div");
  flecha.classList.add("flecha");
  inimigo.appendChild(flecha);
  setTimeout(() => flecha.remove(), 800);
}

function efeitoEsquivaHeroi() {
  const heroi = document.querySelector(".heroi-img");
  heroi.classList.add("esquiva");
  setTimeout(() => heroi.classList.remove("esquiva"), 600);
}

function efeitoCriticoFlecha() {
  const inimigo = document.querySelector(".inimigo");
  const flecha = document.createElement("div");
  flecha.classList.add("flecha-critica");
  inimigo.appendChild(flecha);
  setTimeout(() => flecha.remove(), 800);
}

// ---------------- MAPA DE DEFESA ----------------
const efeitosDefesaHeroi = {
  guerreiro: () => {
    efeitoEscudoHeroi();
    mensagem("🛡️ Você ergueu seu escudo!");
  },
  guerreira: () => {
    efeitoEscudoHeroi();
    mensagem("🛡️ Você ergueu seu escudo!");
  },
  mago: () => {
    efeitoDefesaMagica();
    mensagem("✨ Você conjurou uma barreira mágica!");
  },
  maga: () => {
    efeitoDefesaMagica();
    mensagem("✨ Você conjurou uma barreira mágica!");
  },
  arqueiro: () => {
    efeitoEsquivaHeroi();
    mensagem("🏹 Você se esquivou rapidamente!");
  },
  arqueira: () => {
    efeitoEsquivaHeroi();
    mensagem("🏹 Você se esquivou rapidamente!");
  },
};
window.onload = function () {
  const heroiImg = document.querySelector(".heroi-img");
  const nomeHeroi = localStorage.getItem("nomeHeroi") || "Herói";
  const classeHeroi = localStorage.getItem("classeEscolhida") || "Guerreiro";
  const generoHeroi = localStorage.getItem("generoEscolhido") || "Masculino";

  const imagensHeroi = {
    guerreiro: {
      Masculino: "../img/personagens/guerreiro.png",
      Feminino: "../img/personagens/guerreira.png",
    },
    guerreira: {
      Masculino: "../img/personagens/guerreiro.png",
      Feminino: "../img/personagens/guerreira.png",
    },
    mago: {
      Masculino: "../img/personagens/mago.png",
      Feminino: "../img/personagens/maga.png",
    },
    maga: {
      Masculino: "../img/personagens/mago.png",
      Feminino: "../img/personagens/maga.png",
    },
    arqueiro: {
      Masculino: "../img/personagens/arqueiro.png",
      Feminino: "../img/personagens/arqueira.png",
    },
    arqueira: {
      Masculino: "../img/personagens/arqueiro.png",
      Feminino: "../img/personagens/arqueira.png",
    },
  };

  const classeKey = (classeHeroi || "guerreiro").toLowerCase();
  if (imagensHeroi[classeKey]) {
    heroiImg.src =
      imagensHeroi[classeKey][generoHeroi] || imagensHeroi[classeKey].Masculino;
  } else {
    heroiImg.src = "../img/personagens/guerreiro.png"; // fallback
  }

  document.getElementById("nomeHeroi").textContent = nomeHeroi;
  document.getElementById("classeHeroi").textContent = classeHeroi;

  iniciarBatalha();
};
