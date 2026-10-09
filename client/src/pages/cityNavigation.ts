// Keep city destinations available while a character sheet or shop is open.
declare global {
  interface Window { abrirLivrosClasse: () => void; }
}

window.addEventListener("DOMContentLoaded", () => {
  // Panels replace their contents when switching tabs, buying or learning a skill.
  // Recreate one sticky close bar without depending on each panel's footer.
  for (const id of ["painelPraca", "taberna", "ferreiro", "guilda"]) {
    const host = document.getElementById(id);
    if (!host) continue;
    const ensureClose = (): void => {
      const content = id === "painelPraca" ? host : host.firstElementChild;
      if (!content?.firstElementChild || content.firstElementChild.classList.contains("city-window-toolbar")) return;
      const toolbar = document.createElement("div");
      toolbar.className = "city-window-toolbar";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Fechar";
      close.addEventListener("click", () => {
        if (id === "painelPraca") window.fecharPainelPraca?.();
        else window.location.href = `${import.meta.env.BASE_URL}pages/praca.html`;
      });
      toolbar.append(close);
      content.prepend(toolbar);
    };
    new MutationObserver(ensureClose).observe(host, { childList: true });
    ensureClose();
  }
  const inSquare = Boolean(document.getElementById("painelPraca"));
  const open = (name: string): void => {
    if (name === "status") window.abrirStatus?.();
    else if (name === "livros") window.abrirLivrosClasse();
    else if (name === "loja") window.abrirLoja();
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
