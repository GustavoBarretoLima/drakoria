// ---------------- MENSAGENS ----------------
export function mensagem(texto) {
  const mensagens = document.getElementById("mensagens");
  mensagens.textContent = texto;
  mensagens.classList.add("ativo");
  setTimeout(() => mensagens.classList.remove("ativo"), 800);
}

// 🔹 Torna a função disponível globalmente
window.mensagem = mensagem;

// ---------------- Efeito dos números de dano ----------------
import { efeitoDano, efeitoDanoCritico } from "./efeitos.js";

export function mostrarDano(valor, inimigo) {
  efeitoDano(inimigo, valor);
}
export function mostrarDanoCritico(valor, inimigo) {
  efeitoDanoCritico(inimigo, valor);
}

// 🔹 Exposição global
window.mostrarDano = mostrarDano;
window.mostrarDanoCritico = mostrarDanoCritico;

// ---------------- INDICADOR DE TURNO ----------------
export function atualizarIndicadorTurno(turnoHeroi = true) {
  const indicador = document.getElementById("indicadorTurno");
  if (turnoHeroi) {
    indicador.textContent = "Seu turno";
    indicador.classList.remove("inimigo");
    indicador.classList.add("heroi");
  } else {
    indicador.textContent = "Turno do Goblin";
    indicador.classList.remove("heroi");
    indicador.classList.add("inimigo");
  }
  atualizarBotoes(turnoHeroi);
}

// ---------------- BOTÕES ----------------
export function atualizarBotoes(turnoHeroi) {
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

  document.querySelectorAll(".acoes button").forEach((botao) => {
    botao.disabled = !turnoHeroi;

    if (botao.id === "btnMagia") {
      if (classeHeroi.includes("mag")) {
        botao.disabled = !turnoHeroi;
        botao.style.opacity = "1";
      } else {
        botao.disabled = true;
        botao.style.opacity = "0.5";
      }
    }

    if (turnoHeroi) {
      botao.classList.add("ativo");
      setTimeout(() => botao.classList.remove("ativo"), 600);
    }
  });
}
