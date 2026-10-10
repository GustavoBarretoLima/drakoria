import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createDatabasePool } from "../src/database/pool.js";
import { migrateDatabase } from "../src/database/migrate.js";
import { AuthRepository } from "../src/auth/repository.js";
import { CharacterRepository } from "../src/database/characterRepository.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
import { tokenHash } from "../src/auth/security.js";
import { cookieName } from "../src/auth/security.js";
import { createAuthHandler } from "../src/auth/http.js";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";

test("PostgreSQL authentication persists secure sessions and isolates credentials/characters", async t => {
  if (!process.env.TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL obrigatoria.");
  const env = { DATABASE_URL: process.env.TEST_DATABASE_URL, DATABASE_SSL: process.env.DATABASE_SSL ?? "disable" };
  const admin = createDatabasePool(env), pool = createDatabasePool(env);
  const schema = `auth_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool.on("connect", client => { void client.query(`SET search_path TO ${schema}`); });
  const repo = new AuthRepository(pool), characters = new CharacterRepository(pool);
  try {
    await migrateDatabase(pool);
    const hash = await hashPassword("uma senha segura para testes");
    const a = await repo.createPasswordAccount("a@example.test", hash);
    const b = await repo.createPasswordAccount("b@example.test", hash);
    await t.test("password credentials and raw session tokens are never stored as plaintext", async () => {
      assert.equal(a.email_verified, false);
      assert.equal(await verifyPassword("uma senha segura para testes", (await repo.findPasswordAccount(a.email))!.password_hash), true);
      const token = await repo.newSession(a.id);
      const row = (await pool.query("SELECT token_hash FROM account_sessions WHERE account_id = $1", [a.id])).rows[0];
      assert.ok(row.token_hash.equals(tokenHash(token)));
      assert.equal((await repo.session(token))?.id, a.id);
      const rotated = await repo.newSession(a.id, token);
      assert.equal(await repo.session(token), null);
      assert.equal((await repo.session(rotated))?.id, a.id);
      await repo.revoke(rotated); assert.equal(await repo.session(rotated), null);
    });
    await t.test("expired sessions and blocked accounts cannot authenticate", async () => {
      const expired = await repo.newSession(a.id);
      await pool.query("UPDATE account_sessions SET created_at = now() - interval '2 days', expires_at = now() - interval '1 day' WHERE token_hash = $1", [tokenHash(expired)]);
      assert.equal(await repo.session(expired), null);
      const blocked = await repo.newSession(b.id);
      await pool.query("UPDATE accounts SET status = 'blocked' WHERE id = $1", [b.id]);
      assert.equal(await repo.session(blocked), null); await assert.rejects(repo.newSession(b.id));
      await pool.query("UPDATE accounts SET status = 'active' WHERE id = $1", [b.id]);
    });
    await t.test("Google identity uses subject and never auto-links matching emails", async () => {
      await assert.rejects(repo.googleAccount({ subject: "attacker", email: a.email }));
      const identities = await Promise.all(Array.from({ length: 5 }, () => repo.googleAccount({ subject: "subject-1", email: "google@gmail.com" })));
      assert.equal(new Set(identities.map(value => value.id)).size, 1);
      const google = identities[0]!;
      assert.equal(google.email_verified, true);
      assert.equal((await repo.findPasswordAccount(google.email))?.password_hash, null);
      assert.equal((await repo.googleAccount({ subject: "subject-1", email: "changed@gmail.com" })).id, google.id);
      await assert.rejects(repo.googleAccount({ subject: "subject-2", email: google.email }));
      await assert.rejects(pool.query("INSERT INTO accounts (email) VALUES ('no-credentials@example.test')"));
    });
    await t.test("characters are account-owned, unique and created with canonical initial progress", async () => {
      const results = await Promise.allSettled(Array.from({ length: 3 }, () => repo.createCharacter(a.id, "Taichou", "guerreiro")));
      assert.equal(results.filter(value => value.status === "fulfilled").length, 1);
      const character = await characters.getCharacterForAccount(a.id);
      assert.equal(character?.name, "Taichou"); assert.equal(character?.level, 1);
      assert.equal(character?.gold, "0"); assert.equal(character?.xp, "0");
      assert.equal(await characters.getCharacterForAccount(b.id), null);
      assert.equal((await pool.query("SELECT count(*) FROM equipment_instances")).rows[0].count, "0");
    });
    await t.test("Google nonces are one-use, bound to challenge tokens and expire", async () => {
      const challenge = await repo.challenge();
      assert.equal(await repo.consumeChallenge(challenge.token), challenge.nonce);
      assert.equal(await repo.consumeChallenge(challenge.token), null);
      const expired = await repo.challenge();
      await pool.query("UPDATE auth_google_challenges SET expires_at = now() - interval '1 second' WHERE token_hash = $1", [tokenHash(expired.token)]);
      assert.equal(await repo.consumeChallenge(expired.token), null);
    });
    await t.test("persistent rate limits serialize concurrent attempts and reset only after the window", async () => {
      const attempts = await Promise.all(Array.from({ length: 10 }, () => repo.consumeLimit("test-limit", 5, 900)));
      assert.equal(attempts.filter(Boolean).length, 5);
      assert.equal(await new AuthRepository(pool).consumeLimit("test-limit", 5, 900), false);
      await pool.query("UPDATE auth_rate_limits SET window_started = now() - interval '16 minutes'");
      assert.equal(await repo.consumeLimit("test-limit", 5, 900), true);
      await repo.cleanup();
    });
    await t.test("HTTP registration, failed login, character ownership, rotation and logout work together", async () => {
      const handler = createAuthHandler({ repo, characters, origin: "https://game.test", production: true });
      async function request(path: string, body?: unknown, cookie = "") {
        const incoming = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
        Object.assign(incoming, { url: path, method: body === undefined ? "GET" : "POST", headers: { origin: "https://game.test", cookie, "content-type": "application/json" } });
        let status = 0, output = "", setCookie = "";
        const response = { setHeader: (key: string, value: unknown) => { if (key === "Set-Cookie") setCookie = String(value); },
          writeHead: (code: number) => { status = code; }, end: (data: string) => { output = data; } } as unknown as ServerResponse;
        await handler(incoming, response);
        return { status, data: JSON.parse(output), cookie: setCookie.split(";")[0]! };
      }
      const body = { email: " Portal@Example.test ", password: "senha segura do portal de testes" };
      const registered = await request("/auth/register", body);
      assert.equal(registered.status, 200); assert.ok(registered.cookie.startsWith(`${cookieName(true)}=`));
      assert.equal((await request("/auth/login", { ...body, password: "senha errada de teste" })).status, 401);
      const session = await request("/auth/session", undefined, registered.cookie);
      assert.equal(session.data.account.email, "portal@example.test"); assert.equal(session.data.character, null);
      assert.equal((await request("/auth/character", { name: "Portal", heroClass: "mago", level: 100 }, registered.cookie)).status, 400);
      assert.equal((await request("/auth/character", { name: "Portal", heroClass: "mago" }, registered.cookie)).status, 201);
      const loggedIn = await request("/auth/login", body, registered.cookie);
      assert.equal(loggedIn.status, 200); assert.notEqual(loggedIn.cookie, registered.cookie);
      assert.equal((await request("/auth/session", undefined, registered.cookie)).status, 401);
      assert.equal((await request("/auth/session", undefined, loggedIn.cookie)).data.character.name, "Portal");
      assert.equal((await request("/auth/logout", {}, loggedIn.cookie)).status, 200);
      assert.equal((await request("/auth/session", undefined, loggedIn.cookie)).status, 401);
    });
  } finally { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); }
});
