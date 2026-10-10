import { createBattleVisuals, equipmentIcon } from '/play-visuals.js';
const el = id => document.getElementById(id);
let snapshot, busy = false, pendingStart;
const visuals = createBattleVisuals();
async function api(path, body) {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store',
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (response.status === 401) { location.assign('/login'); throw new Error('Entre para jogar.'); }
  if (!response.ok) { const error = new Error(data.error || 'Não foi possível concluir.'); error.status = response.status; throw error; }
  return data;
}
function button(label, work, disabled = false) {
  const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.disabled = disabled;
  node.addEventListener('click', () => void run(work)); return node;
}
function render() {
  if (!snapshot) return;
  const { character: c, battle: b, inventory } = snapshot;
  const fighting = !!b && !b.state.finished;
  el('game').hidden = false;
  el('hero-name').textContent = c.name;
  el('hero-info').textContent = `${c.heroClass} · Nível ${c.level}`;
  el('hp').textContent = `HP ${c.stats.hp} / ${c.stats.maxHp}`;
  el('mana').textContent = `Mana ${c.stats.mana} / ${c.stats.maxMana}`;
  el('xp-bar').max = c.xpToNextLevel; el('xp-bar').value = c.xp;
  el('progress').textContent = `${c.xp} / ${c.xpToNextLevel} XP · ${c.gold} ouro`;
  el('start').disabled = busy || fighting || c.stats.hp <= 0;
  el('rest').disabled = busy || fighting;
  el('refresh').disabled = busy;
  el('battle-panel').hidden = !b;
  if (b) {
    const state = b.state;
    visuals.render(snapshot);
    el('enemy-name').textContent = state.enemy.name;
    el('enemy-hp').textContent = `HP inimigo: ${state.enemy.stats.hp} / ${state.enemy.stats.maxHp}`;
    el('battle-status').textContent = fighting ? 'Sua vez. Escolha uma ação.' : state.winnerId === state.hero.id ? 'Vitória! Progresso salvo.' : 'Derrota. Descanse no acampamento para voltar.';
    el('command-heading').hidden = !fighting;
    el('battle-actions').replaceChildren();
    if (fighting) {
      const act = action => async () => {
        const previous = snapshot;
        snapshot = await api('/game/action', { battleId: b.id, revision: b.revision, action });
        render(); el('message').textContent = 'Turno salvo. Mostrando o combate…';
        await visuals.animate(previous, snapshot, action);
      };
      el('battle-actions').append(button('Atacar', act({ type: 'ATTACK' }), busy), button('Defender', act({ type: 'DEFEND' }), busy),
        button('Magia · 10 mana', act({ type: 'CAST_MAGIC' }), busy || state.hero.stats.mana < 10));
      for (const skill of b.skills) {
        const node = button(`${skill.name} · ${skill.manaCost} mana`, act({ type: 'USE_SKILL', skillId: skill.id }), busy || !!skill.blocked);
        node.title = skill.blocked || skill.name; el('battle-actions').append(node);
      }
    }
    const rewards = state.rewards;
    el('rewards').textContent = rewards ? `Recebido: ${rewards.xp} XP e ${rewards.gold} ouro.${rewards.drops?.length ? ' Itens: ' + rewards.drops.map(drop => `${drop.quantity}× ${drop.item.name}`).join(', ') : ''}` : '';
    el('battle-log').replaceChildren(...b.messages.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    el('battle-log').scrollTop = el('battle-log').scrollHeight;
  }
  el('inventory').replaceChildren();
  if (!inventory.length) { const li = document.createElement('li'); li.textContent = 'Nenhum equipamento ainda. Goblins podem deixar itens após a vitória.'; el('inventory').append(li); }
  for (const entry of inventory) {
    const li = document.createElement('li'), text = document.createElement('div'), details = document.createElement('small');
    text.textContent = entry.definition.name;
    details.textContent = `Nível ${entry.definition.level} · ${entry.definition.rarity} · ${entry.equipped ? 'Equipado' : entry.canEquip ? 'Disponível' : 'Classe ou nível incompatível'}`;
    text.append(details);
    const info = document.createElement('div'); info.className = 'item-info';
    const icon = equipmentIcon(entry.definition.icon);
    if (icon) { const img = document.createElement('img'); img.src = icon; img.alt = ''; img.loading = 'lazy'; img.width = 52; img.height = 52; img.className = `rarity-${entry.definition.rarity}`; img.addEventListener('error', () => { img.hidden = true; }); info.append(img); }
    info.append(text); li.append(info, button('Equipar', async () => { snapshot = await api('/game/equip', { version: c.version, instanceId: entry.instanceId }); }, busy || fighting || entry.equipped || !entry.canEquip));
    el('inventory').append(li);
  }
}
async function run(work) {
  if (busy) return;
  busy = true; render(); el('message').textContent = 'Salvando…';
  try { await work(); el('message').textContent = 'Progresso sincronizado.'; }
  catch (error) {
    // Recover authoritative state after conflict or an interrupted response.
    try { snapshot = await api('/game/state'); } catch { /* Preserve the original error. */ }
    el('message').textContent = error.message;
  } finally { busy = false; render(); }
}
el('start').addEventListener('click', () => void run(async () => {
  pendingStart ??= crypto.randomUUID();
  snapshot = await api('/game/start', { requestId: pendingStart }); pendingStart = undefined;
}));
el('rest').addEventListener('click', () => void run(async () => { snapshot = await api('/game/rest', { version: snapshot.character.version }); }));
el('refresh').addEventListener('click', () => void run(async () => { snapshot = await api('/game/state'); }));
void run(async () => { snapshot = await api('/game/state'); });
