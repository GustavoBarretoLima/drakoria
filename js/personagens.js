let generoSelecionado = "Masculino";

function selecionarGenero(genero) {
  generoSelecionado = genero;
  atualizarImagens();

  // Remove destaque de todos os botões
  document.querySelectorAll(".opcoes-genero button").forEach((btn) => {
    btn.classList.remove("ativo");
  });

  // Adiciona destaque ao botão clicado
  const botaoSelecionado =
    genero === "Masculino"
      ? document.querySelector(".opcoes-genero button:nth-child(1)")
      : document.querySelector(".opcoes-genero button:nth-child(2)");
  botaoSelecionado.classList.add("ativo");
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

function selecionarPersonagem(classe) {
  let nomeClasse = classe;
  if (generoSelecionado === "Feminino") {
    if (classe === "Guerreiro") nomeClasse = "Guerreira";
    if (classe === "Mago") nomeClasse = "Maga";
    if (classe === "Arqueiro") nomeClasse = "Arqueira";
  }

  const nomeHeroi = document.getElementById("nomeHeroi").value.trim();

  // Validação: impede continuar sem nome
  if (!nomeHeroi) {
    alert("Por favor, digite o nome do seu herói antes de continuar!");
    return;
  }

  // Salva no localStorage
  localStorage.setItem("classeEscolhida", nomeClasse);
  localStorage.setItem("generoEscolhido", generoSelecionado);
  localStorage.setItem("nomeHeroi", nomeHeroi);

  // Vai para a intro
  window.location.href = "intro.html";
}
