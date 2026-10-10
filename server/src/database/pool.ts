import { Pool, type PoolClient } from "pg";
import { readFileSync } from "node:fs";

export function createDatabasePool(env: NodeJS.ProcessEnv = process.env): Pool {
  if (!env.DATABASE_URL) throw new Error("Configure DATABASE_URL para usar o banco.");
  const url = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL deve usar PostgreSQL.");
  // URL SSL parameters override pg's ssl object. Keep one explicit source.
  for (const key of url.searchParams.keys()) {
    if (key.toLowerCase().startsWith("ssl") || key.toLowerCase() === "uselibpqcompat") {
      throw new Error("Configure TLS com DATABASE_SSL e DATABASE_SSL_CA_FILE, fora da URL.");
    }
  }
  const mode = env.DATABASE_SSL ?? (env.NODE_ENV === "production" ? "verify-full" : "disable");
  if (mode !== "disable" && mode !== "verify-full") throw new Error("DATABASE_SSL invalido.");
  if (env.NODE_ENV === "production" && mode === "disable") throw new Error("TLS verificado e obrigatorio em producao.");
  const pool = new Pool({
    connectionString: url.toString(),
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    ssl: mode === "disable" ? false : {
      rejectUnauthorized: true,
      ...(env.DATABASE_SSL_CA_FILE ? { ca: readFileSync(env.DATABASE_SSL_CA_FILE, "utf8") } : {}),
    },
  });
  pool.on("error", () => console.error("Conexao ociosa do banco foi encerrada."));
  return pool;
}

export async function inTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let releaseError: Error | undefined;
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {
      releaseError = new Error("Falha ao reverter transacao; descarte a conexao.");
    }
    throw error;
  } finally {
    client.release(releaseError);
  }
}
