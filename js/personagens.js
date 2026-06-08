let generoSelecionado = "Masculino";
// Obtém dados do herói do localStorage
window.personagem = {
  nome: localStorage.getItem("nomeHeroi") || "Herói",
  classe: (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase(),
  genero: (localStorage.getItem("generoHeroi") || "masculino").toLowerCase(),
};

function selecionarGenero(genero) {
  generoSelecionado = genero;
  atualizarImagens();

  document.querySelectorAll(".opcoes-genero button").forEach((btn) => {
    btn.classList.remove("ativo");
  });

  const botaoSelecionado =
    genero === "Masculino"
      ? document.querySelector(".opcoes-genero button:nth-child(1)")
      : document.querySelector(".opcoes-genero button:nth-child(2)");
  botaoSelecionado.classList.add("ativo");

  localStorage.setItem("generoHeroi", generoSelecionado);
}

function atualizarImagens() {
  if (generoSelecionado === "Feminino") {
    document.getElementById("imgGuerreiro").src =
      "../img/personagens/guerreira.png";
    document.getElementById("imgMago").src = "../img/personagens/maga.png";
    document.getElementById("imgArqueiro").src =
      "../img/personagens/arqueira.png";

    document.getElementById("nomeGuerreiro").textContent = "Guerreira";
    document.getElementById("nomeMago").textContent = "Maga";
    document.getElementById("nomeArqueiro").textContent = "Arqueira";
  } else {
    document.getElementById("imgGuerreiro").src =
      "../img/personagens/guerreiro.png";
    document.getElementById("imgMago").src = "../img/personagens/mago.png";
    document.getElementById("imgArqueiro").src =
      "../img/personagens/arqueiro.png";

    document.getElementById("nomeGuerreiro").textContent = "Guerreiro";
    document.getElementById("nomeMago").textContent = "Mago";
    document.getElementById("nomeArqueiro").textContent = "Arqueiro";
  }
}

// personagens.js
function selecionarPersonagem(classe) {
  let nomeClasse = classe;
  if (generoSelecionado === "Feminino") {
    if (classe === "Guerreiro") nomeClasse = "Guerreira";
    if (classe === "Mago") nomeClasse = "Maga";
    if (classe === "Arqueiro") nomeClasse = "Arqueira";
  }

  const nomeHeroi = document.getElementById("nomeHeroi").value.trim();
  if (!nomeHeroi) {
    alert("Por favor, digite o nome do seu herói antes de continuar!");
    return;
  }

  // salva no localStorage
  localStorage.setItem("classeHeroi", classe); // 🔹 aqui salva SEM gênero, padronizado
  localStorage.setItem("generoHeroi", generoSelecionado);
  localStorage.setItem("nomeHeroi", nomeHeroi);

  // cria objeto global personagem
  window.personagem = {
    nome: nomeHeroi,
    classe: classe.toLowerCase(), // "guerreiro", "mago", "arqueiro"
    genero: generoSelecionado.toLowerCase(), // "masculino" ou "feminino"
  };

  window.location.href = "intro.html";
}
