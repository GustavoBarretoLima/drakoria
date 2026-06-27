// Importa módulos
import { gifsHeroi, gifsGoblin } from "./gifs.js";
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
  const inimigo = document.querySelector(".inimigo-img");

  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "guerreiro"
  ).toLowerCase();
  const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

  // 🔹 Define HP/Mana por classe base
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

  // 🔹 Usa o mapa de gifs com classe base + gênero
  heroiBatalha.src =
    gifsHeroi[classeHeroi][generoHeroi]?.padrao ||
    "../img/personagens/guerreiro.gif";
  if (gifsGoblin) {
    inimigo.src = gifsGoblin.padrao;
  }
  // 🔹 Atualiza o texto da classe conforme o gênero
  const nomeClasse = {
    guerreiro: { Masculino: "Guerreiro", Feminino: "Guerreira" },
    mago: { Masculino: "Mago", Feminino: "Maga" },
    arqueiro: { Masculino: "Arqueiro", Feminino: "Arqueira" },
  };

  const classeHeroiTexto =
    nomeClasse[classeHeroi]?.[generoHeroi] || "Guerreiro";

  document.getElementById("classeHeroi").textContent = classeHeroiTexto;

  // 🔹 Desabilita botão Magia para classes que não usam magia
  const btnMagia = document.getElementById("btnMagia");
  if (classeHeroi.includes("arque")) {
    // só arqueiro não usa magia
    btnMagia.disabled = true;
    btnMagia.style.opacity = "0.5";
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
  const heroi = document.getElementById("heroiBatalha");
  const inimigo = document.querySelector(".inimigo-img");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "guerreiro"
  ).toLowerCase();
  const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

  // 🔹 Gif de ataque do herói
  if (gifsHeroi[classeHeroi] && gifsHeroi[classeHeroi][generoHeroi]) {
    heroi.src = gifsHeroi[classeHeroi][generoHeroi].atk;
    setTimeout(() => {
      heroi.src = gifsHeroi[classeHeroi][generoHeroi].padrao;
    }, 1500);
  }

  // 🔹 Se for arqueiro, dispara flecha após o gif terminar
  if (classeHeroi.includes("arque")) {
    setTimeout(() => {
      const flecha = document.createElement("img");
      flecha.src = "../img/skills/Flecha.gif";
      flecha.classList.add("flecha-efeito");
      document.body.appendChild(flecha);

      const rectHeroi = heroi.getBoundingClientRect();
      flecha.style.position = "absolute";
      flecha.style.left = `${rectHeroi.left + rectHeroi.width / 2}px`;
      flecha.style.top = `${rectHeroi.top + rectHeroi.height / 2}px`;
      flecha.style.width = "80px";

      const rectInimigo = inimigo.getBoundingClientRect();

      anime({
        targets: flecha,
        left: `${rectInimigo.left + rectInimigo.width / 2}px`,
        top: `${rectInimigo.top + rectInimigo.height / 2}px`,
        duration: 700,
        easing: "easeOutQuad",
        complete: () => {
          flecha.remove();
        },
      });
    }, 500); // espera o tempo do gif antes de lançar a flecha
  }

  // 🔹 Gif de dano do goblin
  if (gifsGoblin) {
    inimigo.classList.add("dano");
    inimigo.src = gifsGoblin.damage;
    setTimeout(() => {
      inimigo.src = gifsGoblin.padrao;
      inimigo.classList.remove("dano");
    }, 1000);
  }

  // 🔹 Cálculo de dano e mensagens
  if (critico) {
    dano *= 2;
    mostrarDanoCritico(dano, inimigo);
    efeitoReceberDano(inimigo);
    mensagem(`💥 CRÍTICO! Você causou ${dano} de dano!`);
  } else {
    mostrarDano(dano, inimigo);
    efeitoReceberDano(inimigo);
    mensagem(`Você atacou e causou ${dano} de dano!`);
  }

  // 🔹 Atualiza vida do inimigo
  hpInimigo -= dano;
  atualizarStatus(hpHeroi, manaHeroi, hpInimigo);

  // 🔹 Verifica se o Goblin morreu
  if (hpInimigo <= 0) {
    hpInimigo = 0;
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);

    if (gifsGoblin) {
      inimigo.src = gifsGoblin.morte;
    }

    cenaVitoriaGoblin();
    return;
  }

  // Se ainda está vivo, passa o turno para o inimigo
  setTimeout(() => turnoInimigo(), 1500);
}

