import { createHash, randomBytes } from "node:crypto";

export const newToken = () => randomBytes(32).toString("base64url");
export const tokenHash = (value: string) => createHash("sha256").update(value).digest();
export const validToken = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function authOrigin(env: NodeJS.ProcessEnv): string {
  const value = env.AUTH_PUBLIC_URL ?? env.RENDER_EXTERNAL_URL ?? (env.NODE_ENV === "production" ? "" : `http://localhost:${env.PORT ?? 3001}`);
  const url = new URL(value);
  if (url.origin !== value || (env.NODE_ENV === "production" ? url.protocol !== "https:" : !["http:", "https:"].includes(url.protocol))) {
    throw new Error("Configure AUTH_PUBLIC_URL com a origem exata do backend.");
  }
  return value;
}
export function cookieName(production: boolean, challenge = false): string {
  return `${production ? "__Host-" : ""}drakoria_${challenge ? "google" : "session"}`;
}
export function makeCookie(name: string, token: string, production: boolean, maxAge: number): string {
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${production ? "; Secure" : ""}`;
}
export function readCookie(raw: string | undefined, name: string): string | undefined {
  const values = (raw ?? "").split(";").map(value => value.trim()).filter(value => value.startsWith(`${name}=`));
  if (values.length !== 1) return undefined;
  const token = values[0]!.slice(name.length + 1);
  return validToken(token) ? token : undefined;
}
export class AuthError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
