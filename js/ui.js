// ---------------- MENSAGENS ----------------
export function mensagem(texto) {
  const mensagens = document.getElementById("mensagens");
  mensagens.textContent = texto;
  mensagens.classList.add("ativo");
  setTimeout(() => mensagens.classList.remove("ativo"), 800);
}

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
  document.querySelectorAll(".acoes button").forEach((botao) => {
    botao.disabled = !turnoHeroi;
    if (turnoHeroi) {
      botao.classList.add("ativo");
      setTimeout(() => botao.classList.remove("ativo"), 600);
    }
  });
}

// ---------------- NÚMEROS DE DANO ----------------
export function mostrarDano(valor) {
  const inimigo = document.querySelector(".inimigo");
  const numero = document.createElement("div");
  numero.classList.add("dano-numero");
  numero.textContent = `-${valor}`;
  inimigo.appendChild(numero);

  // animação simples de subida
  numero.style.position = "absolute";
  numero.style.top = "0";
  numero.style.left = "50%";
  numero.style.transform = "translateX(-50%)";
  setTimeout(() => numero.remove(), 1000);
}

export function mostrarDanoCritico(valor) {
  const inimigo = document.querySelector(".inimigo");
  const numero = document.createElement("div");
  numero.classList.add("dano-critico");
  numero.textContent = `CRIT! -${valor}`;
  inimigo.appendChild(numero);

  numero.style.position = "absolute";
  numero.style.top = "0";
  numero.style.left = "50%";
  numero.style.transform = "translateX(-50%)";
  setTimeout(() => numero.remove(), 1500);
}
