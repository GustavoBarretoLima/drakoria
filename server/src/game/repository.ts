import { defeatRecoveryHp } from '../../../shared/src/items/tavern.js';
import { tavernSnapshot, tavernCommand, type TavernCharacter, type TavernCommand } from './tavern.js';
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
import type { DungeonRunState } from '../../../shared/src/dungeons/dungeonRun.js';
import { onlineRegions, regionConfig, newExpedition, nextEncounter, settleExpedition } from './world.js';
import { specializationSnapshot, specializationCommand, grantSubclassBooks, type SpecializationCharacter, type SpecializationCommand } from './specialization.js';
import { guildSnapshot, advanceGuildVictory, questCommand } from './guild.js';
import { enemyPresentation, heroPresentation } from './assets.js';
import { characterStats, itemDefinition, playTurn, readyForHero } from './rules.js';

interface Character extends SpecializationCharacter, TavernCharacter {
  id: string; name: string; hero_class: HeroClass; level: number; xp: string; gold: string; version: string;
  current_hp: number | null; current_mana: number | null;
}
interface Item { id: string; definition_id: string; equipped_slot: string | null; }
interface Expedition { id: string; region_id: string; state: DungeonRunState; status: string; }
interface Battle { expedition_id?: string | null; id: string; state: BattleState; messages: string[]; revision: number; finished: boolean; settled: boolean; }

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
      canEquip: canEquipItem(itemDefinition(row.definition_id), character.hero_class, character.level, character.subclass_id ?? undefined) }));
  }
  private async latest(client: PoolClient, characterId: string): Promise<Battle | null> {
    const result = await client.query<Battle>('SELECT * FROM online_battles WHERE character_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1', [characterId]);
    return result.rows[0] ?? null;
  }
  private async expedition(client: PoolClient, characterId: string): Promise<Expedition | null> {
    const result = await client.query<Expedition>('SELECT * FROM online_expeditions WHERE character_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1', [characterId]);
    return result.rows[0] ?? null;
  }
  private async snapshot(client: PoolClient, character: Character, battle?: Battle | null) {
    const inventory = await this.items(client, character);
    const stats = characterStats(character.hero_class, character.level, inventory.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
    stats.hp = Math.min(stats.maxHp, character.current_hp ?? stats.maxHp);
    stats.mana = Math.min(stats.maxMana, character.current_mana ?? stats.maxMana);
    const current = battle === undefined ? await this.latest(client, character.id) : battle;
    const expedition = await this.expedition(client, character.id);
    const battleRun = current?.expedition_id ? (await client.query<Expedition>('SELECT * FROM online_expeditions WHERE id = $1 AND character_id = $2', [current.expedition_id, character.id])).rows[0] : null;
    const progress = normalizeProgress({ nivel: character.level, xp: character.xp, ouro: character.gold });
    return { tavern: tavernSnapshot(character, stats), specialization: await specializationSnapshot(client, character), guild: await guildSnapshot(client, character.id, character.level), regions: onlineRegions, expedition: expedition ? { id: expedition.id, regionId: expedition.region_id, state: expedition.state, status: expedition.status } : null, character: { presentation: heroPresentation(character.hero_class, character.subclass_id ?? undefined), id: character.id, name: character.name, heroClass: character.hero_class, subclassId: character.subclass_id, level: character.level,
      xp: Number(character.xp), gold: Number(character.gold), version: character.version, xpToNextLevel: progress.xpParaProximoNivel, stats },
      inventory: inventory.map(entry => ({ instanceId: entry.id, equipped: !!entry.equipped_slot, canEquip: entry.canEquip, definition: entry.item })),
      battle: current ? { heroPresentation: heroPresentation(current.state.hero.className ?? character.hero_class, current.state.hero.subclassId), regionId: battleRun?.region_id ?? null, presentation: enemyPresentation(current.state.enemy.id), id: current.id, revision: current.revision, messages: current.messages,
        state: { ...current.state, rewards: current.settled && current.state.winnerId === current.state.hero.id ? current.state.rewards : undefined },
        skills: getHeroSkills(current.state.hero).filter(skill => (current.state.hero.level ?? 1) >= skill.unlockLevel)
          .map(skill => ({ id: skill.id, name: skill.name, manaCost: skill.manaCost, furyCost: skill.furyCost ?? 0, blocked: getSkillBlockReason(current.state.hero, skill) })) } : null };
  }
  async load(accountId: string) {
    return inTransaction(this.pool, async client => {
      let character = await this.character(client, accountId);
      const battle = await this.latest(client, character.id);
      if (character.current_hp === 0 && (!battle || battle.finished)) {
        const items = await this.items(client, character);
        const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
        character = (await client.query<Character>('UPDATE characters SET current_hp = $2, version = version + 1 WHERE id = $1 RETURNING *', [character.id, defeatRecoveryHp(stats.maxHp)])).rows[0]!;
      }
      return this.snapshot(client, character, battle);
    });
  }
  private async saveBattle(client: PoolClient, character: Character, battle: Battle) {
    const state = battle.state;
    if (state.finished && !battle.settled) {
      if (state.winnerId === state.hero.id) {
        const rewards = state.rewards!;
        const progress = applyProgressRewards({ nivel: character.level, xp: character.xp, ouro: character.gold }, rewards.gold, rewards.xp);
        character.level = progress.nivel; character.xp = String(progress.xp); character.gold = String(progress.ouro);
        await advanceGuildVictory(client, character.id, state);
        await grantSubclassBooks(client, character.id, state);
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
      if (battle.expedition_id) {
        const run = (await client.query<Expedition>('SELECT * FROM online_expeditions WHERE id = $1 AND character_id = $2', [battle.expedition_id, character.id])).rows[0]!;
        if (run.status !== 'active') throw new AuthError(409, 'A expedição já terminou.');
        const result = settleExpedition(run.region_id, run.state, state);
        await client.query('UPDATE online_expeditions SET state = $2, status = $3, updated_at = now() WHERE id = $1', [run.id, JSON.stringify(result.state), result.status]);
      }
      battle.settled = true;
    }
    character.current_hp = state.finished && state.winnerId !== state.hero.id ? defeatRecoveryHp(state.hero.stats.maxHp) : state.hero.stats.hp; character.current_mana = state.hero.stats.mana;
    const saved = await client.query<Character>(`UPDATE characters SET level = $2, xp = $3, gold = $4, current_hp = $5, current_mana = $6,
      version = version + 1 WHERE id = $1 RETURNING *`, [character.id, character.level, character.xp, character.gold, character.current_hp, character.current_mana]);
    battle.finished = state.finished; battle.messages = battle.messages.slice(-30);
    await client.query(`UPDATE online_battles SET state = $2, messages = $3, revision = $4, finished = $5, settled = $6, updated_at = now() WHERE id = $1`,
      [battle.id, JSON.stringify(state), JSON.stringify(battle.messages), battle.revision, battle.finished, battle.settled]);
    return this.snapshot(client, saved.rows[0]!, battle);
  }
  async start(accountId: string, requestId: string, regionId: string, version: string, expeditionId?: string) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      const previous = await client.query<Battle>('SELECT * FROM online_battles WHERE character_id = $1 AND start_request_id = $2', [character.id, requestId]);
      if (previous.rows[0]) return this.snapshot(client, character);
      const current = await this.latest(client, character.id);
      if (current && !current.finished) return this.snapshot(client, character, current);
      if (character.version !== version) throw new AuthError(409, 'O personagem mudou. Atualize para continuar.');
      regionConfig(regionId);
      let run = await this.expedition(client, character.id);
      if (run?.status === 'active') {
        if (run.id !== expeditionId || run.region_id !== regionId) throw new AuthError(409, 'Continue ou encerre sua expedição atual.');
      } else {
        if (expeditionId) throw new AuthError(409, 'Esta expedição já terminou.');
        run = { id: randomUUID(), region_id: regionId, state: newExpedition(regionId), status: 'active' };
        await client.query('INSERT INTO online_expeditions (id, character_id, region_id, state) VALUES ($1, $2, $3, $4)', [run.id, character.id, regionId, JSON.stringify(run.state)]);
      }
      const items = await this.items(client, character);
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
      if ((character.current_hp ?? stats.maxHp) <= 0) throw new AuthError(409, 'Descanse antes de iniciar outra batalha.');
      const encounter = nextEncounter(regionId, run.state);
      const state = createInitialBattleState(character.hero_class, encounter.monsterId,
        items.filter(item => item.equipped_slot).map(item => item.item), character.level,
        { hp: character.current_hp ?? stats.maxHp, mana: character.current_mana ?? stats.maxMana }, character.subclass_id ?? undefined, character.name, character.tree_ranks, character.skill_loadout);
      state.id = randomUUID(); state.hero.id = character.id;
      const battle: Battle = { expedition_id: run.id, id: state.id, state, messages: ['O encontro começou.'], revision: 0, finished: false, settled: false };
      battle.state = readyForHero(state, battle.messages);
      await client.query('INSERT INTO online_battles (id, character_id, start_request_id, state, expedition_id) VALUES ($1, $2, $3, $4, $5)', [battle.id, character.id, requestId, JSON.stringify(battle.state), run.id]);
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
  async tavern(accountId: string, requestId: string, version: string, command: TavernCommand) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId), battle = await this.latest(client, character.id);
      const items = await this.items(client, character);
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
      stats.hp = Math.min(stats.maxHp, character.current_hp ?? stats.maxHp); stats.mana = Math.min(stats.maxMana, character.current_mana ?? stats.maxMana);
      if (!await tavernCommand(client, character, stats, requestId, version, command, !!battle && !battle.finished)) return this.snapshot(client, character);
      const saved = await client.query<Character>('UPDATE characters SET gold = $2, potion_inventory = $3, current_hp = $4, current_mana = $5, version = version + 1 WHERE id = $1 RETURNING *',
        [character.id, character.gold, JSON.stringify(character.potion_inventory), character.current_hp, character.current_mana]);
      return this.snapshot(client, saved.rows[0]!);
    });
  }
  async specialize(accountId: string, requestId: string, version: string, command: SpecializationCommand) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId), battle = await this.latest(client, character.id);
      const changed = await specializationCommand(client, character, requestId, version, command, !!battle && !battle.finished);
      if (!changed) return this.snapshot(client, character);
      const items = await this.items(client, character);
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
      const saved = await client.query<Character>(`UPDATE characters SET subclass_id = $2, tree_ranks = $3, skill_loadout = $4,
        current_hp = $5, current_mana = $6, version = version + 1 WHERE id = $1 RETURNING *`,
        [character.id, character.subclass_id, JSON.stringify(character.tree_ranks), JSON.stringify(character.skill_loadout),
          Math.min(stats.maxHp, character.current_hp ?? stats.maxHp), Math.min(stats.maxMana, character.current_mana ?? stats.maxMana)]);
      return this.snapshot(client, saved.rows[0]!);
    });
  }
  async quest(accountId: string, requestId: string, questId: string, version: string, operation: 'accept' | 'claim') {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      const battle = await this.latest(client, character.id);
      const changed = await questCommand(client, character, requestId, questId, version, operation, !!battle && !battle.finished);
      if (!changed) return this.snapshot(client, character);
      const saved = await client.query<Character>('UPDATE characters SET level = $2, xp = $3, gold = $4, version = version + 1 WHERE id = $1 RETURNING *',
        [character.id, character.level, character.xp, character.gold]);
      return this.snapshot(client, saved.rows[0]!);
    });
  }
  async retreat(accountId: string, version: string, expeditionId: string) {
    return inTransaction(this.pool, async client => {
      const character = await this.character(client, accountId);
      if (character.version !== version) throw new AuthError(409, 'O personagem mudou. Atualize para continuar.');
      const battle = await this.latest(client, character.id);
      if (battle && !battle.finished) throw new AuthError(409, 'Conclua a batalha antes de retornar ao mapa.');
      const result = await client.query("UPDATE online_expeditions SET status = 'retreated', updated_at = now() WHERE id = $1 AND character_id = $2 AND status = 'active'", [expeditionId, character.id]);
      if (!result.rowCount) throw new AuthError(409, 'Esta expedição já terminou.');
      const saved = await client.query<Character>('UPDATE characters SET version = version + 1 WHERE id = $1 RETURNING *', [character.id]);
      return this.snapshot(client, saved.rows[0]!);
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
      const stats = characterStats(character.hero_class, character.level, items.filter(item => item.equipped_slot).map(item => item.item), character.subclass_id ?? undefined, character.tree_ranks);
      const saved = await client.query<Character>(`UPDATE characters SET current_hp = $2, current_mana = $3, version = version + 1 WHERE id = $1 RETURNING *`,
        [character.id, instanceId ? Math.min(stats.maxHp, character.current_hp ?? stats.maxHp) : stats.maxHp,
          instanceId ? Math.min(stats.maxMana, character.current_mana ?? stats.maxMana) : stats.maxMana]);
      return this.snapshot(client, saved.rows[0]!);
    });
  }
}
