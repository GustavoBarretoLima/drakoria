let dialogoCancelado = false;
let timerAtual = null;
let resolverAtual = null;

function limparTimerAtual() {
  if (timerAtual !== null) {
    clearTimeout(timerAtual);
    timerAtual = null;
  }

  if (resolverAtual) {
    resolverAtual();
    resolverAtual = null;
  }
}

function escreverTexto(elemento, texto, velocidade = 75) {
  return new Promise((resolve) => {
    let i = 0;
    elemento.textContent = "";
    resolverAtual = resolve;

    function escreverProximoCaractere() {
      if (dialogoCancelado) {
        resolverAtual = null;
        resolve();
        return;
      }

      elemento.textContent += texto.charAt(i);
      i++;

      if (i >= texto.length) {
        timerAtual = null;
        resolverAtual = null;
        resolve();
        return;
      }

      timerAtual = setTimeout(escreverProximoCaractere, velocidade);
    }

    escreverProximoCaractere();
  });
}

function esperar(ms) {
  return new Promise((resolve) => {
    resolverAtual = resolve;
    timerAtual = setTimeout(() => {
      timerAtual = null;
      resolverAtual = null;
      resolve();
    }, ms);
  });
}

async function iniciarDialogo() {
  const falas = document.querySelectorAll(".fala");
  const botao = document.getElementById("btnEntrarReino");
  const botaoPular = document.getElementById("btnPularDialogos");

  if (!falas.length || !botao) return;

  botao.disabled = true;
  botao.classList.add("disabled");

  for (const fala of falas) {
    if (dialogoCancelado) return;

    const texto = fala.dataset.texto || "";
    await escreverTexto(fala, texto, 22);

    if (dialogoCancelado) return;
    await esperar(600);
  }

  if (dialogoCancelado) return;

  botao.disabled = false;
  botao.classList.remove("disabled");

  if (botaoPular) {
    botaoPular.hidden = true;
  }
}

function entrarDrakoria() {
  window.progressoDrakoria?.marcarEntradaDrakoria();

  document.body.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "praca.html";
  }, 700);
}

function pularDialogos() {
  if (dialogoCancelado) return;

  dialogoCancelado = true;
  limparTimerAtual();

  const falas = document.querySelectorAll(".fala");
  for (const fala of falas) {
    fala.textContent = fala.dataset.texto || "";
  }

  entrarDrakoria();
}

window.entrarDrakoria = entrarDrakoria;
window.pularDialogos = pularDialogos;

window.addEventListener("DOMContentLoaded", () => {
  window.progressoDrakoria?.marcarGoblinInicialDerrotado();

  const botao = document.getElementById("btnEntrarReino");
  const botaoPular = document.getElementById("btnPularDialogos");

  botao?.addEventListener("click", entrarDrakoria);
  botaoPular?.addEventListener("click", pularDialogos);

  iniciarDialogo();
});
