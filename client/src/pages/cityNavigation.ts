// Keep city destinations available while a character sheet or shop is open.
declare global {
  interface Window { abrirLivrosClasse: () => void; }
}

window.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector<HTMLElement>(".city-sidebar");
  if (sidebar) {
    const drawer = document.createElement("div");
    drawer.className = "city-menu-drawer";
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "city-menu-handle";
    handle.setAttribute("aria-controls", sidebar.id);
    const setOpen = (open: boolean): void => {
      drawer.classList.toggle("is-open", open);
      sidebar.inert = !open;
      handle.setAttribute("aria-expanded", String(open));
      handle.setAttribute("aria-label", open ? "Recolher menu da cidade" : "Abrir menu da cidade");
      handle.textContent = open ? "‹" : "›";
    };
    sidebar.before(drawer);
    drawer.append(sidebar, handle);
    setOpen(false);
    drawer.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse") setOpen(true);
    });
    drawer.addEventListener("pointerleave", event => {
      if (event.pointerType === "mouse") setOpen(false);
    });
    handle.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
    drawer.addEventListener("focusout", event => {
      if (!drawer.contains(event.relatedTarget as Node | null)) setOpen(false);
    });
    drawer.addEventListener("keydown", event => {
      if (event.key === "Escape") { setOpen(false); handle.focus(); }
    });
    sidebar.addEventListener("click", event => {
      if ((event.target as Element).closest("a")) { setOpen(false); handle.focus(); }
    });
    document.addEventListener("pointerdown", event => {
      if (!drawer.contains(event.target as Node)) setOpen(false);
    });
  }

  document.querySelectorAll<HTMLElement>("[data-city-href]").forEach(hotspot => {
    const navigate = (): void => {
      const href = hotspot.dataset.cityHref;
      if (href) window.location.href = href;
    };
    hotspot.addEventListener("click", navigate);
    hotspot.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigate();
    });
  });

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
