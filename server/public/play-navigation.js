const titles = { praca:'Praça de Drakoria', status:'Status', inventario:'Inventário', livros:'Livros de classe e talentos', mapa:'Arredores de Drakoria', taberna:'Taberna de Drakoria', guilda:'Guilda dos Aventureiros', batalha:'Batalha' };
export function createNavigation() {
  const el = id => document.getElementById(id), drawer = el('city-drawer'), sidebar = el('city-sidebar'), handle = el('city-menu-handle');
  let snapshot, view, loaded = false;
  function setOpen(open) {
    drawer.classList.toggle('is-open', open); sidebar.inert = !open;
    handle.setAttribute('aria-expanded', String(open)); handle.setAttribute('aria-label', open ? 'Recolher menu da cidade' : 'Abrir menu da cidade'); handle.textContent = open ? '‹' : '›';
  }
  function apply(focus = false) {
    if (!snapshot) return;
    if (view === 'batalha' && !snapshot.battle) view = 'mapa';
    document.body.dataset.view = view;
    for (const panel of document.querySelectorAll('[data-online-view]')) panel.hidden = !panel.dataset.onlineView.split(' ').includes(view);
    el('praca').hidden = !['praca', 'status', 'inventario', 'livros'].includes(view);
    el('view-title').textContent = titles[view];
    el('sheet-title').textContent = view === 'inventario' ? 'Inventário e equipamentos' : 'Status';
    el('battle-nav').hidden = !snapshot.battle;
    for (const link of sidebar.querySelectorAll('a')) {
      if (link.hash === `#${view}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    }
    if (focus) {
      const heading = view === 'status' || view === 'inventario' ? el('sheet-title') : view === 'livros' ? el('specialization-heading') : view === 'batalha' ? el('enemy-name') : el('view-title');
      heading.tabIndex = -1; heading.focus({ preventScroll:true }); window.scrollTo({ top:0, behavior:'instant' });
    }
  }
  function show(name) { if (!Object.hasOwn(titles,name)) return; if (location.hash === `#${name}`) { view=name; apply(true); } else location.hash=name; }
  window.addEventListener('hashchange', () => { const name=location.hash.slice(1); view=Object.hasOwn(titles,name)?name:'praca'; setOpen(false); apply(true); });
  handle.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
  drawer.addEventListener('keydown', event => { if (event.key === 'Escape') { setOpen(false); handle.focus(); } });
  drawer.addEventListener('focusout', event => { if (!drawer.contains(event.relatedTarget)) setOpen(false); });
  document.addEventListener('pointerdown', event => { if (!drawer.contains(event.target)) setOpen(false); });
  setOpen(false);
  return { show, render(next) {
    snapshot=next;
    if (!loaded) { const name=location.hash.slice(1); view=Object.hasOwn(titles,name)?name:next.battle&&!next.battle.state.finished?'batalha':'praca'; loaded=true; }
    apply();
  } };
}
