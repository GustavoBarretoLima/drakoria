import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createDatabasePool, inTransaction } from "../src/database/pool.js";
import { migrateDatabase } from "../src/database/migrate.js";
import { CharacterRepository } from "../src/database/characterRepository.js";

// No skip: CI must supply a disposable PostgreSQL database, not production.
test("PostgreSQL migrations, account isolation, constraints and atomic item grants", async t => {
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL obrigatoria: use banco de teste separado.");
  const pool = createDatabasePool({ DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? "disable" });
  const schema = `test_${randomUUID().replaceAll("-", "")}`;
  // Isolate tables without dropping or truncating any pre-existing data.
  await pool.query(`CREATE SCHEMA ${schema}`);
  // Recreate pool clients so every connection receives the isolated search path.
  const scopedPool = createDatabasePool({ DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? "disable" });
  scopedPool.on("connect", client => { void client.query(`SET search_path TO ${schema}`); });
  const repo = new CharacterRepository(scopedPool);
  const hash = "scrypt$test-only-not-a-real-credential-hash";
  try {
    await t.test("concurrent migrators serialize and repeat cleanly", async () => {
      const results = await Promise.all([migrateDatabase(scopedPool), migrateDatabase(scopedPool)]);
      assert.equal(results.flat().length, 7);
      assert.deepEqual(await migrateDatabase(scopedPool), []);
    });
    const a = await repo.createAccountCharacter(" A@example.test ", hash, "Alice", "guerreiro");
    const b = await repo.createAccountCharacter("b@example.test", hash, "Bruno", "mago");
    await t.test("accounts are unique and reads do not return another account's character", async () => {
      assert.equal((await repo.getCharacterForAccount(a.accountId))?.id, a.characterId);
      assert.equal(await repo.getCharacterForAccount(randomUUID()), null);
      assert.notEqual((await repo.getCharacterForAccount(b.accountId))?.id, a.characterId);
      await assert.rejects(repo.createAccountCharacter("a@EXAMPLE.test", hash, "Copy", "guerreiro"));
    });
    await t.test("invalid character rolls back its new account", async () => {
      await assert.rejects(repo.createAccountCharacter("failed@example.test", hash, "", "guerreiro"));
      const count = await scopedPool.query("SELECT count(*) FROM accounts WHERE email = $1", ["failed@example.test"]);
      assert.equal(count.rows[0].count, "0");
    });
    await t.test("schema prevents invalid progress, missing owners and raw session tokens", async () => {
      await assert.rejects(scopedPool.query("UPDATE characters SET gold = -1 WHERE id = $1", [a.characterId]));
      await assert.rejects(scopedPool.query("UPDATE characters SET level = 101 WHERE id = $1", [a.characterId]));
      await assert.rejects(scopedPool.query("UPDATE characters SET xp = 9007199254740992 WHERE id = $1", [a.characterId]));
      await assert.rejects(scopedPool.query("INSERT INTO characters (account_id, name, hero_class) VALUES ($1, 'Ghost', 'mago')", [randomUUID()]));
      await assert.rejects(scopedPool.query("INSERT INTO account_sessions (account_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 day')", [a.accountId, Buffer.from("raw-token")]));
    });
    await t.test("concurrent retries grant exactly one copy and one event", async () => {
      const ids = await Promise.all(Array.from({ length: 5 }, () => repo.grantEquipment(a.accountId, a.characterId, "orc-iron-axe", "battle:1:drop:0")));
      assert.equal(new Set(ids).size, 1);
      assert.equal((await scopedPool.query("SELECT count(*) FROM equipment_instances")).rows[0].count, "1");
      assert.equal((await scopedPool.query("SELECT count(*) FROM equipment_events")).rows[0].count, "1");
      await assert.rejects(repo.grantEquipment(a.accountId, a.characterId, "orc-warlord-sword", "battle:1:drop:0"));
      await assert.rejects(repo.grantEquipment(b.accountId, a.characterId, "orc-iron-axe", "foreign"));
      await assert.rejects(repo.grantEquipment(a.accountId, a.characterId, "invented-item", "unknown"));
      await assert.rejects(scopedPool.query("DELETE FROM equipment_events"));
      await assert.rejects(scopedPool.query("UPDATE equipment_events SET operation_key = 'altered'"));
    });
    await t.test("failure rolls back work and releases the connection", async () => {
      await assert.rejects(inTransaction(scopedPool, async client => {
        await client.query("UPDATE characters SET gold = 10 WHERE id = $1", [a.characterId]);
        throw new Error("simulated failure");
      }));
      assert.equal((await repo.getCharacterForAccount(a.accountId))?.gold, "0");
    });
    await t.test("failure while recording the grant leaves no unaudited item", async () => {
      await scopedPool.query(`CREATE FUNCTION fail_grant_event() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'simulated audit failure'; END; $$`);
      await scopedPool.query("CREATE TRIGGER fail_event BEFORE INSERT ON equipment_events FOR EACH ROW EXECUTE FUNCTION fail_grant_event()");
      await assert.rejects(repo.grantEquipment(a.accountId, a.characterId, "orc-iron-axe", "audit-failure"));
      assert.equal((await scopedPool.query("SELECT count(*) FROM equipment_instances WHERE source_operation_key = 'audit-failure'")).rows[0].count, "0");
      await scopedPool.query("DROP TRIGGER fail_event ON equipment_events");
      await scopedPool.query("DROP FUNCTION fail_grant_event()");
    });
  } finally {
    await scopedPool.end();
    await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    await pool.end();
  }
});
