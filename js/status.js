export function atualizarStatus(hpHeroi, manaHeroi, hpInimigo) {
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
  const classeHeroi = localStorage.getItem("classeHeroi") || "Guerreiro";

  document.getElementById("nomeHeroi").textContent = nomeHeroi;
  document.getElementById("classeHeroi").textContent = classeHeroi;
  document.getElementById("nomeInimigo").textContent = "Goblin";
}

export function carregarHeroi() {
  const heroiImg = document.querySelector(".heroi-img");
  const nomeHeroi = localStorage.getItem("nomeHeroi") || "Herói";
  const classeHeroi = localStorage.getItem("classeHeroi") || "Guerreiro";
  const generoHeroi = localStorage.getItem("generoHeroi") || "Masculino";

  const imagensHeroi = {
    guerreiro: {
      Masculino: "../img/personagens/guerreiro.png",
      Feminino: "../img/personagens/guerreira.png",
    },
    mago: {
      Masculino: "../img/personagens/mago.png",
      Feminino: "../img/personagens/maga.png",
    },
    arqueiro: {
      Masculino: "../img/personagens/arqueiro.png",
      Feminino: "../img/personagens/arqueira.png",
    },
  };

  // Normaliza a classe escolhida
  let classeKey = classeHeroi.toLowerCase();

  // Corrige equivalências femininas
  if (classeKey === "maga") classeKey = "mago";
  if (classeKey === "arqueira") classeKey = "arqueiro";
  if (classeKey === "guerreira") classeKey = "guerreiro";

  if (imagensHeroi[classeKey]) {
    heroiImg.src =
      imagensHeroi[classeKey][generoHeroi] || imagensHeroi[classeKey].Masculino;
  } else {
    heroiImg.src = "../img/personagens/guerreiro.png"; // fallback
  }
}
