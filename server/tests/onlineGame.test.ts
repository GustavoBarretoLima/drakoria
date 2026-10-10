import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createDatabasePool } from '../src/database/pool.js';
import { migrateDatabase } from '../src/database/migrate.js';
import { AuthRepository } from '../src/auth/repository.js';
import { GameRepository } from '../src/game/repository.js';
import { createInitialBattleState } from '../src/modules/combat/battleRoom.js';
import { readyForHero } from '../src/game/rules.js';
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
    const start = async (accountId: string, requestId: string) => {
      const current = await game.load(accountId);
      return game.start(accountId, requestId, 'cemiterio-esquecido', current.character.version, current.expedition?.status === 'active' ? current.expedition.id : undefined);
    };
    await t.test('account snapshot has canonical progress and no name privileges', async () => {
      assert.equal(state.character.level, 1); assert.equal(state.character.gold, 0);
      assert.equal(state.inventory.length, 0); assert.equal(state.battle, null);
      assert.notEqual((await game.load(b.id)).character.id, state.character.id);
    });
    await t.test('concurrent starts and response retries resume a single saved battle', async () => {
      const requestId = randomUUID();
      const results = await Promise.all(Array.from({ length: 5 }, () => game.start(a.id, requestId, 'cemiterio-esquecido', state.character.version)));
      assert.equal(new Set(results.map(result => result.battle!.id)).size, 1);
      state = results[0]!;
      assert.equal((await start(a.id, randomUUID())).battle!.id, state.battle!.id);
      assert.equal((await pool.query('SELECT count(*) FROM online_battles')).rows[0].count, '1');
      assert.equal(state.battle!.state.hero.name, 'Taichou'); assert.equal(state.battle!.state.hero.level, 1);
      assert.equal(state.battle!.state.rewards, undefined);
      const reloaded = await new GameRepository(pool).load(a.id);
      assert.deepEqual(reloaded, state);
      await assert.rejects(game.camp(a.id, state.character.version));
      await assert.rejects(game.retreat(a.id, state.character.version, state.expedition!.id));
      assert.equal(state.expedition!.state.victories, 0);
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
      fixture.rewards = { xp: 115, gold: 8, drops: [{ item: { id: 'goblin-tooth-ring', name: 'Anel', rarity: 'common', level: 1 }, quantity: 1 }], classBooks: [] };
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [state.battle!.id, JSON.stringify(fixture)]);
      const old = state.battle!;
      const results = await Promise.allSettled(Array.from({ length: 4 }, () => game.action(a.id, old.id, old.revision, { type: 'ATTACK' })));
      assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
      state = await game.load(a.id);
      assert.equal(state.character.level, 2); assert.equal(state.character.xp, 15); assert.equal(state.character.gold, 8);
      assert.equal(state.inventory.length, 1); assert.equal(state.battle!.state.finished, true);
      assert.equal(state.expedition!.state.victories, 1);
      assert.equal(state.expedition!.state.expedition!.xp, 115);
      assert.equal(state.expedition!.state.expedition!.battles.length, 1);
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
    await t.test('saved depth selects regional encounters, prepares the boss, and concludes once', async () => {
      const finish = async () => {
        const fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [state.battle!.id])).rows[0].state;
        fixture.enemy.stats.hp = 1; fixture.enemy.stats.dodgeChance = 0;
        fixture.hero.stats.attack = 99999; fixture.hero.stats.criticalChance = 0;
        fixture.rewards = { xp: 1, gold: 1, drops: [], classBooks: [] };
        await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [state.battle!.id, JSON.stringify(fixture)]);
        state = await game.action(a.id, state.battle!.id, state.battle!.revision, { type: 'ATTACK' });
      };
      for (let victories = 1; victories < 5; victories++) {
        const before = state.character.version;
        await assert.rejects(game.start(a.id, randomUUID(), 'cemiterio-esquecido', '0', state.expedition!.id));
        await assert.rejects(game.start(a.id, randomUUID(), 'pantano-corrompido', before, state.expedition!.id));
        state = await start(a.id, randomUUID());
        assert.match(state.battle!.state.enemy.id, /^(skeleton-warrior|cemetery-specter)-normal-lvl-/);
        await finish(); assert.equal(state.expedition!.state.victories, victories + 1);
        state = await game.camp(a.id, state.character.version);
      }
      assert.equal(state.expedition!.state.bossPending, true);
      const runId = state.expedition!.id, requestId = randomUUID(), oldVersion = state.character.version;
      state = await start(a.id, requestId);
      assert.equal(state.battle!.state.enemy.id, 'cursed-gravedigger-boss-lvl-15');
      await finish();
      assert.equal(state.expedition!.status, 'completed'); assert.equal(state.expedition!.state.victories, 6);
      const complete = state;
      assert.deepEqual(await game.start(a.id, requestId, 'cemiterio-esquecido', oldVersion, runId), complete);
      await assert.rejects(game.start(a.id, randomUUID(), 'cemiterio-esquecido', state.character.version, runId));
      state = await game.camp(a.id, state.character.version);
      // Access rules are the original map rules: no new character-level gate.
      state = await game.start(a.id, randomUUID(), 'fortaleza-rei-orc', state.character.version);
      assert.match(state.battle!.state.enemy.id, /^hobgoblin-(normal|elite)-lvl-(35|36|37)$/);
      if (!state.battle!.state.finished) await finish();
      const run = state.expedition!;
      if (run.status === 'active') {
        const before = state.character.stats.hp;
        await assert.rejects(game.retreat(b.id, (await game.load(b.id)).character.version, run.id));
        state = await game.retreat(a.id, state.character.version, run.id);
        assert.equal(state.expedition!.status, 'retreated'); assert.equal(state.character.stats.hp, before);
      }
      state = await game.camp(a.id, state.character.version);
    });
    await t.test('an audit failure rolls back the final turn, gold and every equipment copy', async () => {
      state = await start(a.id, randomUUID());
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
      // This failure occurs after expedition and character writes, proving their rollback too.
      await pool.query(`CREATE FUNCTION fail_battle_save() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'battle save failure'; END; $$`);
      await pool.query('CREATE TRIGGER fail_battle_save BEFORE UPDATE ON online_battles FOR EACH ROW EXECUTE FUNCTION fail_battle_save()');
      await assert.rejects(game.action(a.id, state.battle!.id, state.battle!.revision, { type: 'ATTACK' }));
      assert.deepEqual(await game.load(a.id), before);
      await pool.query('DROP TRIGGER fail_battle_save ON online_battles');
      await pool.query('DROP FUNCTION fail_battle_save()');
    });
    await t.test('legacy battles remain playable; defeat closes a regional run without rewards', async () => {
      const c = await auth.createPasswordAccount('legacy@example.test', 'c'.repeat(64));
      await auth.createCharacter(c.id, 'Legacy', 'guerreiro');
      let saved = await game.load(c.id);
      const old = createInitialBattleState('guerreiro'); old.id = randomUUID(); old.hero.id = saved.character.id;
      old.enemy.stats.hp = 1; old.enemy.stats.dodgeChance = 0; old.rewards = { xp: 1, gold: 1, drops: [], classBooks: [] };
      const messages: string[] = []; const battle = readyForHero(old, messages);
      await pool.query('INSERT INTO online_battles (id, character_id, start_request_id, state) VALUES ($1, $2, $3, $4)', [old.id, saved.character.id, randomUUID(), JSON.stringify(battle)]);
      saved = await game.load(c.id); assert.equal(saved.expedition, null); assert.equal(saved.battle!.regionId, null);
      saved = await game.action(c.id, old.id, 0, { type: 'ATTACK' });
      assert.equal(saved.battle!.state.finished, true); assert.equal(saved.expedition, null);
      saved = await game.camp(c.id, saved.character.version);
      saved = await game.start(c.id, randomUUID(), 'cemiterio-esquecido', saved.character.version);
      await assert.rejects(pool.query('UPDATE online_battles SET expedition_id = $2 WHERE id = $1', [state.battle!.id, saved.expedition!.id]));
      const fixture = (await pool.query('SELECT state FROM online_battles WHERE id = $1', [saved.battle!.id])).rows[0].state;
      fixture.hero.stats.hp = 1; fixture.hero.stats.defense = 0; fixture.hero.stats.dodgeChance = 0;
      fixture.enemy.stats.attack = 99999; fixture.enemy.atb = 99;
      await pool.query('UPDATE online_battles SET state = $2 WHERE id = $1', [saved.battle!.id, JSON.stringify(fixture)]);
      const gold = saved.character.gold, xp = saved.character.xp;
      saved = await game.action(c.id, saved.battle!.id, saved.battle!.revision, { type: 'DEFEND' });
      assert.equal(saved.expedition!.status, 'defeated'); assert.equal(saved.expedition!.state.victories, 0);
      assert.equal(saved.character.gold, gold); assert.equal(saved.character.xp, xp); assert.equal(saved.character.stats.hp, 0);
      await assert.rejects(game.start(c.id, randomUUID(), 'cemiterio-esquecido', saved.character.version));
      assert.deepEqual(await new GameRepository(pool).load(c.id), saved);
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
        assert.equal((await request('/game/start', { requestId: randomUUID(), regionId: 'cemiterio-esquecido', version: state.character.version, [field]: 999 })).status, 400);
      }
      assert.equal((await request('/game/start', { requestId: randomUUID(), regionId: '__proto__', version: state.character.version })).status, 400);
      assert.equal((await request('/game/retreat', { version: state.character.version, expeditionId: randomUUID(), gold: 999 })).status, 400);
      assert.equal((await request('/game/action', { battleId: state.battle!.id, revision: state.battle!.revision, action: { type: 'ATTACK', damage: 9999 } })).status, 400);
      assert.equal((await request('/game/state')).data.character.id, state.character.id);
      await auth.revoke(token);
      assert.equal((await request('/game/state')).status, 401);
      await pool.query("UPDATE accounts SET status = 'blocked' WHERE id = $1", [a.id]);
      await assert.rejects(game.load(a.id));
    });
  } finally { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
