import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";
import { inTransaction } from "./pool.js";

const migrationsDirectory = new URL("../../migrations/", import.meta.url);

export async function migrateDatabase(pool: Pool): Promise<string[]> {
  const files = (await readdir(migrationsDirectory)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  return inTransaction(pool, async client => {
    // Serialize concurrent migrators before inspecting or creating the ledger.
    await client.query("SELECT pg_advisory_xact_lock(74192031)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = await client.query<{ name: string; checksum: string }>("SELECT name, checksum FROM schema_migrations");
    const existing = new Map(applied.rows.map(row => [row.name, row.checksum]));
    if ([...existing.keys()].some(name => !files.includes(name))) throw new Error("Migration aplicada ausente no codigo.");
    const added: string[] = [];
    for (const name of files) {
      const sql = await readFile(fileURLToPath(new URL(name, migrationsDirectory)), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      if (existing.has(name)) {
        if (existing.get(name) !== checksum) throw new Error(`Migration aplicada foi modificada: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
      added.push(name);
    }
    return added;
  });
}
