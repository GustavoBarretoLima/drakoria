import type { PoolClient } from 'pg';
import { QUESTS, normalizeQuests, questBlockReason, guildStanding, questReputation, questRankIndex, GUILD_RANKS, advanceQuestVictory, type QuestProgress } from '../../../shared/src/quests/regionalQuests.js';
import type { BattleState, HeroClass } from '../../../shared/src/types/combat.js';
import { applyProgressRewards } from '../../../shared/src/progression/playerProgress.js';
import { createDungeonEquipment } from '../../../shared/src/loot/dungeonLoot.js';
import { adaptSubclassWeaponDrops } from '../../../shared/src/equipment/assassinWeapons.js';
import type { SubclassId } from '../../../shared/src/classes/subclasses.js';
import { AuthError } from '../auth/security.js';
import { itemDefinition } from './rules.js';

interface GuildCharacter { id: string; hero_class: HeroClass; level: number; xp: string; gold: string; version: string; subclass_id?: SubclassId | null; }
export function questDefinition(id: string) {
  const quest = QUESTS.find(quest => quest.id === id);
  if (!quest) throw new AuthError(400, 'Missão desconhecida.');
  return quest;
}
async function load(client: PoolClient, characterId: string) {
  const result = await client.query('SELECT state FROM online_guild_progress WHERE character_id = $1', [characterId]);
  return normalizeQuests(result.rows[0]?.state);
}
async function save(client: PoolClient, characterId: string, progress: QuestProgress) {
  // online_battles.settled deduplicates wins in the same transaction; do not grow a second battle-ID ledger.
  progress.seenBattles = [];
  await client.query(`INSERT INTO online_guild_progress (character_id, state) VALUES ($1, $2)
    ON CONFLICT (character_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`, [characterId, JSON.stringify(progress)]);
}
export async function guildSnapshot(client: PoolClient, characterId: string, level: number) {
  const progress = await load(client, characterId), standing = guildStanding(progress);
  const receipt = await client.query("SELECT reward FROM online_quest_commands WHERE character_id = $1 AND operation = 'claim' ORDER BY created_at DESC, request_id DESC LIMIT 1", [characterId]);
  return { standing, lastDelivery: receipt.rows[0]?.reward ?? null,
    quests: QUESTS.map(quest => ({ ...quest, reputation: questReputation(quest), requiredRank: GUILD_RANKS[questRankIndex(quest)]!.name,
      entry: progress.entries[quest.id] ?? null, blocked: questBlockReason(quest, progress, level),
      ready: progress.entries[quest.id]?.status === 'active' && progress.entries[quest.id]!.count >= quest.target })) };
}
export async function advanceGuildVictory(client: PoolClient, characterId: string, battle: BattleState) {
  const progress = await load(client, characterId);
  if (!Object.values(progress.entries).some(entry => entry.status === 'active')) return;
  const drops = (battle.rewards?.drops ?? []).reduce((sum, drop) => sum + drop.quantity, 0);
  await save(client, characterId, advanceQuestVictory(progress, battle.id, battle.enemy.id, drops));
}
export async function questCommand(client: PoolClient, character: GuildCharacter, requestId: string, questId: string,
  version: string, operation: 'accept' | 'claim', fighting: boolean): Promise<boolean> {
  const quest = questDefinition(questId);
  const previous = await client.query('SELECT quest_id, operation FROM online_quest_commands WHERE character_id = $1 AND request_id = $2', [character.id, requestId]);
  if (previous.rows[0]) {
    if (previous.rows[0].quest_id !== questId || previous.rows[0].operation !== operation) throw new AuthError(409, 'Identificador já usado em outro comando.');
    return false;
  }
  if (character.version !== version) throw new AuthError(409, 'O personagem mudou. Atualize para continuar.');
  if (fighting) throw new AuthError(409, 'Conclua a batalha antes de aceitar ou entregar missões.');
  const progress = await load(client, character.id);
  let reward = null;
  if (operation === 'accept') {
    const reason = questBlockReason(quest, progress, character.level);
    if (reason) throw new AuthError(409, reason);
    progress.entries[quest.id] = { count: 0, status: 'active', claims: progress.entries[quest.id]?.claims ?? 0 };
  } else {
    const entry = progress.entries[quest.id];
    if (!entry || entry.status !== 'active' || entry.count < quest.target) throw new AuthError(409, 'Missão ainda não concluída ou recompensa já entregue.');
    entry.status = 'claimed'; entry.claims++;
    const awarded = applyProgressRewards({ nivel: character.level, xp: character.xp, ouro: character.gold }, quest.gold, quest.xp);
    character.level = awarded.nivel; character.xp = String(awarded.xp); character.gold = String(awarded.ouro);
    const equipment = quest.gear ? itemDefinition(adaptSubclassWeaponDrops([{ item: createDungeonEquipment(character.hero_class, 'weapon', quest.gear, 'epic'), quantity: 1 }], character.subclass_id ?? undefined)[0]!.item.id) : null;
    if (equipment) {
      const key = `quest:${requestId}:gear`;
      const item = await client.query(`INSERT INTO equipment_instances (owner_character_id, origin_character_id, definition_id, source_operation_key)
        VALUES ($1, $1, $2, $3) RETURNING id`, [character.id, equipment.id, key]);
      await client.query("INSERT INTO equipment_events (equipment_instance_id, character_id, event_type, operation_key) VALUES ($1, $2, 'grant', $3)", [item.rows[0].id, character.id, key]);
    }
    reward = { questId: quest.id, name: quest.name, xp: quest.xp, gold: quest.gold, reputation: questReputation(quest), equipment: equipment?.name ?? null };
  }
  await save(client, character.id, progress);
  await client.query('INSERT INTO online_quest_commands (character_id, request_id, quest_id, operation, reward) VALUES ($1, $2, $3, $4, $5)',
    [character.id, requestId, questId, operation, reward ? JSON.stringify(reward) : null]);
  return true;
}
