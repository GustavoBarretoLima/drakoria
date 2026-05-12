// Importa módulos
import {
  mensagem,
  atualizarIndicadorTurno,
  mostrarDano,
  mostrarDanoCritico,
} from "./ui.js";
import {
  efeitoCorteBasico,
  efeitoMagiaBasica,
  efeitoFlechaBasica,
  efeitoFlechaCritica,
  efeitoCorteCritico,
  efeitoMagiaCritica,
  efeitoDano,
  efeitoDanoCritico,
} from "./efeitos.js";

import { atualizarStatus, carregarHeroi } from "./status.js";

// ---------------- VARIÁVEIS ----------------
let hpHeroi;
let manaHeroi;
let hpInimigo;
let turnoHeroi;

// ---------------- INICIALIZAÇÃO ----------------
function iniciarBatalha() {
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

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

  if (critico) {
    dano *= 2;
    mostrarDanoCritico(dano);
    mensagem(`💥 CRÍTICO! Você causou ${dano} de dano!`);

    // efeitos críticos
    if (classeHeroi.includes("guer")) efeitoCorteCritico(inimigo);
    if (classeHeroi.includes("mag")) efeitoMagiaCritica(heroi, inimigo);
    if (classeHeroi.includes("arq")) efeitoFlechaCritica(inimigo);
  } else {
    mostrarDano(dano);
    mensagem(`Você atacou e causou ${dano} de dano!`);

    // efeitos básicos
    if (classeHeroi.includes("guer")) efeitoCorteBasico(inimigo);
    if (classeHeroi.includes("mag")) efeitoMagiaBasica(heroi, inimigo);
    if (classeHeroi.includes("arq")) efeitoFlechaBasica(inimigo);
  }

  hpInimigo -= dano;
  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
  setTimeout(() => turnoInimigo(), 1500);
}

function defender() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

  if (classeHeroi.includes("guer")) {
    mensagem("🛡️ Você ergueu seu escudo!");
    // aqui você pode criar efeito escudo
  } else if (classeHeroi.includes("mag")) {
    mensagem("✨ Você conjurou uma barreira mágica!");
    // aqui você pode criar efeito barreira
  } else if (classeHeroi.includes("arq")) {
    mensagem("🏹 Você se esquivou rapidamente!");
    // pode criar efeito de esquiva
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
    mostrarDano(dano);

    // efeito visual de magia
    if (classeHeroi.includes("mag")) efeitoMagiaBasica(heroi, inimigo);
  } else {
    mensagem("Mana insuficiente!");
  }

  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
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

// ---------------- TURNO DO INIMIGO ----------------
function turnoInimigo(defesa = false) {
  if (hpInimigo > 0) {
    let dano = Math.floor(Math.random() * 12) + 3;
    if (defesa) dano = Math.floor(dano / 2);

    hpHeroi -= dano;
    mensagem(`👹 O Goblin atacou e causou ${dano} de dano!`);
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
