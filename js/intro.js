window.onload = function () {
  const classe = localStorage.getItem("classeEscolhida");
  const genero = localStorage.getItem("generoEscolhido");
  const nomeHeroi = localStorage.getItem("nomeHeroi");

  const introTexto = `
    Em um mundo devastado por guerras antigas, surge um novo herói.
    <span class="nome-destaque">${nomeHeroi}</span>, o(a) ${classe}, caminha em direção à cidade de Drakoria,
    buscando glória e redenção. Mas no caminho, uma sombra surge...
    Um Goblin faminto bloqueia sua passagem!
  `;

  digitarTexto(introTexto, "introTexto");
};

function digitarTexto(texto, elementoId) {
  const elemento = document.getElementById(elementoId);
  let i = 0;

  function escrever() {
    if (i < texto.length) {
      elemento.innerHTML = texto.substring(0, i + 1); // usa innerHTML para renderizar tags
      i++;
      setTimeout(escrever, 40);
    }
  }

  escrever();
}

function iniciarBatalha() {
  window.location.href = "batalha.html";
}
