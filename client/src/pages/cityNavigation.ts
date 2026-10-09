// Keep city destinations available while a character sheet or shop is open.
declare global {
  interface Window { abrirLivrosClasse: () => void; }
}

window.addEventListener("DOMContentLoaded", () => {
  const inSquare = Boolean(document.getElementById("painelPraca"));
  const open = (name: string): void => {
    if (name === "status") window.abrirStatus?.();
    else if (name === "livros") window.abrirLivrosClasse();
    else if (name === "loja") window.abrirLoja();
    else if (name === "guilda") window.abrirMissoes();
  };
  if (inSquare) {
    document.querySelectorAll<HTMLAnchorElement>("[data-city-panel]").forEach(link => {
      link.addEventListener("click", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        open(link.dataset.cityPanel!);
      });
    });
    const params = new URLSearchParams(window.location.search);
    if (params.has("status")) open("status");
    else if (params.has("livros")) open("livros");
  }
});
