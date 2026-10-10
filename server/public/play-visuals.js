export function equipmentIcon(icon) {
  const match = typeof icon === 'string' && /^\/img\/itens\/loot_monstros\/icones_128\/([a-zA-Z0-9_-]+\.png)$/.exec(icon);
  return match ? `/game-assets/items/${match[1]}` : null;
}
export function isNewTurn(previous, next) {
  return !!previous?.battle && !!next?.battle && previous.battle.id === next.battle.id
    && next.battle.revision === previous.battle.revision + 1;
}
export function createBattleVisuals() {
  const el = id => document.getElementById(id);
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let state, presentation, heroClass = 'guerreiro';
  const preloaded = new Set();
  const toggle = el('reduce-motion');
  toggle.checked = preference.matches;
  function reduced() { return toggle.checked; }
  function sprite(side, pose = 'idle') {
    if (!state) return;
    const dead = !state[side].isAlive;
    const prefix = heroClass;
    const source = side === 'enemy' && presentation ? presentation[reduced() ? dead ? 'staticDeath' : 'static' : dead ? 'death' : pose] : reduced()
      ? `/game-assets/${prefix}-${dead ? 'death' : 'static'}.png`
      : side === 'enemy' && dead ? '/game-assets/goblin-death.png'
      : `/game-assets/${prefix}-${dead ? 'death' : pose}.gif`;
    const img = el(`${side}-sprite`);
    if (img.getAttribute('src') !== source) img.src = source;
  }
  function reset() {
    for (const side of ['hero', 'enemy']) {
      el(`${side}-fighter`).classList.remove('is-acting', 'is-hit', 'is-defending');
      const impact = el(`${side}-impact`); impact.textContent = ''; impact.classList.remove('pop');
      sprite(side);
    }
  }
  function render(snapshot) {
    if (!snapshot.battle) return;
    state = snapshot.battle.state; presentation = snapshot.battle.presentation;
    el('enemy-fighter').dataset.sprite = presentation?.idle?.match(/\/monsters\/([a-z_]+)\//)?.[1] || '';
    heroClass = snapshot.character.heroClass;
    el('battle-scene').dataset.region = snapshot.battle.regionId || '';
    const region = snapshot.regions?.find(region => region.id === snapshot.battle.regionId);
    el('arena-region').textContent = region?.label || 'Encontro online';
    el('battle-scene').setAttribute('aria-label', `Arena de combate: ${region?.label || 'encontro online'}`);
    el('battle-scene').classList.toggle('motion-reduced', reduced());
    if (!reduced() && !preloaded.has(heroClass)) {
      preloaded.add(heroClass);
      for (const name of [`${heroClass}-attack`, `${heroClass}-damage`, `${heroClass}-death`]) { const img = new Image(); img.src = `/game-assets/${name}.gif`; }
    }
    el('arena-hero-name').textContent = state.hero.name;
    el('arena-enemy-name').textContent = state.enemy.name;
    el('arena-hero-health').textContent = `HP ${state.hero.stats.hp} / ${state.hero.stats.maxHp} · Mana ${state.hero.stats.mana}`;
    for (const side of ['hero', 'enemy']) {
      const bar = el(`${side}-health-bar`); bar.max = state[side].stats.maxHp; bar.value = state[side].stats.hp;
      el(`${side}-fighter`).classList.toggle('is-dead', !state[side].isAlive);
    }
    el('battle-outcome').hidden = !state.finished;
    el('battle-outcome').textContent = state.winnerId === state.hero.id ? 'Vitória' : 'Derrota';
    reset();
  }
  function hit(side, damage) {
    if (damage <= 0) return;
    el(`${side}-fighter`).classList.add('is-hit');
    const impact = el(`${side}-impact`); impact.textContent = `−${damage}`; impact.classList.add('pop');
    sprite(side, 'damage');
  }
  async function animate(previous, next, action) {
    if (reduced() || !isNewTurn(previous, next)) return;
    const old = previous.battle.state, current = next.battle.state;
    const heroDamage = Math.max(0, old.hero.stats.hp - current.hero.stats.hp);
    const enemyDamage = Math.max(0, old.enemy.stats.hp - current.enemy.stats.hp);
    try {
      if (action.type === 'DEFEND') el('hero-fighter').classList.add('is-defending');
      else { el('hero-fighter').classList.add('is-acting'); sprite('hero', 'attack'); }
      hit('enemy', enemyDamage);
      await new Promise(resolve => setTimeout(resolve, 450));
      reset();
      if (heroDamage > 0) {
        el('enemy-fighter').classList.add('is-acting'); sprite('enemy', 'attack'); hit('hero', heroDamage);
        await new Promise(resolve => setTimeout(resolve, 450));
      }
    } finally { reset(); }
  }
  toggle.addEventListener('change', () => { el('battle-scene').classList.toggle('motion-reduced', reduced()); reset(); });
  preference.addEventListener('change', event => { toggle.checked = event.matches; el('battle-scene').classList.toggle('motion-reduced', reduced()); reset(); });
  for (const side of ['hero', 'enemy']) {
    const img = el(`${side}-sprite`);
    img.addEventListener('error', () => { img.hidden = true; });
    img.addEventListener('load', () => { img.hidden = false; });
  }
  return { render, animate };
}
