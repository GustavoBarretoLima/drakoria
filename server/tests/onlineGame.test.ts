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
import { CharacterRepository } from '../src/database/characterRepository.js';

// A disposable, isolated real PostgreSQL schema; never staging data.
test('online game persists battles and grants rewards atomically by account', async t => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL obrigatoria.');
  const env = { DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? 'disable' };
  const admin = createDatabasePool(env), pool = createDatabasePool(env);
  const schema = `game_${randomUUID().replaceAll('-', '')}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool.on('connect', client => { void client.query(`SET search_path TO ${schema}`); });
  const auth = new AuthRepository(pool), game = new GameRepository(pool), characters = new CharacterRepository(pool);
  try {
    await migrateDatabase(pool);
    const a = await auth.createPasswordAccount('a@example.test', 'a'.repeat(64));
    const b = await auth.createPasswordAccount('b@example.test', 'b'.repeat(64));
    await auth.createCharacter(a.id, 'Taichou', 'guerreiro'); await auth.createCharacter(b.id, 'Bruno', 'mago');
    const token = await auth.newSession(a.id);
    let state = await game.load(a.id);
    await t.test('account snapshot has canonical progress and no name privileges', async () => {
      assert.equal(state.character.level, 1); assert.equal(state.character.gold, 0);
      assert.equal(state.inventory.length, 0); assert.equal(state.battle, null);
      assert.notEqual((await game.load(b.id)).character.id, state.character.id);
    });
    await t.test('concurrent starts and response retries resume a single saved battle', async () => {
      const requestId = randomUUID();
      const results = await Promise.all(Array.from({ length: 5 }, () => game.start(a.id, requestId)));
      assert.equal(new Set(results.map(result => result.battle!.id)).size, 1);
      state = results[0]!;
      assert.equal((await game.start(a.id, randomUUID())).battle!.id, state.battle!.id);
      assert.equal((await pool.query('SELECT count(*) FROM online_battles')).rows[0].count, '1');
      assert.equal(state.battle!.state.hero.name, 'Taichou'); assert.equal(state.battle!.state.hero.level, 1);
      assert.equal(state.battle!.state.rewards, undefined);
      const reloaded = await new GameRepository(pool).load(a.id);
      assert.deepEqual(reloaded, state);
      await assert.rejects(game.camp(a.id, state.character.version));
      await assert.rejects(game.action(b.id, state.battle!.id, 0, { type: 'ATTACK' }));
    });
    await t.test('duplicate actions accept only one revision and persist damage/resources', async () => {
      const battle = state.battle!;
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => game.action(a.id, battle.id, battle.revision, { type: 'ATTACK' })));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      state = (results.find(result => result.status === 'fulfilled') as PromiseFulfilledResult<typeof state>).value;
      assert.equal(state.battle!.revision, 1);
      assert.equal((await game.load(a.id)).battle!.state.enemy.stats.hp, state.battle!.state.enemy.stats.hp);
    });
    await t.test('a final turn commits XP, gold, each item and audit together, once', async () => {
      // Make a deterministic near-victory fixture on the trusted side of the boundary.
      const fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [state.battle!.id])).rows[0].state;
      fixture.enemy.stats.hp = 1; fixture.hero.stats.criticalChance = 0; fixture.enemy.stats.dodgeChance = 0;
      fixture.rewards = { xp: 115, gold: 8, drops: [{ item: { id: 'goblin-tooth-ring' }, quantity: 1 }], classBooks: [] };
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [state.battle!.id, JSON.stringify(fixture)]);
      const old = state.battle!;
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => game.action(a.id, old.id, old.revision, { type: 'ATTACK' })));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      state = await game.load(a.id);
      assert.equal(state.character.level, 2); assert.equal(state.character.xp, 15); assert.equal(state.character.gold, 8);
      assert.equal(state.inventory.length, 1); assert.equal(state.battle!.state.finished, true);
      assert.equal((await pool.query('SELECT count(*) FROM equipment_events')).rows[0].count, '1');
      await assert.rejects(game.action(a.id, old.id, state.battle!.revision, { type: 'ATTACK' }));
      assert.deepEqual(await new GameRepository(pool).load(a.id), state);
    });
    await t.test('rest and equip require current version and item ownership', async () => {
      const oldVersion = state.character.version;
      state = await game.camp(a.id, oldVersion);
      assert.equal(state.character.stats.hp, state.character.stats.maxHp);
      await assert.rejects(game.camp(a.id, oldVersion));
      const instance = state.inventory[0]!.instanceId;
      const beforeMana = state.character.stats.maxMana;
      state = await game.camp(a.id, state.character.version, instance);
      assert.equal(state.inventory[0]!.equipped, true);
      assert.equal(state.character.stats.maxMana, beforeMana + 4);
      await assert.rejects(game.camp(b.id, (await game.load(b.id)).character.version, instance));
      const foreignClass = await characters.grantEquipment(a.id, state.character.id, 'orc-warlord-staff', 'test:staff');
      await assert.rejects(game.camp(a.id, state.character.version, foreignClass));
    });
    await t.test('an audit failure rolls back the final turn, gold and every equipment copy', async () => {
      state = await game.start(a.id, randomUUID());
      const fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [state.battle!.id])).rows[0].state;
      fixture.enemy.stats.hp = 1; fixture.enemy.stats.dodgeChance = 0;
      fixture.rewards = { xp: 15, gold: 8, drops: [{ item: { id: 'goblin-tooth-ring' }, quantity: 1 }], classBooks: [] };
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [state.battle!.id, JSON.stringify(fixture)]);
      await pool.query(`CREATE FUNCTION fail_game_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit failure'; END; $$`);
      await pool.query('CREATE TRIGGER fail_game_event BEFORE INSERT ON equipment_events FOR EACH ROW EXECUTE FUNCTION fail_game_event()');
      const before = await game.load(a.id);
      await assert.rejects(game.action(a.id, state.battle!.id, state.battle!.revision, { type: 'ATTACK' }));
      assert.deepEqual(await game.load(a.id), before);
      await pool.query('DROP TRIGGER fail_game_event ON equipment_events');
      await pool.query('DROP FUNCTION fail_game_event()');
    });
    await t.test('HTTP rejects unauthenticated, cross-origin and forged account/progress requests', async () => {
      const handler = createGameHandler({ auth, game, origin: 'https://game.example', production: false });
      const request = async (path: string, body?: unknown, headers: Record<string, string> = {}) => {
        const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
        req.url = path; req.method = body === undefined ? 'GET' : 'POST';
        req.headers = { 'content-type': 'application/json', origin: 'https://game.example', cookie: `drakoria_session=${token}`, ...headers };
        let status = 0, output = '';
        const res = { setHeader() {}, writeHead(code: number) { status = code; }, end(data: string) { output = String(data); } } as unknown as ServerResponse;
        assert.equal(await handler(req, res), true);
        return { status, data: JSON.parse(output) };
      };
      assert.equal((await request('/game/state', undefined, { cookie: '' })).status, 401);
      assert.equal((await request('/game/start', { requestId: randomUUID() }, { origin: 'https://evil.example' })).status, 403);
      for (const field of ['accountId', 'heroLevel', 'gold', 'equippedItemIds', 'monsterId', 'currentHp']) {
        assert.equal((await request('/game/start', { requestId: randomUUID(), [field]: 999 })).status, 400);
      }
      assert.equal((await request('/game/action', { battleId: state.battle!.id, revision: state.battle!.revision, action: { type: 'ATTACK', damage: 9999 } })).status, 400);
      assert.equal((await request('/game/state')).data.character.id, state.character.id);
      await auth.revoke(token);
      assert.equal((await request('/game/state')).status, 401);
      await pool.query("UPDATE accounts SET status = 'blocked' WHERE id = $1", [a.id]);
      await assert.rejects(game.load(a.id));
    });
  } finally { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
