function escreverTexto(elemento, texto, velocidade = 75) {
  return new Promise((resolve) => {
    let i = 0;
    elemento.textContent = "";

    const intervalo = setInterval(() => {
      elemento.textContent += texto.charAt(i);
      i++;

      if (i >= texto.length) {
        clearInterval(intervalo);
        resolve();
      }
    }, velocidade);
  });
}

async function iniciarDialogo() {
  const falas = document.querySelectorAll(".fala");
  const botao = document.getElementById("btnEntrarReino");

  if (!falas.length || !botao) return;

  botao.disabled = true;
  botao.classList.add("disabled");

  for (const fala of falas) {
    const texto = fala.dataset.texto || "";
    await escreverTexto(fala, texto, 22);
    await esperar(600);
  }

  botao.disabled = false;
  botao.classList.remove("disabled");
}

function esperar(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function entrarDrakoria() {
  window.progressoDrakoria?.marcarEntradaDrakoria();

  document.body.classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "praca.html";
  }, 700);
}

window.entrarDrakoria = entrarDrakoria;

window.addEventListener("DOMContentLoaded", () => {
  window.progressoDrakoria?.marcarGoblinInicialDerrotado();

  const botao = document.getElementById("btnEntrarReino");

  botao?.addEventListener("click", () => {
    entrarDrakoria();
  });

  iniciarDialogo();
});
