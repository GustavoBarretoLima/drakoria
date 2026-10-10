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
  const expedition = snapshot.expedition, exploring = expedition?.status === 'active';
  el('start').hidden = !exploring && !fighting; el('retreat').hidden = !exploring;
  el('start').textContent = fighting ? 'Ir para batalha' : expedition?.state.bossPending ? 'Enfrentar o chefe' : 'Próximo encontro';
  el('start').disabled = busy || (!fighting && (!exploring || c.stats.hp <= 0));
  el('retreat').disabled = busy || fighting;
  renderMap(fighting, exploring);
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
  if (!inventory.length) { const li = document.createElement('li'); li.textContent = 'Nenhum equipamento ainda. Monstros podem deixar itens após a vitória.'; el('inventory').append(li); }
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
function renderMap(fighting, exploring) {
  const { regions = [], expedition, character } = snapshot;
  el('regions').replaceChildren(); el('map-hotspots').replaceChildren();
  for (const region of regions) {
    const disabled = busy || fighting || exploring || character.stats.hp <= 0;
    const explore = () => startExpedition(region.id);
    const hotspot = button(`${region.label} · Nv.${region.minLevel}–${region.maxLevel}`, explore, disabled);
    hotspot.className = 'map-hotspot'; hotspot.dataset.region = region.id; hotspot.title = region.inhabitants;
    el('map-hotspots').append(hotspot);
    const card = document.createElement('article'), heading = document.createElement('h3'), levels = document.createElement('p'), monsters = document.createElement('p');
    heading.textContent = region.label;
    levels.textContent = `Monstros Nv.${region.minLevel}–${region.maxLevel} · ${region.bossName} Nv.${region.bossLevel}`;
    monsters.textContent = region.inhabitants; monsters.className = 'muted';
    card.append(heading, levels, monsters, button(`Explorar ${region.label}`, explore, disabled)); el('regions').append(card);
  }
  el('expedition').hidden = !expedition;
  if (expedition) {
    const region = regions.find(region => region.id === expedition.regionId);
    const statuses = { active: 'Em andamento', completed: 'Chefe derrotado', defeated: 'Encerrada por derrota', retreated: 'Retorno ao mapa' };
    el('expedition-title').textContent = `${region?.label || 'Expedição'} · ${statuses[expedition.status] || expedition.status}`;
    el('expedition-progress').textContent = `${expedition.state.victories} vitórias · Profundidade ${expedition.state.depth}${expedition.state.bossPending && exploring ? ` · Próximo encontro: ${region.bossName} Nv.${region.bossLevel}. Prepare-se no acampamento.` : ''}`;
    const rewards = expedition.state.expedition;
    el('expedition-rewards').textContent = `Recebido nesta expedição: ${rewards?.xp || 0} XP e ${rewards?.gold || 0} ouro.`;
    el('expedition-loot').replaceChildren(...(rewards?.loot || []).map(item => { const li = document.createElement('li'); li.textContent = `${item.quantity}× ${item.name}`; return li; }));
  }
}
async function startExpedition(regionId, expeditionId) {
  if (!pendingStart || pendingStart.regionId !== regionId || pendingStart.expeditionId !== expeditionId) {
    pendingStart = { requestId: crypto.randomUUID(), regionId, version: snapshot.character.version, ...(expeditionId ? { expeditionId } : {}) };
  }
  try { snapshot = await api('/game/start', pendingStart); pendingStart = undefined; render(); el('battle-panel').scrollIntoView({ block: 'start' }); }
  catch (error) { if (error.status === 400 || error.status === 409) pendingStart = undefined; throw error; }
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
el('start').addEventListener('click', () => {
  if (snapshot.battle && !snapshot.battle.state.finished) { el('battle-panel').scrollIntoView({ block: 'start' }); return; }
  void run(() => startExpedition(snapshot.expedition.regionId, snapshot.expedition.id));
});
el('retreat').addEventListener('click', () => void run(async () => { snapshot = await api('/game/retreat', { version: snapshot.character.version, expeditionId: snapshot.expedition.id }); }));
el('rest').addEventListener('click', () => void run(async () => { snapshot = await api('/game/rest', { version: snapshot.character.version }); }));
el('refresh').addEventListener('click', () => void run(async () => { snapshot = await api('/game/state'); }));
void run(async () => { snapshot = await api('/game/state'); });
