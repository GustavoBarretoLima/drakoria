let hpHeroi = 100;
let manaHeroi = 50;
let hpInimigo = 60;

window.onload = function () {
  // Seleciona imagem do herói conforme a classe e gênero
  const heroiImg = document.querySelector(".heroi-img");
  const generoHeroi = localStorage.getItem("generoHeroi") || "masculino";

  switch (classeHeroi.toLowerCase()) {
    case "guerreiro":
      heroiImg.src =
        generoHeroi === "feminino"
          ? "../img/personagens/guerreira.png"
          : "../img/personagens/guerreiro.png";
      break;
    case "mago":
      heroiImg.src =
        generoHeroi === "feminino"
          ? "../img/personagens/maga.png"
          : "../img/personagens/mago.png";
      break;
    case "arqueiro":
      heroiImg.src =
        generoHeroi === "feminino"
          ? "../img/personagens/arqueira.png"
          : "../img/personagens/arqueiro.png";
      break;
    default:
      heroiImg.src = "../img/personagens/guerreiro.png"; // imagem padrão
      break;
  }

  atualizarStatus();
};

function atualizarStatus() {
  document.getElementById("hpHeroiBar").style.width =
    Math.max(hpHeroi, 0) + "%";
  document.getElementById("manaHeroiBar").style.width =
    Math.max(manaHeroi, 0) + "%";
  document.getElementById("hpInimigoBar").style.width =
    Math.max(hpInimigo, 0) + "%";
}

function mensagem(texto) {
  document.getElementById("mensagens").innerHTML = texto;
}

// efeitos visuais
function efeitoDanoInimigo() {
  const inimigo = document.querySelector(".inimigo-img");
  inimigo.classList.add("dano");
  setTimeout(() => inimigo.classList.remove("dano"), 400);
}

function efeitoMagiaHeroi() {
  const heroi = document.querySelector(".heroi-img");
  heroi.classList.add("magia");
  setTimeout(() => heroi.classList.remove("magia"), 600);
}

// ações
function atacar() {
  let dano = Math.floor(Math.random() * 15) + 5;
  hpInimigo -= dano;
  mensagem(`Você atacou e causou ${dano} de dano!`);
  efeitoDanoInimigo();
  turnoInimigo();
  atualizarStatus();
}

function defender() {
  mensagem("Você se defende, reduzindo o próximo dano!");
  turnoInimigo(true);
}

function magia() {
  if (manaHeroi >= 10) {
    manaHeroi -= 10;
    let dano = Math.floor(Math.random() * 25) + 10;
    hpInimigo -= dano;
    mensagem(`Você lançou uma magia e causou ${dano} de dano!`);
    efeitoMagiaHeroi();
    efeitoDanoInimigo();
    turnoInimigo();
  } else {
    mensagem("Mana insuficiente!");
  }
  atualizarStatus();
}

function fugir() {
  mensagem("Você tenta fugir... mas o Goblin bloqueia sua saída!");
}

function turnoInimigo(defesa = false) {
  if (hpInimigo > 0) {
    let dano = Math.floor(Math.random() * 12) + 3;
    if (defesa) dano = Math.floor(dano / 2);
    hpHeroi -= dano;
    mensagem(`O Goblin atacou e causou ${dano} de dano!`);
  } else {
    mensagem("Você derrotou o Goblin!");
  }
  atualizarStatus();
}
