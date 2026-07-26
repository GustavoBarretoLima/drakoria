let generoSelecionado = "masculino";

// Normaliza classe e retorna nome correto por gênero
function formatarClassePorGenero(classe, genero) {
  const classeNormalizada = classe.toLowerCase();
  const nomes = {
    guerreiro: { masculino: "Guerreiro", feminino: "Guerreira" },
    mago: { masculino: "Mago", feminino: "Maga" },
    arqueiro: { masculino: "Arqueiro", feminino: "Arqueira" },
  };

  return nomes[classeNormalizada]?.[genero.toLowerCase()] || classe;
}

// Seleciona gênero e atualiza interface
function selecionarGenero(genero) {
  generoSelecionado = genero;
  atualizarImagens();

  document.querySelectorAll(".opcoes-genero button").forEach((btn) => {
    btn.classList.remove("ativo");
  });

  const botaoSelecionado = document.querySelector(`[data-genero="${genero}"]`);
  botaoSelecionado?.classList.add("ativo");

  localStorage.setItem("generoHeroi", generoSelecionado.toLowerCase());
}

// Atualiza imagens e textos conforme gênero
function atualizarImagens() {
  const isFeminino = generoSelecionado.toLowerCase() === "feminino";

  const imagens = {
    guerreiro: isFeminino ? "guerreira.png" : "guerreiro.png",
    mago: isFeminino ? "maga.png" : "mago.png",
    arqueiro: isFeminino ? "arqueira.png" : "arqueiro.png",
  };

  const nomes = {
    guerreiro: isFeminino ? "Guerreira" : "Guerreiro",
    mago: isFeminino ? "Maga" : "Mago",
    arqueiro: isFeminino ? "Arqueira" : "Arqueiro",
  };

  Object.keys(imagens).forEach((classe) => {
    const imgEl = document.getElementById(
      `img${classe.charAt(0).toUpperCase() + classe.slice(1)}`,
    );
    const nomeEl = document.getElementById(
      `nome${classe.charAt(0).toUpperCase() + classe.slice(1)}`,
    );

    if (imgEl) imgEl.src = `../img/personagens/${imagens[classe]}`;
    if (nomeEl) nomeEl.textContent = nomes[classe];
  });
}

// Seleciona personagem e salva dados
function selecionarPersonagem(classe) {
  const inputNome = document.getElementById("nomeHeroi");
  const erroNome = document.getElementById("erroNome");

  if (!inputNome) {
    console.error("Campo de nome do herói não encontrado.");
    return;
  }

  const nomeHeroi = inputNome.value.trim();
  if (!nomeHeroi) {
    erroNome.textContent = "⚠️ Digite o nome do seu herói antes de continuar!";
    erroNome.style.display = "block";
    inputNome.classList.add("shake");
    setTimeout(() => inputNome.classList.remove("shake"), 300);
    inputNome.focus();
    return;
  } else {
    erroNome.style.display = "none";
  }

  const classeBase = classe.toLowerCase();
  const classeExibicao = formatarClassePorGenero(classeBase, generoSelecionado);

  // Definir imagem/gif correto conforme gênero
  const isFeminino = generoSelecionado.toLowerCase() === "feminino";
  const imagens = {
    guerreiro: isFeminino ? "guerreira.gif" : "guerreiro.gif",
    mago: isFeminino ? "maga.gif" : "mago.gif",
    arqueiro: isFeminino ? "arqueira.gif" : "arqueiro.gif",
  };

  const imagemHeroi = imagens[classeBase];

  // Salvar no localStorage
  localStorage.setItem("classeHeroi", classeBase);
  localStorage.setItem("classeHeroiTexto", classeExibicao);
  localStorage.setItem("generoHeroi", generoSelecionado.toLowerCase());
  localStorage.setItem("nomeHeroi", nomeHeroi);
  localStorage.setItem("imagemHeroi", imagemHeroi); // <-- novo

  window.personagem = {
    nome: nomeHeroi,
    classe: classeBase,
    classeTexto: classeExibicao,
    genero: generoSelecionado.toLowerCase(),
    imagem: imagemHeroi, // <-- novo
  };

  window.location.href = "intro.html";
}

// Expondo funções globalmente
window.selecionarGenero = selecionarGenero;
window.selecionarPersonagem = selecionarPersonagem;
