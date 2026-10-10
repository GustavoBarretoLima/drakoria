import { createDatabasePool } from "./pool.js";
import { migrateDatabase } from "./migrate.js";

let pool;
try {
  pool = createDatabasePool();
  const applied = await migrateDatabase(pool);
  console.log(applied.length ? `Migracoes aplicadas: ${applied.join(", ")}` : "Banco atualizado.");
} catch {
  // Driver errors can include connection details. Do not log URLs/passwords.
  console.error("Falha na migracao. Confira configuracao, acesso ao banco e versoes das migracoes.");
  process.exitCode = 1;
} finally {
  await pool?.end();
}
