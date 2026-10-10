import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 32, options, (error, key) => error ? reject(error) : resolve(key));
  });
}
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && [...value].length >= 12 && [...value].length <= 128 && Buffer.byteLength(value) <= 512;
}
export async function hashPassword(password: string): Promise<string> {
  if (!validPassword(password)) throw new Error("Senha deve ter de 12 a 128 caracteres.");
  const salt = randomBytes(16);
  return `scrypt-v1$${salt.toString("hex")}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string | null): Promise<boolean> {
  const match = encoded?.match(/^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{64})$/);
  // Unknown users and Google-only users pay the same KDF cost.
  const salt = match ? Buffer.from(match[1]!, "hex") : Buffer.alloc(16);
  const candidate = await derive(password, salt);
  return !!match && timingSafeEqual(candidate, Buffer.from(match[2]!, "hex"));
}
