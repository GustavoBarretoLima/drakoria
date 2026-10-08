let typingTimer = null;
let goblinTimer = null;
let introFinalizada = false;

window.addEventListener("DOMContentLoaded", () => {
  const classe =
    localStorage.getItem("classeHeroi") ||
    localStorage.getItem("classeHeroiTexto") ||
    "Classe";
  const nomeHeroi = localStorage.getItem("nomeHeroi") || "Herói";

  const introTexto = `
    Em um mundo devastado por guerras antigas, surge um novo herói.
    <span class="nome-destaque">${nomeHeroi}</span>, o(a) ${classe}, caminha em direção à cidade de Drakoria,
    buscando glória e redenção. Mas no caminho, uma sombra surge...
    Um Goblin faminto bloqueia sua passagem!
  `;

  const btnContinuar = document.getElementById("continuar");
  const btnPular = document.getElementById("pularDialogos");

  btnContinuar?.addEventListener("click", iniciarBatalha);
  btnPular?.addEventListener("click", pularDialogos);

  digitarTexto(introTexto, "introTexto", mostrarCenaGoblin);
});

function digitarTexto(texto, elementoId, callback) {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  let i = 0;
  elemento.innerHTML = "";

  function escrever() {
    if (introFinalizada) return;

    if (i < texto.length) {
      elemento.innerHTML = texto.substring(0, i + 1);
      i++;
      typingTimer = window.setTimeout(escrever, 40);
      return;
    }

    typingTimer = null;
    callback?.();
  }

  escrever();
}

function mostrarCenaGoblin() {
  if (introFinalizada) return;

  const goblinCena = document.getElementById("goblinCena");
  const somGoblin = document.getElementById("somGoblin");
  const falaGoblin = document.getElementById("falaGoblin");
  const btnContinuar = document.getElementById("continuar");

  if (goblinCena) goblinCena.style.display = "block";

  if (somGoblin) {
    somGoblin.currentTime = 0;
    somGoblin.play().catch(() => {
      // Navegadores podem bloquear autoplay; a cena continua normalmente.
    });
  }

  goblinTimer = window.setTimeout(() => {
    if (introFinalizada) return;

    if (falaGoblin) {
      falaGoblin.innerHTML = "“Haaaaaaa! Carne fresca! Você não passará, herói!”";
    }

    if (btnContinuar) {
      btnContinuar.style.display = "inline-block";
      btnContinuar.style.opacity = "1";
    }

    goblinTimer = null;
  }, 1200);
}

function pularDialogos() {
  if (introFinalizada) return;

  introFinalizada = true;

  if (typingTimer !== null) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }

  if (goblinTimer !== null) {
    clearTimeout(goblinTimer);
    goblinTimer = null;
  }

  const somGoblin = document.getElementById("somGoblin");
  if (somGoblin) {
    somGoblin.pause();
    somGoblin.currentTime = 0;
  }

  iniciarBatalha();
}

function iniciarBatalha() {
  // The opening fight must not inherit a previous dungeon encounter.
  for (const key of ["worldRegionAtual", "dungeonAtual", "dungeonNivelMin", "dungeonNivelMax", "dungeonEncontroTipo", "dungeonEncontroNivel", "dungeonDanger", "drakoriaDungeonRun"]) localStorage.removeItem(key);
  localStorage.setItem("tipoBatalhaAtual", "intro-goblin");
  localStorage.setItem("monsterIdAtual", "goblin-normal-lvl-1");
  window.location.href = "batalha.html";
}
