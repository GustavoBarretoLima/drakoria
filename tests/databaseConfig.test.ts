import assert from "node:assert/strict";
import { test } from "node:test";
import { createDatabasePool } from "../server/src/database/pool.js";

test("database config refuses missing URLs and insecure production TLS", () => {
  assert.throws(() => createDatabasePool({}));
  assert.throws(() => createDatabasePool({ DATABASE_URL: "mysql://localhost/game" }));
  assert.throws(() => createDatabasePool({ DATABASE_URL: "postgresql://localhost/game", NODE_ENV: "production", DATABASE_SSL: "disable" }));
  assert.throws(() => createDatabasePool({ DATABASE_URL: "postgresql://localhost/game?sslmode=no-verify" }));
  assert.throws(() => createDatabasePool({ DATABASE_URL: "postgresql://localhost/game?ssl=0", NODE_ENV: "production" }));
  assert.throws(() => createDatabasePool({ DATABASE_URL: "postgresql://localhost/game", DATABASE_SSL: "no-verify" }));
});

test("database config uses verified TLS in production and explicit local development", async () => {
  const production = createDatabasePool({ DATABASE_URL: "postgresql://localhost/game", NODE_ENV: "production" });
  const local = createDatabasePool({ DATABASE_URL: "postgresql://localhost/game", DATABASE_SSL: "disable" });
  assert.deepEqual(production.options.ssl, { rejectUnauthorized: true });
  assert.equal(local.options.ssl, false);
  await Promise.all([production.end(), local.end()]);
});
