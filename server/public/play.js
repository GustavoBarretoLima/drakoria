import { createBattleVisuals, equipmentIcon } from '/play-visuals.js';
const el = id => document.getElementById(id);
let snapshot, busy = false, pendingStart, pendingQuest, pendingSpecialization, pendingTavern, guildRegion = 'cemiterio-esquecido';
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
  el('hero-info').textContent = `${snapshot.specialization?.active?.name || c.heroClass} · Nível ${c.level}`;
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
  renderGuild(fighting);
  renderTavern(fighting);
  renderSpecialization(fighting);
  el('refresh').disabled = busy;
  el('battle-panel').hidden = !b;
  if (b) {
    const state = b.state;
    visuals.render(snapshot);
    el('enemy-name').textContent = state.enemy.name;
    el('enemy-hp').textContent = `HP inimigo: ${state.enemy.stats.hp} / ${state.enemy.stats.maxHp}`;
    el('battle-status').textContent = fighting ? 'Sua vez. Escolha uma ação.' : state.winnerId === state.hero.id ? 'Vitória! Progresso salvo.' : 'Derrota. Você voltou com parte do HP. Prepare-se na Taberna para tentar novamente.';
    el('command-heading').hidden = !fighting;
    el('battle-actions').replaceChildren();
    if (fighting) {
      const act = action => async () => {
        const previous = snapshot;
        snapshot = await api('/game/action', { battleId: b.id, revision: b.revision, action });
        render(); el('message').textContent = 'Turno salvo. Mostrando o combate…';
        await visuals.animate(previous, snapshot, action);
      };
      el('battle-actions').append(button('Atacar', act({ type: 'ATTACK' }), busy), button('Defender', act({ type: 'DEFEND' }), busy));
      if (state.hero.subclassId !== 'berserker') el('battle-actions').append(button('Magia · 10 mana', act({ type: 'CAST_MAGIC' }), busy || state.hero.stats.mana < 10));
      for (const skill of b.skills) {
        const node = button(`${skill.name} · ${state.hero.subclassId === 'berserker' ? `${skill.furyCost || 0} fúria` : `${skill.manaCost} mana`}`, act({ type: 'USE_SKILL', skillId: skill.id }), busy || !!skill.blocked);
        node.title = skill.blocked || skill.name; el('battle-actions').append(node);
      }
    }
    const rewards = state.rewards;
    el('rewards').textContent = rewards ? `Recebido: ${rewards.xp} XP e ${rewards.gold} ouro.${rewards.drops?.length ? ' Itens: ' + rewards.drops.map(drop => `${drop.quantity}× ${drop.item.name}`).join(', ') : ''}${rewards.classBooks?.length ? ' Livros: ' + rewards.classBooks.map(book => book.name).join(', ') : ''}` : '';
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
function renderTavern(fighting) {
  const tavern = snapshot.tavern;
  if (!tavern) return;
  const c = snapshot.character, locked = busy || fighting;
  el('tavern-resources').textContent = `HP ${c.stats.hp}/${c.stats.maxHp} · Mana ${c.stats.mana}/${c.stats.maxMana} · ${c.gold} ouro`;
  el('tavern-rest-detail').textContent = `Descanso: ${tavern.restCost} ouro para recuperar todo o HP e a mana.${tavern.restBlocked ? ` ${tavern.restBlocked}` : ''}`;
  el('rest').textContent = `Descansar · ${tavern.restCost} ouro`; el('rest').disabled = locked || !!tavern.restBlocked;
  el('tavern-potions').replaceChildren(...tavern.potions.map(potion => {
    const card = document.createElement('article'), icon = document.createElement('img'), title = document.createElement('h3'), effect = document.createElement('p'), stock = document.createElement('p'), actions = document.createElement('div');
    icon.src = potion.icon; icon.alt = ''; icon.width = 64; icon.height = 64; icon.loading = 'lazy';
    title.textContent = potion.name; effect.textContent = potion.detail; stock.textContent = `${potion.price} ouro · Na mochila: ${potion.quantity}`; actions.className = 'actions';
    const buy = button(`Comprar ${potion.name} · ${potion.price} ouro`, () => tavernCommand({ operation: 'buy', potionId: potion.id, quantity: 1 }), locked || !!potion.buyBlocked);
    const use = button(`Usar ${potion.name}`, () => tavernCommand({ operation: 'use', potionId: potion.id }), locked || !!potion.useBlocked);
    buy.title = fighting ? 'Conclua a batalha antes de usar a Taberna.' : potion.buyBlocked || 'Comprar uma unidade'; use.title = fighting ? 'Conclua a batalha antes de usar a Taberna.' : potion.useBlocked || potion.detail;
    actions.append(buy, use); card.append(icon, title, effect, stock, actions); return card;
  }));
}
async function tavernCommand(command) {
  const fingerprint = JSON.stringify(command);
  if (!pendingTavern || pendingTavern.fingerprint !== fingerprint) pendingTavern = { fingerprint, body: { ...command, requestId: crypto.randomUUID(), version: snapshot.character.version } };
  const { operation, ...body } = pendingTavern.body;
  try { snapshot = await api(operation === 'rest' ? '/game/rest' : `/game/tavern/${operation}`, body); pendingTavern = undefined; }
  catch (error) { if (error.status === 400 || error.status === 409) pendingTavern = undefined; throw error; }
}
function renderSpecialization(fighting) {
  const profile = snapshot.specialization;
  if (!profile) return;
  const locked = busy || fighting;
  el('specialization-active').textContent = profile.active ? `Subclasse permanente: ${profile.active.name}` : 'Sua subclasse ainda não foi escolhida.';
  el('specialization-passive').textContent = profile.active?.passiveSummary || 'Consulte as opções da sua classe antes de usar um livro.';
  el('specialization-books').replaceChildren();
  if (!profile.books.length) { const li = document.createElement('li'); li.textContent = 'Nenhum livro disponível.'; el('specialization-books').append(li); }
  for (const book of profile.books) {
    const li = document.createElement('li'), text = document.createElement('span'); text.textContent = `${book.name}${book.blocked ? ` · ${book.blocked}` : ''}`;
    li.append(text, button('Usar livro', async () => {
      if (!confirm(`Usar ${book.name}? O livro será consumido e esta escolha de subclasse é permanente.`)) return;
      await specializationCommand({ operation: 'use-book', bookId: book.instanceId });
    }, locked || !!book.blocked)); el('specialization-books').append(li);
  }
  el('specialization-options').replaceChildren(...profile.subclasses.map(subclass => {
    const card = document.createElement('article'), name = document.createElement('h3'), passive = document.createElement('p'), book = document.createElement('p');
    name.textContent = subclass.name; passive.textContent = subclass.passiveSummary; book.textContent = `Livro: ${subclass.bookName}`;
    card.append(name, passive, book); return card;
  }));
  el('specialization-tree').hidden = !profile.active;
  el('talent-points').textContent = `${profile.points} pontos disponíveis · 1 ponto por nível após o primeiro`;
  el('reset-talents').disabled = locked || !profile.nodes.some(node => node.rank > 0);
  el('talent-nodes').replaceChildren(...profile.nodes.map(node => {
    const card = document.createElement('article'), heading = document.createElement('h3'), description = document.createElement('p'), rank = document.createElement('p');
    heading.textContent = node.name; description.textContent = node.description;
    rank.textContent = `Nv.${node.level} · Rank ${node.rank}/${node.maxRank}${node.blocked ? ` · ${node.blocked}` : ''}`;
    card.append(heading, description, rank, button(`Investir em ${node.name}`, () => specializationCommand({ operation: 'invest', nodeId: node.id }), locked || !!node.blocked)); return card;
  }));
  el('skill-slots').hidden = profile.active?.id !== 'berserker';
  el('skill-slot-controls').replaceChildren();
  if (profile.active?.id === 'berserker') for (let slot = 0; slot < 4; slot++) {
    const label = document.createElement('label'), select = document.createElement('select'); label.textContent = `Espaço ${slot + 1}`;
    select.id = `skill-slot-${slot}`; select.setAttribute('aria-label', `Habilidade do espaço ${slot + 1}`);
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Vazio'; select.append(empty);
    for (const skill of profile.slotChoices) { const option = document.createElement('option'); option.value = skill.id; option.textContent = skill.name; option.disabled = profile.loadout.some((id, index) => id === skill.id && index !== slot); select.append(option); }
    select.value = profile.loadout[slot] || ''; select.disabled = locked;
    select.addEventListener('change', () => void run(() => specializationCommand({ operation: 'skill-slot', slot, skillId: select.value })));
    label.append(select); el('skill-slot-controls').append(label);
  }
}
async function specializationCommand(command) {
  const fingerprint = JSON.stringify(command);
  if (!pendingSpecialization || pendingSpecialization.fingerprint !== fingerprint) pendingSpecialization = { fingerprint, body: { ...command, requestId: crypto.randomUUID(), version: snapshot.character.version } };
  const { operation, ...body } = pendingSpecialization.body;
  try { snapshot = await api(`/game/specialization/${operation}`, body); pendingSpecialization = undefined; }
  catch (error) { if (error.status === 400 || error.status === 409) pendingSpecialization = undefined; throw error; }
}
function renderGuild(fighting) {
  const guild = snapshot.guild;
  if (!guild) return;
  const standing = guild.standing;
  el('guild-standing').textContent = `Rank ${standing.rank} · ${standing.reputation} de reputação`;
  el('guild-promotion').textContent = standing.next ? `Próximo rank: ${standing.next.name} · ${standing.next.reputation} de reputação e entrega de ${standing.promotion.name}.` : 'Todas as promoções da campanha foram concluídas.';
  const receipt = guild.lastDelivery;
  el('guild-receipt').textContent = receipt ? `Última entrega: ${receipt.name} · ${receipt.xp} XP, ${receipt.gold} ouro e +${receipt.reputation} reputação${receipt.equipment ? ` · ${receipt.equipment}` : ''}.` : '';
  const active = guild.quests.filter(quest => quest.entry?.status === 'active');
  for (const id of ['quest-tracker', 'battle-quests']) {
    el(id).replaceChildren(...active.map(quest => { const li = document.createElement('li'); li.textContent = `${quest.name}: ${quest.entry.count}/${quest.target}${quest.ready ? ' · Pronta para entregar na Guilda' : ''}`; return li; }));
  }
  if (!active.length) { const li = document.createElement('li'); li.textContent = 'Nenhuma missão aceita. Consulte os contratos abaixo.'; el('quest-tracker').append(li); }
  el('guild-region').replaceChildren(...snapshot.regions.map(region => { const option = document.createElement('option'); option.value = region.id; option.textContent = region.label; return option; }));
  el('guild-region').value = guildRegion;
  el('guild-quests').replaceChildren();
  for (const quest of guild.quests.filter(quest => quest.region === guildRegion)) {
    const card = document.createElement('article'), heading = document.createElement('h3'), requirements = document.createElement('p'), description = document.createElement('p'), progress = document.createElement('p'), reward = document.createElement('p');
    heading.textContent = quest.name;
    requirements.textContent = `Rank ${quest.requiredRank} · Nível ${quest.level} · ${quest.repeatable ? 'Repetível' : 'Promoção única'}`;
    description.textContent = quest.description; description.className = 'muted';
    progress.textContent = quest.entry ? `${quest.entry.status === 'active' ? `${quest.entry.count}/${quest.target}` : 'Entregue'} · Entregas: ${quest.entry.claims}` : 'Ainda não aceita';
    reward.textContent = `${quest.xp} XP · ${quest.gold} ouro · +${quest.reputation} reputação${quest.gear ? ` · Arma épica da sua classe Nv.${quest.gear}` : ''}`;
    const operation = quest.ready ? 'claim' : 'accept';
    const label = quest.ready ? `Entregar ${quest.name}` : quest.entry?.status === 'active' ? 'Missão em andamento' : quest.blocked || `${quest.entry?.claims ? 'Aceitar novamente' : 'Aceitar'}: ${quest.name}`;
    const command = button(label, () => guildCommand(quest.id, operation), busy || fighting || (!quest.ready && !!quest.blocked));
    if (fighting) command.title = 'Conclua a batalha antes de aceitar ou entregar missões.';
    card.append(heading, requirements, description, progress, reward, command); card.classList.toggle('quest-ready', quest.ready);
    el('guild-quests').append(card);
  }
}
async function guildCommand(questId, operation) {
  if (!pendingQuest || pendingQuest.questId !== questId || pendingQuest.operation !== operation) pendingQuest = { questId, operation, requestId: crypto.randomUUID(), version: snapshot.character.version };
  const { operation: command, ...body } = pendingQuest;
  try { snapshot = await api(`/game/quests/${command}`, body); pendingQuest = undefined; }
  catch (error) { if (error.status === 400 || error.status === 409) pendingQuest = undefined; throw error; }
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
el('guild-region').addEventListener('change', event => { guildRegion = event.target.value; renderGuild(!!snapshot.battle && !snapshot.battle.state.finished); });
el('reset-talents').addEventListener('click', () => void run(() => specializationCommand({ operation: 'reset' })));
el('rest').addEventListener('click', () => void run(() => tavernCommand({ operation: 'rest' })));
el('refresh').addEventListener('click', () => void run(async () => { snapshot = await api('/game/state'); }));
void run(async () => { snapshot = await api('/game/state'); });
