function tremerInimigo(inimigo) {
  anime({
    targets: inimigo,
    translateX: [
      { value: -5, duration: 50 },
      { value: 5, duration: 50 },
      { value: -5, duration: 50 },
      { value: 0, duration: 50 },
    ],
    easing: "easeInOutQuad",
  });
}
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
    complete: () => {
      corte.remove();
      tremerInimigo(inimigo);
    },
  });
}

// 🌀 Mago/Maga – ataque básico com rajada arcana
export function efeitoAtaqueBasicoMago(inimigo) {
  const rectInimigo = inimigo.getBoundingClientRect();

  for (let i = 0; i < 2; i++) {
    const rajada = document.createElement("div");
    rajada.classList.add("rajada-arcana");
    document.body.appendChild(rajada);

    rajada.style.left = `${rectInimigo.left + rectInimigo.width / 2}px`;
    rajada.style.top = `${rectInimigo.top + rectInimigo.height / 2}px`;
    rajada.style.position = "absolute";

    anime({
      targets: rajada,
      scale: [0.3, 1.2],
      opacity: [1, 0],
      duration: 500,
      delay: i * 150,
      easing: "easeOutCubic",
      complete: () => rajada.remove(),
    });
  }

  // tremor leve no inimigo
  tremerInimigo(inimigo); // 🔹 direto, sem setTimeout
}

// ✨ Magia básica – múltiplas explosões no inimigo
export function efeitoMagiaBasica(heroi, inimigo) {
  const rectInimigo = inimigo.getBoundingClientRect();

  // cria 3 explosões em sequência
  for (let i = 0; i < 3; i++) {
    const explosao = document.createElement("div");
    explosao.classList.add("explosao-magica");
    document.body.appendChild(explosao);

    explosao.style.left = `${rectInimigo.left + rectInimigo.width / 2}px`;
    explosao.style.top = `${rectInimigo.top + rectInimigo.height / 2}px`;
    explosao.style.position = "absolute";

    anime({
      targets: explosao,
      scale: [0.3, 1.5],
      opacity: [1, 0],
      duration: 600,
      delay: i * 200, // cada explosão acontece logo depois da outra
      easing: "easeOutCubic",
      complete: () => explosao.remove(),
    });
  }

  // aplica tremor no inimigo após as explosões
  setTimeout(() => tremerInimigo(inimigo), 700);
}

/*arqueiro*/
export function efeitoPrepararArqueiro() {
  const arqueiro = document.querySelector(".heroi");
  anime({
    targets: arqueiro,
    translateX: [-25, 0], // recua mais
    scale: [1, 1.05, 1], // dá uma leve tensão
    duration: 700,
    easing: "easeInOutQuad",
  });
}
// 🏹 Flecha básica com rastro + impacto
export function efeitoFlechaBasica(inimigo) {
  const flecha = document.createElement("div");
  flecha.classList.add("flecha");
  document.body.appendChild(flecha);

  const trilha = document.createElement("div");
  trilha.classList.add("flecha-trilha");
  document.body.appendChild(trilha);

  const arqueiro = document.querySelector(".heroi");
  const origemX = arqueiro.offsetLeft + arqueiro.offsetWidth / 2;
  const origemY = arqueiro.offsetTop + arqueiro.offsetHeight / 2;
  const alvoX = inimigo.offsetLeft + inimigo.offsetWidth / 2;
  const alvoY = inimigo.offsetTop + inimigo.offsetHeight / 2;

  flecha.style.left = `${origemX}px`;
  flecha.style.top = `${origemY}px`;
  trilha.style.left = `${origemX}px`;
  trilha.style.top = `${origemY}px`;

  anime({
    targets: [flecha, trilha],
    translateX: [0, alvoX - origemX],
    translateY: [0, alvoY - origemY],
    opacity: [1, 0],
    duration: 800,
    easing: "easeOutCubic",
    complete: () => {
      flecha.remove();
      trilha.remove();
      tremerInimigo(inimigo); // 🔹 aplica tremor no impacto
    },
  });
}

// 🔥 Preparação especial para crítico
export function efeitoPrepararArqueiroCritico() {
  const arqueiro = document.querySelector(".heroi");

  anime({
    targets: arqueiro,
    translateX: [-40, 0], // recua mais forte
    scale: [1, 1.1, 1], // dá sensação de tensão máxima
    duration: 900,
    easing: "easeInOutQuad",
  });
}

// 🏹 Flecha crítica – duas flechas douradas + recuo especial
export function efeitoFlechaCritica(inimigo) {
  efeitoPrepararArqueiroCritico(); // arqueiro recua mais forte

  const arqueiro = document.querySelector(".heroi");
  const origemX = arqueiro.offsetLeft + arqueiro.offsetWidth / 2;
  const origemY = arqueiro.offsetTop + arqueiro.offsetHeight / 2;
  const alvoX = inimigo.offsetLeft + inimigo.offsetWidth / 2;
  const alvoY = inimigo.offsetTop + inimigo.offsetHeight / 2;

  for (let i = 0; i < 2; i++) {
    const flecha = document.createElement("div");
    flecha.classList.add("flecha-critica");
    document.body.appendChild(flecha);

    flecha.style.left = `${origemX}px`;
    flecha.style.top = `${origemY}px`;

    anime({
      targets: flecha,
      translateX: [0, alvoX - origemX],
      translateY: [0, alvoY - origemY],
      opacity: [1, 0],
      scale: [1, 1.3],
      duration: 900,
      delay: i * 200, // segunda flecha sai logo depois
      easing: "easeOutBack",
      complete: () => {
        flecha.remove();
        tremerInimigo(inimigo); // 🔹 aplica tremor no impacto
      },
    });
  }
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
    complete: () => {
      critico.remove();
      tremerInimigo(inimigo); // 🔹 aplica tremor no impacto
    },
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
    complete: () => {
      esfera.remove();
      tremerInimigo(inimigo);
    },
  }).finished;
}

