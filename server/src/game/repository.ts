import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { inTransaction } from '../database/pool.js';
import { AuthError } from '../auth/security.js';
import { createInitialBattleState } from '../modules/combat/battleRoom.js';
import { applyProgressRewards, normalizeProgress } from '../../../shared/src/progression/playerProgress.js';
import { canEquipItem } from '../../../shared/src/equipment/equipmentRules.js';
import { getHeroSkills, getSkillBlockReason } from '../../../shared/src/combat/classSkills.js';
import type { HeroClass, BattleState } from '../../../shared/src/types/combat.js';
import type { BattleAction } from '../../../shared/src/combat/actions.js';
import { characterStats, itemDefinition, playTurn, readyForHero } from './rules.js';

interface Character {
  id: string; name: string; hero_class: HeroClass; level: number; xp: string; gold: string; version: string;
  current_hp: number | null; current_mana: number | null;
}
interface Item { id: string; definition_id: string; equipped_slot: string | null; }
interface Battle { id: string; state: BattleState; messages: string[]; revision: number; finished: boolean; settled: boolean; }

export class GameRepository {
  constructor(private readonly pool: Pool) {}
  private async character(client: PoolClient, accountId: string): Promise<Character> {
    const active = await client.query("SELECT id FROM accounts WHERE id = $1 AND status = 'active' FOR SHARE", [accountId]);
    if (!active.rowCount) throw new AuthError(401, 'Entre novamente.');
    const result = await client.query<Character>('SELECT * FROM characters WHERE account_id = $1 FOR UPDATE', [accountId]);
    if (!result.rows[0]) throw new AuthError(409, 'Crie seu personagem no portal de contas.');
    return result.rows[0];
  }
  private async items(client: PoolClient, character: Character) {
    const result = await client.query<Item>('SELECT id, definition_id, equipped_slot FROM equipment_instances WHERE owner_character_id = $1 ORDER BY created_at, id', [character.id]);
    return result.rows.map(row => ({ ...row, item: itemDefinition(row.definition_id),
      canEquip: canEquipItem(itemDefinition(row.definition_id), character.hero_class, character.level) }));
  }
  private async latest(client: PoolClient, characterId: string): Promise<Battle | null> {
    const result = await client.query<Battle>('SELECT * FROM online_battles WHERE character_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1', [characterId]);
    return result.rows[0] ?? null;
  }
  private async snapshot(client: PoolClient, character: Character, battle?: Battle | null) {
    const inventory = await this.items(client, character);
    const stats = characterStats(character.hero_class, character.level, inventory.filter(item => item.equipped_slot).map(item => item.item));
    stats.hp = Math.min(stats.maxHp, character.current_hp ?? stats.maxHp);
    stats.mana = Math.min(stats.maxMana, character.current_mana ?? stats.maxMana);
    const current = battle === undefined ? await this.latest(client, character.id) : battle;
    const progress = normalizeProgress({ nivel: character.level, xp: character.xp, ouro: character.gold });
    return { character: { id: character.id, name: character.name, heroClass: character.hero_class, level: character.level,
      xp: Number(character.xp), gold: Number(character.gold), version: character.version, xpToNextLevel: progress.xpParaProximoNivel, stats },
      inventory: inventory.map(entry => ({ instanceId: entry.id, equipped: !!entry.equipped_slot, canEquip: entry.canEquip, definition: entry.item })),
      battle: current ? { id: current.id, revision: current.revision, messages: current.messages,
        state: { ...current.state, rewards: current.settled && current.state.winnerId === current.state.hero.id ? current.state.rewards : undefined },
        skills: getHeroSkills(current.state.hero).filter(skill => (current.state.hero.level ?? 1) >= skill.unlockLevel)
          .map(skill => ({ id: skill.id, name: skill.name, manaCost: skill.manaCost, blocked: getSkillBlockReason(current.state.hero, skill) })) } : null };
  }
  async load(accountId: string) {
    return inTransaction(this.pool, async client => this.snapshot(client, await this.character(client, accountId)));
  }
  private async saveBattle(client: PoolClient, character: Character, battle: Battle) {
    const state = battle.state;
    if (state.finished && !battle.settled) {
      if (state.winnerId === state.hero.id) {
        const rewards = state.rewards!;
        const progress = applyProgressRewards({ nivel: character.level, xp: character.xp, ouro: character.gold }, rewards.gold, rewards.xp);
        character.level = progress.nivel; character.xp = String(progress.xp); character.gold = String(progress.ouro);
        let index = 0;
        for (const drop of rewards.drops ?? []) {
          itemDefinition(drop.item.id);
          for (let copy = 0; copy < drop.quantity; copy++) {
            const operation = `battle:${battle.id}:drop:${index++}`;
            const item = await client.query<{ id: string }>(`INSERT INTO equipment_instances
              (owner_character_id, origin_character_id, definition_id, source_operation_key) VALUES ($1, $1, $2, $3) RETURNING id`,
              [character.id, drop.item.id, operation]);
            await client.query(`INSERT INTO equipment_events (equipment_instance_id, character_id, event_type, operation_key)
              VALUES ($1, $2, 'grant', $3)`, [item.rows[0]!.id, character.id, operation]);
          }
        }
      }
      battle.settled = true;
    }
    character.current_hp = state.hero.stats.hp; character.current_mana = state.hero.stats.mana;
    const saved = await client.query<Character>(`UPDATE characters SET level = $2, xp = $3, gold = $4, current_hp = $5, current_mana = $6,
      version = version + 1 WHERE id = $1 RETURNING *`, [character.id, character.level, character.xp, character.gold, character.current_hp, character.current_mana]);
    battle.finished = state.finished; battle.messages = battle.messages.slice(-30);
    await client.query(`UPDATE online_battles SET state = $2, messages = $3, revision = $4, finished = $5, settled = $6, updated_at = now() WHERE id = $1`,
      [battle.id, JSON.stringify(state), JSON.stringify(battle.messages), battle.revision, battle.finished, battle.settled]);
    return this.snapshot(client, saved.rows[0]!, battle);
  }
  async start(accountId: string, requestId: string) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      const previous = await client.query<Battle>('SELECT * FROM online_battles WHERE character_id = $1 AND start_request_id = $2', [character.id, requestId]);
      if (previous.rows[0]) return this.snapshot(client, character, previous.rows[0]);
      const current = await this.latest(client, character.id);
      if (current && !current.finished) return this.snapshot(client, character, current);
      const items = await this.items(client, character);
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item));
      if ((character.current_hp ?? stats.maxHp) <= 0) throw new AuthError(409, 'Descanse antes de iniciar outra batalha.');
      // First online region: only normal goblins, up to level 10. No client-selected boss or level.
      const state = createInitialBattleState(character.hero_class, `goblin-normal-lvl-${Math.min(character.level, 10)}`,
        items.filter(item => item.equipped_slot).map(item => item.item), character.level,
        { hp: character.current_hp ?? stats.maxHp, mana: character.current_mana ?? stats.maxMana }, undefined, character.name);
      state.id = randomUUID(); state.hero.id = character.id;
      // Subclass books/unlocks are deferred until their server inventory exists.
      state.rewards!.classBooks = [];
      const battle: Battle = { id: state.id, state, messages: ['O encontro começou.'], revision: 0, finished: false, settled: false };
      battle.state = readyForHero(state, battle.messages);
      await client.query('INSERT INTO online_battles (id, character_id, start_request_id, state) VALUES ($1, $2, $3, $4)', [battle.id, character.id, requestId, JSON.stringify(battle.state)]);
      return this.saveBattle(client, character, battle);
    });
  }
  async action(accountId: string, battleId: string, revision: number, action: BattleAction) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      const result = await client.query<Battle>('SELECT * FROM online_battles WHERE id = $1 AND character_id = $2', [battleId, character.id]);
      const battle = result.rows[0];
      if (!battle || battle.finished || battle.revision !== revision) throw new AuthError(409, 'A batalha mudou. Atualize para continuar.');
      battle.state = playTurn(battle.state, action, battle.messages); battle.revision++;
      return this.saveBattle(client, character, battle);
    });
  }
  async camp(accountId: string, version: string, instanceId?: string) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      if (character.version !== version) throw new AuthError(409, 'O personagem mudou. Atualize para continuar.');
      const battle = await this.latest(client, character.id);
      if (battle && !battle.finished) throw new AuthError(409, 'Conclua a batalha antes de descansar ou trocar equipamentos.');
      if (instanceId) {
        const items = await this.items(client, character);
        const selected = items.find(item => item.id === instanceId);
        if (!selected || !selected.canEquip) throw new AuthError(400, 'Você não pode equipar este item.');
        await client.query('UPDATE equipment_instances SET equipped_slot = NULL WHERE owner_character_id = $1 AND equipped_slot = $2', [character.id, selected.item.slot]);
        await client.query('UPDATE equipment_instances SET equipped_slot = $2 WHERE id = $1 AND owner_character_id = $3', [instanceId, selected.item.slot, character.id]);
      }
      const items = await this.items(client, character);
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item));
      const saved = await client.query<Character>(`UPDATE characters SET current_hp = $2, current_mana = $3, version = version + 1 WHERE id = $1 RETURNING *`,
        [character.id, instanceId ? Math.min(stats.maxHp, character.current_hp ?? stats.maxHp) : stats.maxHp,
          instanceId ? Math.min(stats.maxMana, character.current_mana ?? stats.maxMana) : stats.maxMana]);
      return this.snapshot(client, saved.rows[0]!);
    });
  }
}
