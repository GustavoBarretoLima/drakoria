import { criarPersonagem } from "./personagens.js";
import { criarMonstro } from "./monstros.js";
import { iniciarBatalha } from "./batalhas.js";

// ======== core.js ========
// Funções e inicialização global do jogo Drakoria

// Caminhos base
const PATHS = {
  img: "./img/",
  js: "./js/",
  css: "./css/",
};

// ======== Inicialização ========
function iniciarDrakoria() {
  console.log("🔥 Iniciando Drakoria...");

  const heroi = criarPersonagem("Arthas", "Guerreiro");
  const dragao = criarMonstro("Dragão Negro", 500);

  console.log("⚔️ Preparando batalha...");
  iniciarBatalha(heroi, dragao);
}

window.addEventListener("load", iniciarDrakoria);

// ======== Carregamento de assets ========
function carregarAssets() {
  const assets = [
    `${PATHS.img}drakoria.png`,
    `${PATHS.img}personagens/heroi.png`,
    `${PATHS.img}monstros/dragao.png`,
  ];

  assets.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => console.log(`✅ Asset carregado: ${src}`);
    img.onerror = () => console.warn(`⚠️ Falha ao carregar: ${src}`);
  });
}

// ======== Eventos globais ========
function configurarEventosGlobais() {
  window.addEventListener("resize", ajustarLayout);
  document.addEventListener("keydown", detectarTeclas);
}

function ajustarLayout() {
  console.log("📐 Ajustando layout para nova resolução...");
}

function detectarTeclas(event) {
  if (event.key === "Enter") {
    console.log("🎮 Entrando no jogo...");
    // Aqui você pode chamar entrarNoJogo() do script.js
  }
}

// ======== Execução ========
window.addEventListener("load", iniciarDrakoria);