function defender() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const heroi = document.getElementById("heroiBatalha");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "guerreiro"
  ).toLowerCase();
  const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

  // 🔹 Usa o mapa de gifs para defesa com classe base + gênero
  if (gifsHeroi[classeHeroi] && gifsHeroi[classeHeroi][generoHeroi]) {
    heroi.src = gifsHeroi[classeHeroi][generoHeroi].defesa;
    setTimeout(() => {
      heroi.src = gifsHeroi[classeHeroi][generoHeroi].padrao;
    }, 2000);
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
  setTimeout(() => turnoInimigo(true), 500);
}

function magia() {
  if (!podeAgir()) return;
  encerrarTurnoHeroi();

  const heroi = document.getElementById("heroiBatalha");
  const inimigo = document.querySelector(".inimigo-img");
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "guerreiro"
  ).toLowerCase();
  const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

  if (manaHeroi >= 10) {
    manaHeroi -= 10;
    let dano = Math.floor(Math.random() * 25) + 10;

    // 1️⃣ Assim que aperta magia, goblin já mostra dano
    if (gifsGoblin) {
      inimigo.src = gifsGoblin.damage;
      inimigo.classList.add("dano");
      setTimeout(() => {
        inimigo.src = gifsGoblin.padrao;
        inimigo.classList.remove("dano");
      }, 600); // tempo menor para resposta rápida
    }

    // 2️⃣ Guerreiro faz animação de ataque
    heroi.src = gifsHeroi[classeHeroi][generoHeroi].atk;
    setTimeout(() => {
      heroi.src = gifsHeroi[classeHeroi][generoHeroi].padrao;
    }, 1000);

    // 3️⃣ Criar Slash.gif como efeito separado
    const slash = document.createElement("img");
    slash.src = "../img/skills/Slash.gif";
    slash.classList.add("slash-efeito");
    document.body.appendChild(slash);

    const rectHeroi = heroi.getBoundingClientRect();
    slash.style.position = "absolute";
    slash.style.left = `${rectHeroi.left + rectHeroi.width / 2}px`;
    slash.style.top = `${rectHeroi.top + rectHeroi.height / 2}px`;
    slash.style.width = "120px";

    const rectInimigo = inimigo.getBoundingClientRect();

    anime({
      targets: slash,
      left: `${rectInimigo.left + rectInimigo.width / 2}px`,
      top: `${rectInimigo.top + rectInimigo.height / 2}px`,
      duration: 800,
      easing: "easeOutQuad",
      complete: () => {
        slash.remove();
      },
    });

    // 4️⃣ Aplicar dano
    hpInimigo -= dano;
    mensagem(`⚔️ Você usou Slash e causou ${dano} de dano!`);
    mostrarDano(dano, inimigo);
    atualizarStatus(hpHeroi, manaHeroi, hpInimigo);

    if (hpInimigo <= 0) {
      hpInimigo = 0;
      atualizarStatus(hpHeroi, manaHeroi, hpInimigo);
      cenaVitoriaGoblin();
      return;
    }
  } else {
    mensagem("Mana insuficiente!");
  }
  setTimeout(() => turnoInimigo(), 200);
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

    const heroi = document.getElementById("heroiBatalha");
    const goblin = document.querySelector(".inimigo-img");

    // Goblin desliza até o herói antes de atacar
    const rectHeroi = heroi.getBoundingClientRect();
    const rectGoblin = goblin.getBoundingClientRect();

    const deslocX = rectHeroi.left - rectGoblin.left;
    const deslocY = rectHeroi.top - rectGoblin.top;

    anime({
      targets: goblin,
      translateX: deslocX,
      translateY: deslocY,
      duration: 600,
      easing: "easeOutQuad",
      complete: () => {
        // aplica o dano ao herói
        hpHeroi -= dano;

        if (gifsGoblin) {
          goblin.src = gifsGoblin.atk;
          goblin.classList.add("atacando");
        }

        // Gif de dano do herói
        const classeHeroi = (
          localStorage.getItem("classeHeroi") || "guerreiro"
        ).toLowerCase();
        const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

        if (gifsHeroi[classeHeroi] && gifsHeroi[classeHeroi][generoHeroi]) {
          heroi.src = gifsHeroi[classeHeroi][generoHeroi].damage;
          setTimeout(() => {
            heroi.src = gifsHeroi[classeHeroi][generoHeroi].padrao;
          }, 1000);
        }

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

        // volta o goblin para posição original
        anime({
          targets: goblin,
          translateX: 0,
          translateY: 0,
          duration: 600,
          easing: "easeOutQuad",
          complete: () => {
            goblin.src = gifsGoblin.padrao;
            goblin.classList.remove("atacando");
            turnoHeroi = true;
            atualizarIndicadorTurno(true);
          },
        });
      },
    });
  } else {
    mensagem("🏆 Você derrotou o Goblin!");
    return;
  }
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
