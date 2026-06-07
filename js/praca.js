// Exibir/ocultar menu quando o botão for clicado
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("abrirMenuBtn");
  const menu = document.getElementById("menuPraca");

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden"); // alterna entre mostrar/ocultar
  });
});

// Função para abrir/fechar inventário
function abrirInventario() {
  const inventarioDiv = document.getElementById("inventario");
  inventarioDiv.classList.toggle("hidden");

  // Se o inventário for aberto, renderiza os itens
  if (!inventarioDiv.classList.contains("hidden") && window.inventario) {
    window.inventario.renderInventario();
  }
}
