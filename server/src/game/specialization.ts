import type { PoolClient } from 'pg';
import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS, listSubclassesForClass, type SubclassId } from '../../../shared/src/classes/subclasses.js';
import { SUBCLASS_TREES, normalizeTreeRanks, normalizeBerserkLoadout, earnedTreePoints, spentTreePoints, treeBlockReason, type TreeRanks } from '../../../shared/src/classes/skillTrees.js';
import { getHeroSkills } from '../../../shared/src/combat/classSkills.js';
import type { BattleState, HeroClass } from '../../../shared/src/types/combat.js';
import { createDungeonEquipment } from '../../../shared/src/loot/dungeonLoot.js';
import { adaptSubclassWeaponDrops } from '../../../shared/src/equipment/assassinWeapons.js';
import { AuthError } from '../auth/security.js';
import { itemDefinition, onlyFields, uuid } from './rules.js';

export interface SpecializationCharacter {
  id: string; hero_class: HeroClass; level: number; version: string;
  subclass_id: SubclassId | null; tree_ranks: TreeRanks; skill_loadout: string[];
}
export type SpecializationCommand = { operation: 'use-book'; bookId: string } | { operation: 'invest'; nodeId: string }
  | { operation: 'reset' } | { operation: 'skill-slot'; slot: number; skillId: string };
