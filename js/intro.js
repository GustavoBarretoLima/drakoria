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

  digitarTexto(introTexto, "introTexto", () => {
    const goblinCena = document.getElementById("goblinCena");
    const somGoblin = document.getElementById("somGoblin");

    goblinCena.style.display = "block";
    somGoblin.play(); // toca o som junto com o tremor

    setTimeout(() => {
      document.getElementById("falaGoblin").innerHTML =
        "“Haaaaaaa! Carne fresca! Você não passará, herói!”";
      document.getElementById("continuar").style.display = "inline-block";
    }, 1200);
  });
};

function digitarTexto(texto, elementoId, callback) {
  const elemento = document.getElementById(elementoId);
  let i = 0;

  function escrever() {
    if (i < texto.length) {
      elemento.innerHTML = texto.substring(0, i + 1);
      i++;
      setTimeout(escrever, 40);
    } else {
      if (callback) callback();
    }
  }

  escrever();
}

function iniciarBatalha() {
  window.location.href = "batalha.html";
}
