import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createDatabasePool } from '../src/database/pool.js';
import { migrateDatabase } from '../src/database/migrate.js';
import { AuthRepository } from '../src/auth/repository.js';
import { GameRepository } from '../src/game/repository.js';
import { createGameHandler } from '../src/game/http.js';
import { itemDefinition } from '../src/game/rules.js';

// Disposable PostgreSQL schema only. Never run against staging or production.
test('online Guild persists objectives, enforces gates and delivers rewards once', async t => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL obrigatoria.');
  const env = { DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? 'disable' };
  const admin = createDatabasePool(env), pool = createDatabasePool(env), schema = `guild_${randomUUID().replaceAll('-', '')}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool.on('connect', client => { void client.query(`SET search_path TO ${schema}`); });
  const auth = new AuthRepository(pool), game = new GameRepository(pool);
  try {
    await migrateDatabase(pool);
    const a = await auth.createPasswordAccount('guild-a@example.test', 'a'.repeat(64));
    const b = await auth.createPasswordAccount('guild-b@example.test', 'b'.repeat(64));
    await auth.createCharacter(a.id, 'Alice', 'guerreiro'); await auth.createCharacter(b.id, 'Bruno', 'mago');
    let state = await game.load(a.id);
    const entry = (id: string) => state.guild.quests.find(quest => quest.id === id)!;
    const accept = async (id: string) => { state = await game.quest(a.id, randomUUID(), id, state.character.version, 'accept'); };
    const start = async () => {
      state = await game.camp(a.id, state.character.version);
      state = await game.start(a.id, randomUUID(), 'cemiterio-esquecido', state.character.version, state.expedition?.status === 'active' ? state.expedition.id : undefined);
    };
    const finish = async (quantity = 0) => {
      const old = state.battle!, fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [old.id])).rows[0].state;
      fixture.enemy.stats.hp = 1; fixture.enemy.stats.dodgeChance = 0; fixture.hero.stats.attack = 99999;
      fixture.rewards = { xp: 0, gold: 0, drops: quantity ? [{ item: itemDefinition('goblin-tooth-ring'), quantity }] : [], classBooks: [] };
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [old.id, JSON.stringify(fixture)]);
      state = await game.action(a.id, old.id, old.revision, { type: 'ATTACK' });
    };
    await t.test('fresh accounts have 15 original contracts, rank F and server gates', async () => {
      assert.equal(state.guild.quests.length, 15); assert.equal(state.guild.standing.rank, 'F');
      assert.equal(state.guild.standing.reputation, 0);
      await assert.rejects(game.quest(a.id, randomUUID(), '__proto__', state.character.version, 'accept'));
      assert.match(entry('pantano-corrompido-hunt').blocked!, /nível 10/);
      await pool.query('UPDATE characters SET level = 100 WHERE id = $1', [state.character.id]);
      state = await game.load(a.id);
      assert.match(entry('pantano-corrompido-hunt').blocked!, /rank E/);
      await assert.rejects(game.quest(a.id, randomUUID(), 'pantano-corrompido-hunt', state.character.version, 'accept'));
      assert.equal((await game.load(b.id)).guild.quests.every(quest => !quest.entry), true);
    });
    await t.test('old drops do not count; acceptance is atomic and retry-safe', async () => {
      await start(); await finish(2);
      const request = randomUUID(), version = state.character.version;
      const results = await Promise.all(Array.from({ length: 5 }, () => game.quest(a.id, request, 'cemiterio-esquecido-hunt', version, 'accept')));
      state = results[0]!; assert.equal(entry('cemiterio-esquecido-hunt').entry!.count, 0);
      assert.equal(new Set(results.map(result => result.character.version)).size, 1);
      await assert.rejects(game.quest(a.id, request, 'cemiterio-esquecido-collect', version, 'accept'));
      await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-collect', version, 'accept'));
      await accept('cemiterio-esquecido-collect'); await accept('cemiterio-esquecido-boss');
      assert.equal(entry('cemiterio-esquecido-collect').entry!.count, 0);
      await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-hunt', state.character.version, 'claim'));
    });
    await t.test('settled battles update active objectives once, including drop quantities and exact bosses', async () => {
      for (let victory = 1; victory <= 4; victory++) {
        await start();
        await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-collect', state.character.version, 'claim'));
        const before = state.battle!;
        if (victory === 1) {
          await pool.query(`CREATE FUNCTION fail_guild_battle() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late battle save failure'; END; $$`);
          await pool.query('CREATE TRIGGER fail_guild_battle BEFORE UPDATE ON online_battles FOR EACH ROW WHEN (NEW.finished) EXECUTE FUNCTION fail_guild_battle()');
          await assert.rejects(finish(2));
          // finish sets a trusted fixture before acting; compare the exact fixture snapshot.
          const rollback = await game.load(a.id);
          assert.equal(rollback.guild.quests.find(q => q.id === 'cemiterio-esquecido-hunt')!.entry!.count, 0);
          assert.equal(rollback.guild.quests.find(q => q.id === 'cemiterio-esquecido-collect')!.entry!.count, 0);
          assert.equal(rollback.inventory.length, 2);
          await pool.query('DROP TRIGGER fail_guild_battle ON online_battles'); await pool.query('DROP FUNCTION fail_guild_battle()');
        }
        await finish(victory === 1 ? 2 : 1);
        assert.equal(entry('cemiterio-esquecido-hunt').entry!.count, victory);
        assert.equal(entry('cemiterio-esquecido-collect').entry!.count, Math.min(3, victory + 1));
        await assert.rejects(game.action(a.id, before.id, before.revision, { type: 'ATTACK' }));
        assert.deepEqual(await new GameRepository(pool).load(a.id), state);
      }
      await start(); assert.equal(state.battle!.state.enemy.id, 'cursed-gravedigger-boss-lvl-15'); await finish();
      assert.equal(entry('cemiterio-esquecido-hunt').entry!.count, 4);
      assert.equal(entry('cemiterio-esquecido-boss').entry!.count, 1);
      await start(); await finish(); assert.equal(entry('cemiterio-esquecido-hunt').entry!.count, 5);
    });
    await t.test('one concurrent boss claim grants one canonical epic weapon, audit and promotion', async () => {
      const request = randomUUID(), version = state.character.version, inventory = state.inventory.length;
      await pool.query(`CREATE FUNCTION fail_boss_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'boss save failure'; END; $$`);
      await pool.query('CREATE TRIGGER fail_boss_delivery BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION fail_boss_delivery()');
      const before = await game.load(a.id);
      await assert.rejects(game.quest(a.id, request, 'cemiterio-esquecido-boss', version, 'claim'));
      assert.deepEqual(await game.load(a.id), before);
      await pool.query('DROP TRIGGER fail_boss_delivery ON characters'); await pool.query('DROP FUNCTION fail_boss_delivery()');
      const results = await Promise.all(Array.from({ length: 5 }, () => game.quest(a.id, request, 'cemiterio-esquecido-boss', version, 'claim')));
      state = results[0]!;
      assert.equal(state.inventory.length, inventory + 1); assert.equal(state.guild.standing.rank, 'E');
      assert.equal(state.guild.standing.reputation, 60);
      assert.equal(state.guild.lastDelivery.questId, 'cemiterio-esquecido-boss');
      const weapon = state.inventory.find(item => item.definition.id === 'dungeon-weapon-guerreiro-epic-lvl-15'); assert.ok(weapon);
      assert.equal((await pool.query("SELECT count(*) FROM equipment_events WHERE operation_key = $1", [`quest:${request}:gear`])).rows[0].count, '1');
      await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-boss', state.character.version, 'claim'));
      await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-boss', state.character.version, 'accept'));
      assert.equal(entry('pantano-corrompido-boss').blocked, null);
    });
    await t.test('repeatable delivery retains reputation, resets objectives and excludes old request replays', async () => {
      const request = randomUUID(), version = state.character.version;
      state = await game.quest(a.id, request, 'cemiterio-esquecido-hunt', version, 'claim');
      assert.equal(state.guild.standing.reputation, 70);
      await accept('cemiterio-esquecido-hunt');
      const reopened = state;
      state = await game.quest(a.id, request, 'cemiterio-esquecido-hunt', version, 'claim');
      assert.deepEqual(state, reopened); assert.equal(entry('cemiterio-esquecido-hunt').entry!.count, 0);
      assert.equal(entry('cemiterio-esquecido-hunt').entry!.claims, 1);
      const foreign = await game.quest(b.id, request, 'cemiterio-esquecido-hunt', (await game.load(b.id)).character.version, 'accept');
      assert.equal(foreign.guild.standing.reputation, 0); assert.equal(foreign.guild.lastDelivery, null);
    });
    await t.test('late save failure rolls back reward, claim, reputation and receipt', async () => {
      await pool.query(`CREATE FUNCTION fail_guild_character() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late character save failure'; END; $$`);
      await pool.query('CREATE TRIGGER fail_guild_character BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION fail_guild_character()');
      const before = await game.load(a.id), commands = (await pool.query('SELECT count(*) FROM online_quest_commands')).rows[0].count;
      await assert.rejects(game.quest(a.id, randomUUID(), 'cemiterio-esquecido-collect', before.character.version, 'claim'));
      assert.deepEqual(await game.load(a.id), before);
      assert.equal((await pool.query('SELECT count(*) FROM online_quest_commands')).rows[0].count, commands);
      await pool.query('DROP TRIGGER fail_guild_character ON characters'); await pool.query('DROP FUNCTION fail_guild_character()');
    });
    await t.test('HTTP rejects foreign origins, unknown quests and client-controlled progress/rewards', async () => {
      const token = await auth.newSession(a.id), handler = createGameHandler({ auth, game, origin: 'https://game.example', production: false });
      async function request(body: unknown, extra: Record<string, string> = {}) {
        const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
        req.url = '/game/quests/claim'; req.method = 'POST'; req.headers = { 'content-type': 'application/json', origin: 'https://game.example', cookie: `drakoria_session=${token}`, ...extra };
        let status = 0; const response = { setHeader() {}, writeHead(code: number) { status = code; }, end() {} } as unknown as ServerResponse;
        await handler(req, response); return status;
      }
      const valid = { requestId: randomUUID(), questId: 'cemiterio-esquecido-collect', version: state.character.version };
      assert.equal(await request(valid, { cookie: '' }), 401); assert.equal(await request(valid, { origin: 'https://evil.example' }), 403);
      for (const field of ['accountId', 'count', 'status', 'claims', 'xp', 'gold', 'gear', 'rank', 'reputation']) assert.equal(await request({ ...valid, [field]: 999 }), 400);
      assert.equal(await request({ ...valid, questId: 'admin' }), 400);
      assert.equal(await request({ ...valid, version: '0' }), 409);
    });
  } finally { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
