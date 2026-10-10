import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createDatabasePool, inTransaction } from '../src/database/pool.js';
import { CharacterRepository } from '../src/database/characterRepository.js';
import { migrateDatabase } from '../src/database/migrate.js';
import { AuthRepository } from '../src/auth/repository.js';
import { GameRepository } from '../src/game/repository.js';
import { createGameHandler } from '../src/game/http.js';
import { grantSubclassBooks } from '../src/game/specialization.js';
import { characterStats } from '../src/game/rules.js';
import { SUBCLASS_DEFINITIONS, SUBCLASS_IDS, type SubclassId } from '../../shared/src/classes/subclasses.js';
import { SUBCLASS_TREES } from '../../shared/src/classes/skillTrees.js';
import { rollSubclassBookDrops } from '../../shared/src/loot/subclassBooks.js';
import { createInitialBattleState } from '../src/modules/combat/battleRoom.js';

// Isolated CI PostgreSQL schema; never use a live game database.
test('online specialization persists owned books, permanent choices and validated builds atomically', async t => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL obrigatoria.');
  const env = { DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? 'disable' };
  const admin = createDatabasePool(env), pool = createDatabasePool(env), schema = `specialization_${randomUUID().replaceAll('-', '')}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool.on('connect', client => { void client.query(`SET search_path TO ${schema}`); });
  const auth = new AuthRepository(pool), game = new GameRepository(pool);
  const bookDrop = (id: SubclassId) => { let calls = 0; return rollSubclassBookDrops('cursed-gravedigger-boss-lvl-15', () => calls++ ? (SUBCLASS_IDS.indexOf(id) + 0.1) / 9 : 0); };
  async function grant(characterId: string, id: SubclassId) {
    const state = createInitialBattleState(); state.id = randomUUID(); state.rewards!.classBooks = bookDrop(id);
    await inTransaction(pool, client => grantSubclassBooks(client, characterId, state));
    return (await pool.query('SELECT id FROM online_subclass_books WHERE character_id = $1 AND source_operation_key = $2', [characterId, `battle:${state.id}:book:0`])).rows[0].id as string;
  }
  try {
    await migrateDatabase(pool);
    const a = await auth.createPasswordAccount('specialization-a@example.test', 'a'.repeat(64));
    const b = await auth.createPasswordAccount('specialization-b@example.test', 'b'.repeat(64));
    await auth.createCharacter(a.id, 'Alice', 'guerreiro'); await auth.createCharacter(b.id, 'Bruno', 'mago');
    let state = await game.load(a.id), bookId = '';
    await t.test('new and existing characters retain progress and cannot invent, steal or use incompatible books', async () => {
      assert.equal(state.specialization.active, null); assert.deepEqual(state.specialization.books, []); assert.equal(state.specialization.points, 0);
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'invest', nodeId: 'berserker-brutal' }));
      const foreign = await grant((await game.load(b.id)).character.id, 'berserker');
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'use-book', bookId: foreign }));
      await assert.rejects(game.specialize(b.id, randomUUID(), (await game.load(b.id)).character.version, { operation: 'use-book', bookId: foreign }));
      const incompatible = await grant(state.character.id, 'necromancer');
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'use-book', bookId: incompatible }));
      await pool.query('UPDATE characters SET level = 20, xp = 42, gold = 17, current_hp = 27, current_mana = 3 WHERE id = $1', [state.character.id]);
      bookId = await grant(state.character.id, 'berserker'); state = await game.load(a.id);
      assert.equal(state.specialization.points, 19); assert.equal(state.character.xp, 42); assert.equal(state.character.gold, 17);
      assert.equal(state.specialization.books.length, 2);
    });
    await t.test('late failure rolls back consumption, new weapon, audit and command receipt', async () => {
      await pool.query(`CREATE FUNCTION fail_specialization() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late save failure'; END; $$`);
      await pool.query('CREATE TRIGGER fail_specialization BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION fail_specialization()');
      const before = state, events = (await pool.query('SELECT count(*) FROM online_book_events')).rows[0].count;
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'use-book', bookId }));
      assert.deepEqual(await game.load(a.id), before);
      assert.equal((await pool.query('SELECT count(*) FROM online_book_events')).rows[0].count, events);
      assert.equal((await pool.query('SELECT count(*) FROM online_specialization_commands')).rows[0].count, '0');
      await pool.query('DROP TRIGGER fail_specialization ON characters'); await pool.query('DROP FUNCTION fail_specialization()');
    });
    await t.test('concurrent retries consume exactly one book and issue exactly one compatible starter weapon', async () => {
      const request = randomUUID(), version = state.character.version;
      const responses = await Promise.all(Array.from({ length: 5 }, () => game.specialize(a.id, request, version, { operation: 'use-book', bookId })));
      state = responses[0]!;
      assert.equal(new Set(responses.map(s => s.character.version)).size, 1);
      assert.equal(state.specialization.active!.id, 'berserker'); assert.equal(state.specialization.books.length, 1);
      assert.equal(state.character.stats.hp, 27); assert.equal(state.character.stats.mana, 3);
      const weapon = state.inventory.find(item => item.equipped)!;
      assert.equal(weapon.definition.id, 'berserk-dungeon-weapon-guerreiro-common-lvl-1'); assert.equal(weapon.canEquip, true);
      assert.equal((await pool.query("SELECT count(*) FROM online_book_events WHERE book_id = $1 AND event_type = 'consume'", [bookId])).rows[0].count, '1');
      assert.equal((await pool.query('SELECT count(*) FROM equipment_events WHERE operation_key = $1', [`specialization:${request}:weapon`])).rows[0].count, '1');
      await assert.rejects(game.specialize(a.id, request, version, { operation: 'reset' }));
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'use-book', bookId }));
      await assert.rejects(pool.query('DELETE FROM online_book_events WHERE book_id = $1', [bookId]));
    });
    await t.test('points, prerequisites, learned slots and concurrent versions are enforced without free healing', async () => {
      const invest = async (nodeId: string) => { state = await game.specialize(a.id, randomUUID(), state.character.version, { operation: 'invest', nodeId }); };
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'invest', nodeId: 'berserker-executor' }));
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'invest', nodeId: 'paladin-foundation' }));
      const version = state.character.version;
      const concurrent = await Promise.allSettled(['berserker-brutal', 'berserker-iron'].map(nodeId => game.specialize(a.id, randomUUID(), version, { operation: 'invest', nodeId })));
      assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1); state = await game.load(a.id);
      assert.equal(state.specialization.points, 18);
      if (!state.specialization.nodes.find(n => n.id === 'berserker-brutal')!.rank) await invest('berserker-brutal');
      if (!state.specialization.nodes.find(n => n.id === 'berserker-iron')!.rank) await invest('berserker-iron');
      await invest('berserker-vigor'); assert.equal(state.character.stats.hp, 27);
      state = await game.specialize(a.id, randomUUID(), state.character.version, { operation: 'skill-slot', slot: 3, skillId: '' });
      await invest('berserker-instinct'); await invest('berserker-warcry');
      assert.ok(state.specialization.loadout.includes('berserker-warcry'), 'new active fills a padded empty slot');
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'skill-slot', slot: 3, skillId: 'berserker-brutal' }));
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'skill-slot', slot: 3, skillId: 'berserker-executor' }));
      state = await game.specialize(a.id, randomUUID(), state.character.version, { operation: 'skill-slot', slot: 0, skillId: '' });
      const request = randomUUID(), resetVersion = state.character.version;
      state = await game.specialize(a.id, request, resetVersion, { operation: 'reset' });
      assert.equal(state.specialization.points, 19); assert.equal(state.specialization.active!.id, 'berserker'); assert.equal(state.character.stats.hp, 27);
      assert.equal(state.specialization.nodes.every(n => n.rank === 0), true);
      assert.deepEqual(await game.specialize(a.id, request, resetVersion, { operation: 'reset' }), state);
      await invest('berserker-brutal');
    });
    await t.test('persisted build drives the next battle; active battles prevent profile edits', async () => {
      state = await game.camp(a.id, state.character.version);
      const expected = state.character.stats;
      state = await game.start(a.id, randomUUID(), 'cemiterio-esquecido', state.character.version);
      assert.equal(state.battle!.state.hero.subclassId, 'berserker'); assert.equal(state.battle!.state.hero.hasTwoHandedAxe, true);
      assert.equal(state.battle!.state.hero.stats.attack, expected.attack);
      assert.equal(state.battle!.skills.some(skill => skill.id === 'berserker-brutal'), true);
      assert.match(state.battle!.heroPresentation.idle, /berserk_primal/);
      await assert.rejects(game.specialize(a.id, randomUUID(), state.character.version, { operation: 'reset' }));
      await assert.rejects(game.action(a.id, state.battle!.id, state.battle!.revision, { type: 'CAST_MAGIC' }));
      await assert.rejects(game.action(a.id, state.battle!.id, state.battle!.revision, { type: 'USE_SKILL', skillId: 'berserker-executor' }));
      assert.deepEqual(await new GameRepository(pool).load(a.id), state);
    });
    await t.test('settled boss victory grants books once; defeat never grants planned books', async () => {
      const c = await auth.createPasswordAccount('specialization-loot@example.test', 'c'.repeat(64)); await auth.createCharacter(c.id, 'Clara', 'mago');
      let s = await game.load(c.id); s = await game.start(c.id, randomUUID(), 'cemiterio-esquecido', s.character.version);
      const battle = s.battle!, fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [battle.id])).rows[0].state;
      fixture.enemy.id = 'cursed-gravedigger-boss-lvl-15'; fixture.enemy.stats.hp = 1; fixture.enemy.stats.dodgeChance = 0; fixture.hero.stats.attack = 99999;
      fixture.rewards = { xp: 0, gold: 0, drops: [], classBooks: bookDrop('necromancer') };
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [battle.id, JSON.stringify(fixture)]);
      s = await game.action(c.id, battle.id, battle.revision, { type: 'ATTACK' });
      assert.equal(s.specialization.books.length, 1);
      await assert.rejects(game.action(c.id, battle.id, battle.revision, { type: 'ATTACK' }));
      assert.equal((await game.load(c.id)).specialization.books.length, 1);
      s = await game.start(c.id, randomUUID(), 'cemiterio-esquecido', s.character.version);
      const lost = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [s.battle!.id])).rows[0].state;
      lost.hero.stats.hp = 1; lost.hero.stats.defense = 0; lost.hero.stats.dodgeChance = 0; lost.enemy.stats.attack = 999999; lost.enemy.stats.magicPower = 999999;
      lost.enemy.stats.hp = 999999; lost.enemy.stats.maxHp = 999999; lost.hero.stats.attack = 0; lost.enemy.atb = 100;
      lost.rewards.classBooks = bookDrop('necromancer');
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [s.battle!.id, JSON.stringify(lost)]);
      s = await game.action(c.id, s.battle!.id, s.battle!.revision, { type: 'ATTACK' });
      assert.equal(s.battle!.state.finished, true); assert.equal(s.battle!.state.winnerId, s.battle!.state.enemy.id);
      assert.equal(s.specialization.books.length, 1);
    });
    await t.test('all nine saved subclasses reuse original trees and stats on reload', async () => {
      for (const id of SUBCLASS_IDS) {
        const account = await auth.createPasswordAccount(`specialization-${id}@example.test`, 'd'.repeat(64));
        const heroClass = SUBCLASS_DEFINITIONS[id].baseClass; await auth.createCharacter(account.id, `Hero${SUBCLASS_IDS.indexOf(id)}`, heroClass);
        let s = await game.load(account.id); await pool.query('UPDATE characters SET level = 20 WHERE id = $1', [s.character.id]);
        if (id === 'berserker' || id === 'assassin') {
          const items = new CharacterRepository(pool);
          const weapon = await items.grantEquipment(account.id, s.character.id, `dungeon-weapon-${heroClass}-rare-lvl-5`, `test:${id}:weapon`);
          const shield = await items.grantEquipment(account.id, s.character.id, `dungeon-shield-${heroClass}-rare-lvl-5`, `test:${id}:shield`);
          s = await game.load(account.id); s = await game.camp(account.id, s.character.version, weapon); s = await game.camp(account.id, s.character.version, shield);
        }
        const ownedBook = await grant(s.character.id, id); s = await game.load(account.id);
        s = await game.specialize(account.id, randomUUID(), s.character.version, { operation: 'use-book', bookId: ownedBook });
        const node = SUBCLASS_TREES[id].find(n => !n.requires.length)!;
        s = await game.specialize(account.id, randomUUID(), s.character.version, { operation: 'invest', nodeId: node.id });
        assert.equal(s.specialization.active!.id, id); assert.equal(s.specialization.points, 18);
        const expected = characterStats(heroClass, 20, s.inventory.filter(i => i.equipped).map(i => i.definition), id, { [node.id]: 1 });
        assert.equal(s.character.stats.attack, expected.attack); assert.equal(s.character.stats.maxHp, expected.maxHp);
        assert.deepEqual(await new GameRepository(pool).load(account.id), s);
        if (id === 'berserker' || id === 'assassin') {
          const prefix = id === 'berserker' ? 'berserk' : 'assassin';
          assert.equal(s.inventory.find(i => i.equipped && i.definition.slot === 'weapon')!.definition.id, `${prefix}-dungeon-weapon-${heroClass}-rare-lvl-5`);
          assert.equal(s.inventory.length, 3);
          assert.equal(s.inventory.find(i => i.definition.id === `dungeon-weapon-${heroClass}-rare-lvl-5`)!.equipped, false);
          const shield = s.inventory.find(i => i.definition.slot === 'shield')!;
          assert.equal(shield.equipped, id !== 'berserker'); assert.equal(shield.canEquip, id !== 'berserker');
          await assert.rejects(game.camp(account.id, s.character.version, s.inventory.find(i => i.definition.id === `dungeon-weapon-${heroClass}-rare-lvl-5`)!.instanceId));
        }
      }
    });
    await t.test('a compatible book works at level one but cannot create talent points', async () => {
      const account = await auth.createPasswordAccount('specialization-new@example.test', 'e'.repeat(64)); await auth.createCharacter(account.id, 'NewHero', 'guerreiro');
      let s = await game.load(account.id); const book = await grant(s.character.id, 'paladin');
      s = await game.specialize(account.id, randomUUID(), s.character.version, { operation: 'use-book', bookId: book });
      assert.equal(s.character.level, 1); assert.equal(s.specialization.active!.id, 'paladin'); assert.equal(s.specialization.points, 0);
      await assert.rejects(game.specialize(account.id, randomUUID(), s.character.version, { operation: 'invest', nodeId: 'paladin-foundation' }));
      assert.deepEqual(await game.load(account.id), s);
    });
    await t.test('HTTP validates identity, origin and exact intent-only payloads', async () => {
      const token = await auth.newSession(a.id), handler = createGameHandler({ auth, game, origin: 'https://game.example', production: false });
      async function request(path: string, body: unknown, extra: Record<string, string> = {}) {
        const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
        req.url = path; req.method = 'POST'; req.headers = { 'content-type': 'application/json', origin: 'https://game.example', cookie: `drakoria_session=${token}`, ...extra };
        let status = 0; const res = { setHeader() {}, writeHead(code: number) { status = code; }, end() {} } as unknown as ServerResponse;
        await handler(req, res); return status;
      }
      const valid = { requestId: randomUUID(), version: state.character.version, nodeId: 'berserker-brutal' };
      const path = '/game/specialization/invest';
      assert.equal(await request(path, valid, { cookie: '' }), 401); assert.equal(await request(path, valid, { origin: 'https://evil.example' }), 403);
      for (const key of ['characterId', 'subclassId', 'treeRanks', 'points', 'level', 'quantity', 'stats', 'xp', 'gold']) assert.equal(await request(path, { ...valid, [key]: 999 }), 400);
      assert.equal(await request('/game/specialization/admin', valid), 404);
      assert.equal(await request(path, { ...valid, version: '0' }), 409);
    });
  } finally { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
