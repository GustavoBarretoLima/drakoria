import type { Pool } from "pg";
import { inTransaction } from "../database/pool.js";
import { AuthError, newToken, tokenHash } from "./security.js";
import type { GoogleIdentity } from "./google.js";
import type { HeroClass } from "../../../shared/src/types/combat.js";

export interface Account { id: string; email: string; email_verified: boolean; status: string; }
export class AuthRepository {
  constructor(private readonly pool: Pool) {}
  async consumeLimit(key: string, limit: number, seconds: number): Promise<boolean> {
    const result = await this.pool.query<{ attempts: number }>(`INSERT INTO auth_rate_limits (key_hash) VALUES ($1)
      ON CONFLICT (key_hash) DO UPDATE SET
        attempts = CASE WHEN auth_rate_limits.window_started <= now() - $2 * interval '1 second' THEN 1 ELSE auth_rate_limits.attempts + 1 END,
        window_started = CASE WHEN auth_rate_limits.window_started <= now() - $2 * interval '1 second' THEN now() ELSE auth_rate_limits.window_started END
      RETURNING attempts`, [tokenHash(key), seconds]);
    return result.rows[0]!.attempts <= limit;
  }
  async createPasswordAccount(email: string, passwordHash: string): Promise<Account> {
    const result = await this.pool.query<Account>(`INSERT INTO accounts (email, password_hash) VALUES ($1, $2)
      RETURNING id, email, email_verified, status`, [email, passwordHash]);
    return result.rows[0]!;
  }
  async findPasswordAccount(email: string) {
    const result = await this.pool.query<Account & { password_hash: string | null }>(
      "SELECT id, email, email_verified, status, password_hash FROM accounts WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  }
  async googleAccount(identity: GoogleIdentity): Promise<Account> {
    return inTransaction(this.pool, async client => {
      // Serialize retries by Google subject; never link identities by email alone.
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`google:${identity.subject}`]);
      const previous = await client.query<Account>("SELECT id, email, email_verified, status FROM accounts WHERE google_subject = $1", [identity.subject]);
      if (previous.rows[0]) return previous.rows[0];
      const conflict = await client.query("SELECT id FROM accounts WHERE email = $1", [identity.email]);
      if (conflict.rowCount) throw new AuthError(409, "Não foi possível criar a conta com Google. Tente seu login por email.");
      const result = await client.query<Account>(`INSERT INTO accounts (email, google_subject, email_verified)
        VALUES ($1, $2, true) RETURNING id, email, email_verified, status`, [identity.email, identity.subject]);
      return result.rows[0]!;
    });
  }
  async newSession(accountId: string, previousToken?: string): Promise<string> {
    const token = newToken();
    await inTransaction(this.pool, async client => {
      // Account status and session creation are checked atomically.
      const active = await client.query("SELECT id FROM accounts WHERE id = $1 AND status = 'active' FOR UPDATE", [accountId]);
      if (!active.rowCount) throw new AuthError(401, "Login inválido.");
      if (previousToken) await client.query("UPDATE account_sessions SET revoked_at = now() WHERE token_hash = $1", [tokenHash(previousToken)]);
      await client.query("INSERT INTO account_sessions (account_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')", [accountId, tokenHash(token)]);
    });
    return token;
  }
  async session(token: string): Promise<Account | null> {
    const result = await this.pool.query<Account>(`SELECT a.id, a.email, a.email_verified, a.status FROM account_sessions s
      JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = $1 AND s.revoked_at IS NULL
      AND s.expires_at > now() AND a.status = 'active'`, [tokenHash(token)]);
    return result.rows[0] ?? null;
  }
  async revoke(token: string): Promise<void> {
    await this.pool.query("UPDATE account_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [tokenHash(token)]);
  }
  async challenge() {
    const token = newToken(), nonce = newToken();
    await this.pool.query("INSERT INTO auth_google_challenges (token_hash, nonce) VALUES ($1, $2)", [tokenHash(token), nonce]);
    return { token, nonce };
  }
  async consumeChallenge(token: string): Promise<string | null> {
    const result = await this.pool.query<{ nonce: string }>("DELETE FROM auth_google_challenges WHERE token_hash = $1 AND expires_at > now() RETURNING nonce", [tokenHash(token)]);
    return result.rows[0]?.nonce ?? null;
  }
  async createCharacter(accountId: string, name: string, heroClass: HeroClass) {
    // No level, gold, equipment, ownership or account ID accepted from the browser.
    return inTransaction(this.pool, async client => {
      const active = await client.query("SELECT id FROM accounts WHERE id = $1 AND status = 'active' FOR UPDATE", [accountId]);
      if (!active.rowCount) throw new AuthError(401, "Entre novamente.");
      const result = await client.query("INSERT INTO characters (account_id, name, hero_class) VALUES ($1, $2, $3) RETURNING id, name, hero_class, level, xp, gold", [accountId, name, heroClass]);
      return result.rows[0];
    });
  }
  async cleanup(): Promise<void> {
    await this.pool.query("DELETE FROM auth_google_challenges WHERE expires_at <= now()");
    await this.pool.query("DELETE FROM auth_rate_limits WHERE window_started < now() - interval '1 day'");
    await this.pool.query("DELETE FROM account_sessions WHERE expires_at < now() - interval '7 days' OR revoked_at < now() - interval '7 days'");
  }
}