// 🔴 Dano normal – sobe, balança, quica e depois desaparece
export function efeitoDano(inimigo, valor) {
  const dano = document.createElement("div");
  dano.classList.add("dano-numero");
  dano.textContent = `-${valor}`;
  document.body.appendChild(dano);

  const rect = inimigo.getBoundingClientRect();

  // variação aleatória de posição inicial
  const offsetX = (Math.random() - 0.5) * 40;
  const offsetY = (Math.random() - 0.5) * 20;

  dano.style.left = `${rect.left + rect.width / 2 + offsetX}px`;
  dano.style.top = `${rect.top + offsetY}px`;
  dano.style.position = "absolute";

  const rotacao = (Math.random() - 0.5) * 20;

  anime({
    targets: dano,
    keyframes: [
      { translateY: 10, rotate: rotacao }, // sobe
      { translateY: 1, rotate: -rotacao / 2 }, // balança
      { translateY: 30, translateX: 30 }, // cai para o lado
      { translateY: 0, translateX: 40 }, // quica no chão
    ],
    opacity: [1, 0],
    duration: 2600,
    easing: "easeOutBounce", // dá o efeito de quicar
    complete: () => dano.remove(),
  });
}

// ✨ Dano crítico – sobe mais alto e cai para o outro lado
export function efeitoDanoCritico(inimigo, valor) {
  const dano = document.createElement("div");
  dano.classList.add("dano-critico");
  dano.textContent = `CRIT! -${valor}`;
  document.body.appendChild(dano);

  const rect = inimigo.getBoundingClientRect();
  dano.style.left = `${rect.left + rect.width / 2}px`;
  dano.style.top = `${rect.top}px`;
  dano.style.position = "absolute";

  anime({
    targets: dano,
    translateY: [0, -90, 30], // sobe mais e cai
    translateX: [0, -50], // desloca para o outro lado
    rotate: [0, -25], // inclina para o lado oposto
    opacity: [1, 0],
    duration: 1800,
    easing: "easeOutCubic",
    complete: () => dano.remove(),
  });
}

// 💢 Efeito de dano no inimigo – overlay vermelho + tremor
export function efeitoReceberDano(inimigo) {
  const overlay = document.createElement("div");
  overlay.classList.add("dano-overlay");
  inimigo.appendChild(overlay);

  anime({
    targets: overlay,
    opacity: [0.6, 0],
    duration: 300,
    easing: "easeOutQuad",
    complete: () => overlay.remove(),
  });

  anime({
    targets: inimigo,
    translateX: [
      { value: -8, duration: 50 },
      { value: 8, duration: 50 },
      { value: -8, duration: 50 },
      { value: 0, duration: 50 },
    ],
    easing: "easeInOutQuad",
  });
}

// 💥 Herói recebe dano – flash vermelho + tremor
export function efeitoReceberDanoHeroi(heroi) {
  const overlay = document.createElement("div");
  overlay.classList.add("heroi-dano-overlay");
  heroi.appendChild(overlay);

  anime({
    targets: overlay,
    opacity: [0.6, 0],
    duration: 400,
    easing: "easeOutQuad",
    complete: () => overlay.remove(),
  });

  anime({
    targets: heroi,
    translateX: [
      { value: -8, duration: 60 },
      { value: 8, duration: 60 },
      { value: -8, duration: 60 },
      { value: 0, duration: 60 },
    ],
    easing: "easeInOutQuad",
  });

  anime({
    targets: heroi,
    opacity: [1, 0.7, 1],
    duration: 300,
    easing: "easeInOutSine",
  });
}

// 💥 Herói recebe dano crítico – flash vermelho forte + partículas + tremor
export function efeitoReceberDanoHeroiCritico(heroi) {
  // overlay vermelho mais intenso
  const overlay = document.createElement("div");
  overlay.classList.add("heroi-dano-overlay-critico");
  heroi.appendChild(overlay);

  anime({
    targets: overlay,
    opacity: [0.9, 0],
    duration: 600,
    easing: "easeOutQuad",
    complete: () => overlay.remove(),
  });

  // tremor mais forte
  anime({
    targets: heroi,
    translateX: [
      { value: -12, duration: 60 },
      { value: 12, duration: 60 },
      { value: -12, duration: 60 },
      { value: 0, duration: 60 },
    ],
    easing: "easeInOutQuad",
  });

  // partículas vermelhas
  for (let i = 0; i < 8; i++) {
    const particula = document.createElement("div");
    particula.classList.add("particula-critico");
    heroi.appendChild(particula);

    anime({
      targets: particula,
      translateX: (Math.random() - 0.5) * 100,
      translateY: (Math.random() - 0.5) * 100,
      opacity: [1, 0],
      scale: [1, 0],
      duration: 800,
      easing: "easeOutCubic",
      complete: () => particula.remove(),
    });
  }
}
