export function atualizarStatus(hpHeroi, manaHeroi, hpInimigo) {
  // Recupera classe para saber os máximos
  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "Guerreiro"
  ).toLowerCase();

  let hpMax, manaMax;
  if (classeHeroi.includes("guer")) {
    hpMax = 120;
    manaMax = 40;
  } else if (classeHeroi.includes("mag")) {
    hpMax = 80;
    manaMax = 80;
  } else if (classeHeroi.includes("arq")) {
    hpMax = 100;
    manaMax = 60;
  } else {
    hpMax = 100;
    manaMax = 50;
  }

  const inimigoMax = 60;

  // Calcula porcentagens
  const porcentagemHPHeroi = Math.max((hpHeroi / hpMax) * 100, 0);
  const porcentagemManaHeroi = Math.max((manaHeroi / manaMax) * 100, 0);
  const porcentagemHPInimigo = Math.max((hpInimigo / inimigoMax) * 100, 0);

  // Atualiza barras
  document.getElementById("hpHeroiBar").style.width = `${porcentagemHPHeroi}%`;
  document.getElementById("manaHeroiBar").style.width =
    `${porcentagemManaHeroi}%`;
  document.getElementById("hpInimigoBar").style.width =
    `${porcentagemHPInimigo}%`;

  // Atualiza textos
  document.getElementById("hpHeroiTexto").textContent =
    `${Math.max(hpHeroi, 0)}/${hpMax}`;
  document.getElementById("manaHeroiTexto").textContent =
    `${Math.max(manaHeroi, 0)}/${manaMax}`;
  document.getElementById("hpInimigoTexto").textContent =
    `${Math.max(hpInimigo, 0)}/${inimigoMax}`;

  // Atualiza nomes
  const nomeHeroi = localStorage.getItem("nomeHeroi") || "Herói";
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