export async function specializationSnapshot(client: PoolClient, character: SpecializationCharacter) {
  const id = character.subclass_id ?? undefined, ranks = normalizeTreeRanks(id, character.level, character.tree_ranks);
  const books = await client.query<{ id: string; subclass_id: SubclassId }>('SELECT id, subclass_id FROM online_subclass_books WHERE character_id = $1 AND consumed_at IS NULL ORDER BY created_at, id', [character.id]);
  return { active: id ? SUBCLASS_DEFINITIONS[id] : null, subclasses: listSubclassesForClass(character.hero_class),
    books: books.rows.map(book => ({ instanceId: book.id, subclassId: book.subclass_id, name: SUBCLASS_DEFINITIONS[book.subclass_id].bookName,
      blocked: id ? 'Sua especialização já está definida.' : SUBCLASS_DEFINITIONS[book.subclass_id].baseClass !== character.hero_class ? 'Livro de outra classe.' : null })),
    points: earnedTreePoints(character.level) - spentTreePoints(ranks),
    nodes: id ? SUBCLASS_TREES[id].map(node => ({ ...node, rank: ranks[node.id] ?? 0, blocked: treeBlockReason(id, character.level, ranks, node) })) : [],
    loadout: id === 'berserker' ? normalizeBerserkLoadout(character.level, ranks, character.skill_loadout) : [],
    learnedSkills: getHeroSkills({ className: character.hero_class, level: character.level, ...(id ? { subclassId: id } : {}), treeRanks: ranks,
      ...(id === 'berserker' ? { equippedSkills: SUBCLASS_TREES[id].filter(node => node.skill && ranks[node.id]).map(node => node.id).slice(0, 4) } : {}) })
      .filter(skill => !skill.subclassId || !!ranks[skill.id]).map(skill => ({ id: skill.id, name: skill.name })),
    // Slot choices include all learned Berserk actives, not just the equipped four.
    slotChoices: id === 'berserker' ? SUBCLASS_TREES[id].filter(node => node.skill && ranks[node.id]).map(node => ({ id: node.id, name: node.name })) : [] };
}
export async function grantSubclassBooks(client: PoolClient, characterId: string, battle: BattleState) {
  let index = 0;
  for (const book of battle.rewards?.classBooks ?? []) {
    if (!SUBCLASS_IDS.includes(book.subclassId) || book.bookId !== `subclass-book-${book.subclassId}` || book.quantity !== 1) throw new Error('Livro planejado inválido.');
    const operation = `battle:${battle.id}:book:${index++}`;
    const result = await client.query('INSERT INTO online_subclass_books (character_id, subclass_id, source_operation_key) VALUES ($1, $2, $3) RETURNING id', [characterId, book.subclassId, operation]);
    await client.query("INSERT INTO online_book_events (book_id, character_id, event_type, operation_key) VALUES ($1, $2, 'grant', $3)", [result.rows[0].id, characterId, operation]);
  }
}
export async function specializationCommand(client: PoolClient, character: SpecializationCharacter, requestId: string, version: string,
  command: SpecializationCommand, fighting: boolean): Promise<boolean> {
  const previous = await client.query('SELECT command FROM online_specialization_commands WHERE character_id = $1 AND request_id = $2', [character.id, requestId]);
  if (previous.rows[0]) {
    const stored = previous.rows[0].command as Record<string, unknown>;
    if (Object.keys(stored).length !== Object.keys(command).length || Object.entries(command).some(([key, value]) => stored[key] !== value)) throw new AuthError(409, 'Identificador usado em outro comando.');
    return false;
  }
  if (character.version !== version) throw new AuthError(409, 'O personagem mudou. Atualize para continuar.');
  if (fighting) throw new AuthError(409, 'Conclua a batalha antes de mudar a especialização.');
  if (command.operation === 'use-book') {
    if (character.subclass_id) throw new AuthError(409, 'Sua especialização já está definida.');
    const result = await client.query<{ subclass_id: SubclassId }>('SELECT subclass_id FROM online_subclass_books WHERE id = $1 AND character_id = $2 AND consumed_at IS NULL', [command.bookId, character.id]);
    const book = result.rows[0];
    if (!book || SUBCLASS_DEFINITIONS[book.subclass_id].baseClass !== character.hero_class) throw new AuthError(409, 'Você não possui um livro compatível disponível.');
    character.subclass_id = book.subclass_id; character.tree_ranks = {}; character.skill_loadout = [];
    await client.query('UPDATE online_subclass_books SET consumed_at = now() WHERE id = $1', [command.bookId]);
    await client.query("INSERT INTO online_book_events (book_id, character_id, event_type, operation_key) VALUES ($1, $2, 'consume', $3)", [command.bookId, character.id, `specialization:${requestId}:consume`]);
    if (book.subclass_id === 'berserker' || book.subclass_id === 'assassin') {
      const weapon = (await client.query('SELECT definition_id FROM equipment_instances WHERE owner_character_id = $1 AND equipped_slot = $2', [character.id, 'weapon'])).rows[0];
      const original = weapon ? itemDefinition(weapon.definition_id) : createDungeonEquipment(character.hero_class, 'weapon', 1, 'common');
      const adapted = itemDefinition(adaptSubclassWeaponDrops([{ item: original, quantity: 1 }], book.subclass_id)[0]!.item.id);
      await client.query("UPDATE equipment_instances SET equipped_slot = NULL WHERE owner_character_id = $1 AND (equipped_slot = 'weapon' OR ($2 = 'berserker' AND equipped_slot = 'shield'))", [character.id, book.subclass_id]);
      const operation = `specialization:${requestId}:weapon`;
      const granted = await client.query("INSERT INTO equipment_instances (owner_character_id, origin_character_id, definition_id, source_operation_key, equipped_slot) VALUES ($1, $1, $2, $3, 'weapon') RETURNING id", [character.id, adapted.id, operation]);
      await client.query("INSERT INTO equipment_events (equipment_instance_id, character_id, event_type, operation_key) VALUES ($1, $2, 'grant', $3)", [granted.rows[0].id, character.id, operation]);
    }
  } else {
    const id = character.subclass_id;
    if (!id) throw new AuthError(409, 'Use um livro compatível para liberar a subclasse.');
    const ranks = normalizeTreeRanks(id, character.level, character.tree_ranks);
    if (command.operation === 'reset') { character.tree_ranks = {}; character.skill_loadout = []; }
    else if (command.operation === 'invest') {
      const node = SUBCLASS_TREES[id].find(node => node.id === command.nodeId);
      if (!node) throw new AuthError(400, 'Talento de outra subclasse.');
      const reason = treeBlockReason(id, character.level, ranks, node);
      if (reason) throw new AuthError(409, reason);
      character.tree_ranks = { ...ranks, [node.id]: (ranks[node.id] ?? 0) + 1 };
      if (id === 'berserker') {
        const slots = normalizeBerserkLoadout(character.level, character.tree_ranks, character.skill_loadout);
        if (node.skill && !slots.includes(node.id)) {
          const empty = slots.indexOf('');
          if (empty >= 0) slots[empty] = node.id; else if (slots.length < 4) slots.push(node.id);
        }
        character.skill_loadout = slots;
      }
    } else {
      if (id !== 'berserker' || !Number.isInteger(command.slot) || command.slot < 0 || command.slot > 3) throw new AuthError(400, 'Espaço inválido.');
      const slots = normalizeBerserkLoadout(character.level, ranks, character.skill_loadout);
      if (command.skillId && (!normalizeBerserkLoadout(character.level, ranks, [command.skillId]).includes(command.skillId)
        || slots.some((skill, index) => skill === command.skillId && index !== command.slot))) throw new AuthError(409, 'Habilidade não aprendida ou já equipada.');
      while (slots.length < 4) slots.push('');
      slots[command.slot] = command.skillId; character.skill_loadout = slots;
    }
  }
  await client.query('INSERT INTO online_specialization_commands (character_id, request_id, command) VALUES ($1, $2, $3)', [character.id, requestId, JSON.stringify(command)]);
  return true;
}
export function parseSpecializationCommand(operation: string, body: Record<string, unknown>): SpecializationCommand {
  const extras = operation === 'use-book' ? ['bookId'] : operation === 'invest' ? ['nodeId'] : operation === 'skill-slot' ? ['slot', 'skillId'] : [];
  onlyFields(body, ['requestId', 'version', ...extras]);
  if (!uuid(body.requestId) || typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version)) throw new AuthError(400, 'Comando inválido.');
  if (operation === 'use-book' && uuid(body.bookId)) return { operation, bookId: body.bookId };
  if (operation === 'invest' && typeof body.nodeId === 'string' && body.nodeId.length <= 80) return { operation, nodeId: body.nodeId };
  if (operation === 'reset') return { operation };
  if (operation === 'skill-slot' && Number.isInteger(body.slot) && Number(body.slot) >= 0 && Number(body.slot) <= 3 && typeof body.skillId === 'string' && body.skillId.length <= 80) return { operation, slot: Number(body.slot), skillId: body.skillId };
  throw new AuthError(400, 'Comando inválido.');
}
