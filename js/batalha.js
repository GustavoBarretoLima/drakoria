// Importa módulos
import {
  mensagem,
  atualizarIndicadorTurno,
  mostrarDano,
  mostrarDanoCritico,
  atualizarBotoes,
} from "./ui.js";
import {
  efeitoReceberDano,
  efeitoCorteBasico,
  efeitoMagiaBasica,
  efeitoFlechaBasica,
  efeitoFlechaCritica,
  efeitoCorteCritico,
  efeitoMagiaCritica,
  efeitoDano,
  efeitoDanoCritico,
  efeitoAtaqueBasicoMago,
  efeitoReceberDanoHeroi,
  efeitoReceberDanoHeroiCritico,
} from "./efeitos.js";

import { atualizarStatus, carregarHeroi } from "./status.js";

// ---------------- VARIÁVEIS ----------------
let hpHeroi;
let manaHeroi;
let hpInimigo;
let turnoHeroi;

// ---------------- INICIALIZAÇÃO ----------------
function iniciarBatalha() {
  const heroiBatalha = document.getElementById("heroiBatalha");
  const generoHeroi = (
    localStorage.getItem("generoHeroi") || "masculino"
  ).toLowerCase();
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

  // 🔹 Define HP/Mana por classe
  switch (true) {
    case classeHeroi.includes("guerre"):
      hpHeroi = 120;
      manaHeroi = 40;
      break;
    case classeHeroi.includes("mag"):
      hpHeroi = 80;
      manaHeroi = 80;
      break;
    case classeHeroi.includes("arque"):
      hpHeroi = 100;
      manaHeroi = 60;
      break;
    default:
      hpHeroi = 100;
      manaHeroi = 50;
  }

  hpInimigo = 60;
  turnoHeroi = true;

  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
  atualizarIndicadorTurno(true);

  // 🔹 Define imagem do herói em batalha
  if (classeHeroi.includes("guerre")) {
    heroiBatalha.src =
      generoHeroi === "feminino"
        ? "../img/personagens/guerreira.png"
        : "../img/personagens/guerreiro.png";
  } else if (classeHeroi.includes("mag")) {
    heroiBatalha.src =
      generoHeroi === "feminino"
        ? "../img/personagens/maga.png"
        : "../img/personagens/mago.png";
  } else if (classeHeroi.includes("arque")) {
    // Aqui você usa o gif só na batalha
    heroiBatalha.src = "../img/personagens/arqueira.gif";
  } else {
    heroiBatalha.src = "../img/personagens/guerreiro.png";
  }

  // 🔹 Desabilita botão Magia para classes que não usam magia
  const btnMagia = document.getElementById("btnMagia");
  if (classeHeroi.includes("guerre") || classeHeroi.includes("arque")) {
    btnMagia.disabled = true;
    btnMagia.style.opacity = "0.5"; // opcional: visual de desativado
  } else {
    btnMagia.disabled = false;
    btnMagia.style.opacity = "1";
  }
}

// ---------------- CONTROLE DE TURNO ----------------
function podeAgir() {
  return turnoHeroi;
}
function encerrarTurnoHeroi() {
  turnoHeroi = false;
  atualizarIndicadorTurno(false);
}

// ---------------- AÇÕES ----------------
function atacar() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  let dano = Math.floor(Math.random() * 15) + 5;
  let critico = Math.random() < 0.2;
  const heroi = document.querySelector(".heroi-img");
  const inimigo = document.querySelector(".inimigo");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();
  // Ativa gif de ataque do arqueiro
  if (classeHeroi === "arqueiro" || classeHeroi === "arqueira") {
    heroi.src = "../img/personagens/arqueira-ataque.gif";
    setTimeout(() => {
      heroi.src = "../img/personagens/arqueira.gif";
    }, 1500); // volta para o gif de idle após 0.5s
  }
  if (critico) {
    dano *= 2;
    mostrarDanoCritico(dano, inimigo);
    efeitoReceberDano(inimigo);
    mensagem(`💥 CRÍTICO! Você causou ${dano} de dano!`);

    if (classeHeroi === "guerreiro" || classeHeroi === "guerreira") {
      efeitoCorteCritico(inimigo);
    }
    if (classeHeroi === "mago" || classeHeroi === "maga") {
      efeitoMagiaCritica(heroi, inimigo);
    }
    if (classeHeroi === "arqueiro" || classeHeroi === "arqueira") {
      efeitoFlechaCritica(inimigo);
    }
  } else {
    mostrarDano(dano, inimigo);
    efeitoReceberDano(inimigo);
    mensagem(`Você atacou e causou ${dano} de dano!`);

    if (classeHeroi === "guerreiro" || classeHeroi === "guerreira") {
      efeitoCorteBasico(inimigo);
    }
    if (classeHeroi === "mago" || classeHeroi === "maga") {
      efeitoAtaqueBasicoMago(inimigo);
    }
    if (classeHeroi === "arqueiro" || classeHeroi === "arqueira") {
      efeitoFlechaBasica(inimigo);
    }
  }

  // 🔹 Atualiza vida do inimigo
  hpInimigo -= dano;
  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);

  // 🔹 Verifica se o Goblin morreu
  if (hpInimigo <= 0) {
    hpInimigo = 0;
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
    cenaVitoriaGoblin(); // chama transição para Drakoria
    return; // interrompe o turno inimigo
  }

  // Se ainda está vivo, passa o turno para o inimigo
  setTimeout(() => turnoInimigo(), 1500);
}

