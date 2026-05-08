// js/script.js

function entrarNoJogo() {
  // Exemplo: redirecionar para login.html
  window.location.href = "login.html";
}

// Se estiver usando type="module", precisa expor manualmente:
window.entrarNoJogo = entrarNoJogo;
