import { animate } from "animejs";

// ⚔️ Guerreiro/Guerreira – corte básico
export function efeitoCorteBasico(inimigo) {
  const corte = document.createElement("div");
  corte.classList.add("corte-amplo");
  inimigo.appendChild(corte);

  anime({
    targets: corte,
    scaleX: [0.2, 1.5],
    opacity: [1, 0],
    duration: 600,
    easing: "easeOutExpo",
    complete: () => corte.remove(),
  });
}

// ✨ Mago/Maga – conjuração + explosão
export async function efeitoMagiaBasica(heroi, inimigo) {
  const esfera = document.createElement("div");
  esfera.classList.add("explosao-magica");
  inimigo.appendChild(esfera);

  // brilho no herói
  await anime({
    targets: heroi,
    filter: ["drop-shadow(0 0 0px #00f)", "drop-shadow(0 0 20px #00f)"],
    duration: 400,
    easing: "easeInOutSine",
  }).finished;

  // explosão no inimigo
  await anime({
    targets: esfera,
    scale: [0.5, 1.5],
    opacity: [1, 0],
    duration: 800,
    easing: "easeOutQuad",
    complete: () => esfera.remove(),
  }).finished;
}

// 🏹 Arqueiro/Arqueira – flecha básica
export function efeitoFlechaBasica(inimigo) {
  const flecha = document.createElement("div");
  flecha.classList.add("flecha");
  inimigo.appendChild(flecha);

  anime({
    targets: flecha,
    translateX: [-200, 200],
    translateY: [-20, 20],
    opacity: [1, 0],
    duration: 800,
    easing: "easeOutCubic",
    complete: () => flecha.remove(),
  });
}
// 🏹 Flecha crítica – maior, dourada e mais brilhante
export function efeitoFlechaCritica(inimigo) {
  const flecha = document.createElement("div");
  flecha.classList.add("flecha-critica");
  inimigo.appendChild(flecha);

  anime({
    targets: flecha,
    translateX: [-250, 250],
    opacity: [1, 0],
    scale: [1, 1.4],
    duration: 1000,
    easing: "easeOutBack",
    complete: () => flecha.remove(),
  });
}

// 💥 Crítico – círculo vermelho
export function efeitoCorteCritico(inimigo) {
  const critico = document.createElement("div");
  critico.classList.add("corte-critico");
  inimigo.appendChild(critico);

  anime({
    targets: critico,
    scale: [0.5, 1.2],
    opacity: [1, 0],
    duration: 700,
    easing: "easeOutBack",
    complete: () => critico.remove(),
  });
}

// ✨ Magia crítica – explosão dourada
export async function efeitoMagiaCritica(heroi, inimigo) {
  const esfera = document.createElement("div");
  esfera.classList.add("explosao-magica");
  esfera.style.background = "radial-gradient(circle, #ffd700, #aa8800)";
  inimigo.appendChild(esfera);

  await anime({
    targets: heroi,
    filter: ["drop-shadow(0 0 0px #ffd700)", "drop-shadow(0 0 25px #ffd700)"],
    duration: 500,
    easing: "easeInOutSine",
  }).finished;

  await anime({
    targets: esfera,
    scale: [0.5, 2],
    opacity: [1, 0],
    duration: 900,
    easing: "easeOutQuad",
    complete: () => esfera.remove(),
  }).finished;
}

// 🔴 Dano normal – número vermelho que sobe
export function efeitoDano(inimigo, valor) {
  const dano = document.createElement("div");
  dano.classList.add("dano-numero");
  dano.textContent = `-${valor}`;
  inimigo.appendChild(dano);

  anime({
    targets: dano,
    translateY: [-20, -60],
    opacity: [1, 0],
    duration: 1000,
    easing: "easeOutCubic",
    complete: () => dano.remove(),
  });
}

// ✨ Dano crítico – número dourado maior
export function efeitoDanoCritico(inimigo, valor) {
  const critico = document.createElement("div");
  critico.classList.add("dano-critico");
  critico.textContent = `-${valor}`;
  inimigo.appendChild(critico);

  anime({
    targets: critico,
    translateY: [-30, -80],
    opacity: [1, 0],
    scale: [1, 1.3],
    duration: 1200,
    easing: "easeOutBack",
    complete: () => critico.remove(),
  });
}