function defender() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const heroi = document.getElementById("heroiBatalha");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

  // 🔹 troca para gif de defesa
  if (classeHeroi.includes("arque")) {
    heroi.src = "../img/personagens/arqueira-defesa.gif";

    // volta para o gif padrão depois de 1.5s
    setTimeout(() => {
      heroi.src = "../img/personagens/arqueira.gif";
    }, 1500);
  }

  if (classeHeroi.includes("guerre")) {
    mensagem("🛡️ Você ergueu seu escudo!");
    efeitoDefesaGuerreiro();
  } else if (classeHeroi.includes("mag")) {
    mensagem("✨ Você conjurou uma barreira mágica!");
    efeitoDefesaMago();
  } else if (classeHeroi.includes("arque")) {
    mensagem("🏹 Você se esquivou rapidamente!");
    efeitoDefesaArqueiro();
  } else {
    mensagem("Você se defendeu, reduzindo o próximo dano!");
  }

  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
  setTimeout(() => turnoInimigo(true), 1500);
}

function magia() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const heroi = document.querySelector(".heroi-img");
  const inimigo = document.querySelector(".inimigo");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Mago"
  ).toLowerCase();

  if (manaHeroi >= 10) {
    manaHeroi -= 10;
    let dano = Math.floor(Math.random() * 25) + 10;
    hpInimigo -= dano;
    mensagem(`✨ Você lançou uma magia e causou ${dano} de dano!`);

    // número de dano continua aparecendo
    mostrarDano(dano, inimigo);

    // efeito visual exclusivo para magia
    if (classeHeroi === "mago" || classeHeroi === "maga") {
      efeitoMagiaBasica(heroi, inimigo);
    }

    // atualiza status
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);

    // 🔹 Verifica se o Goblin morreu
    if (hpInimigo <= 0) {
      hpInimigo = 0;
      atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
      cenaVitoriaGoblin(); // chama transição para Drakoria
      return; // interrompe o turno inimigo
    }
  } else {
    mensagem("Mana insuficiente!");
  }

  // se ainda está vivo, passa o turno para o inimigo
  setTimeout(() => turnoInimigo(), 1500);
}

function fugir() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const chanceFuga = Math.random();
  if (chanceFuga < 0.3) {
    mensagem("🏃 Você conseguiu escapar da batalha!");
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
    document
      .querySelectorAll(".acoes button")
      .forEach((b) => (b.disabled = true));
    return;
  } else {
    mensagem("Você tenta fugir... mas o Goblin bloqueia sua saída!");
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
    setTimeout(() => turnoInimigo(), 1500);
  }
}

/*efeitos de defesa*/
// 🛡️ Guerreiro/Guerreira – escudo metálico
export function efeitoDefesaGuerreiro(inimigo) {
  const escudo = document.createElement("div");
  escudo.classList.add("escudo-defesa");
  document.body.appendChild(escudo);

  const heroi = document.querySelector(".heroi-img");
  const rectHeroi = heroi.getBoundingClientRect();

  escudo.style.left = `${rectHeroi.left + rectHeroi.width / 2}px`;
  escudo.style.top = `${rectHeroi.top + rectHeroi.height / 2}px`;
  escudo.style.position = "absolute";

  anime({
    targets: escudo,
    scale: [0.5, 1.2],
    opacity: [1, 0],
    duration: 800,
    easing: "easeOutBack",
    complete: () => escudo.remove(),
  });
}

// ✨ Mago/Maga – barreira mágica
export function efeitoDefesaMago() {
  const barreira = document.createElement("div");
  barreira.classList.add("barreira-magica");
  document.body.appendChild(barreira);

  const heroi = document.querySelector(".heroi-img");
  const rectHeroi = heroi.getBoundingClientRect();

  barreira.style.left = `${rectHeroi.left + rectHeroi.width / 2}px`;
  barreira.style.top = `${rectHeroi.top + rectHeroi.height / 2}px`;
  barreira.style.position = "absolute";

  anime({
    targets: barreira,
    scale: [0.5, 1.5],
    opacity: [0.8, 0],
    duration: 1000,
    easing: "easeOutCubic",
    complete: () => barreira.remove(),
  });
}

// 🏹 Arqueiro/Arqueira – esquiva rápida
export function efeitoDefesaArqueiro() {
  const arqueiro = document.querySelector(".heroi-img");

  anime({
    targets: arqueiro,
    translateX: [-20, 0],
    duration: 500,
    easing: "easeInOutQuad",
  });
}

// ---------------- TURNO DO INIMIGO ----------------
function turnoInimigo(defesa = false) {
  if (hpInimigo > 0) {
    let dano = Math.floor(Math.random() * 12) + 3;
    if (defesa) dano = Math.floor(dano / 2);

    const critico = Math.random() < 0.2; // 20% chance de crítico
    if (critico) dano *= 2;

    hpHeroi -= dano;

    const heroi = document.querySelector(".heroi-img");

    if (critico) {
      mensagem(`💥 CRÍTICO! O Goblin causou ${dano} de dano!`);
      mostrarDanoCritico(dano, heroi);
      efeitoReceberDanoHeroiCritico(heroi);
    } else {
      mensagem(`👹 O Goblin atacou e causou ${dano} de dano!`);
      mostrarDano(dano, heroi);
      efeitoReceberDanoHeroi(heroi);
    }

    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
  } else {
    mensagem("🏆 Você derrotou o Goblin!");
    return;
  }

  turnoHeroi = true;
  atualizarIndicadorTurno(true);
}

// ---------------- INÍCIO ----------------
window.onload = function () {
  carregarHeroi();
  iniciarBatalha();

  document.getElementById("btnAtacar").addEventListener("click", atacar);
  document.getElementById("btnDefender").addEventListener("click", defender);
  document.getElementById("btnMagia").addEventListener("click", magia);
  document.getElementById("btnFugir").addEventListener("click", fugir);
};
