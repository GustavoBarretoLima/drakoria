import assert from "node:assert/strict";
import { test } from "node:test";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { TokenPayload } from "google-auth-library";
import { hashPassword, validPassword, verifyPassword } from "../server/src/auth/password.js";
import { authOrigin, cookieName, makeCookie, newToken, readCookie, tokenHash } from "../server/src/auth/security.js";
import { validatedGoogleClaims } from "../server/src/auth/google.js";
import { createAuthHandler } from "../server/src/auth/http.js";
import type { AuthRepository } from "../server/src/auth/repository.js";
import type { CharacterRepository } from "../server/src/database/characterRepository.js";

test("passwords use random salts, bounded inputs and verified hashes", async () => {
  const password = "uma senha longa de teste";
  const a = await hashPassword(password), b = await hashPassword(password);
  assert.notEqual(a, b); assert.ok(!a.includes(password));
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("senha longa incorreta", a), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, "scrypt-v1$broken$broken"), false);
  for (const value of [null, "curta", "x".repeat(129)]) assert.equal(validPassword(value), false);
});

test("sessions use secure host cookies, reject duplicate cookies and hash random tokens", () => {
  const token = newToken(); assert.equal(token.length, 43); assert.notEqual(token, newToken());
  assert.equal(tokenHash(token).length, 32);
  const name = cookieName(true);
  assert.equal(name, "__Host-drakoria_session");
  const cookie = makeCookie(name, token, true, 60);
  for (const attribute of ["Secure", "HttpOnly", "SameSite=Lax", "Path=/"]) assert.ok(cookie.includes(attribute));
  assert.equal(readCookie(cookie, name), token);
  assert.equal(readCookie(`${name}=${token}; ${name}=${token}`, name), undefined);
  assert.equal(readCookie(`${name}=invented`, name), undefined);
  assert.throws(() => authOrigin({ NODE_ENV: "production", AUTH_PUBLIC_URL: "http://example.test" }));
  assert.throws(() => authOrigin({ NODE_ENV: "production", AUTH_PUBLIC_URL: "https://example.test/login" }));
});

test("Google claims require verified identity, authoritative email and matching nonce", () => {
  const nonce = newToken();
  const payload = { iss: "https://accounts.google.com", aud: "client", sub: "google-subject", email: "hero@gmail.com", email_verified: true, iat: 1, exp: 9, nonce };
  const validate = (value: unknown) => validatedGoogleClaims(value as TokenPayload, nonce);
  assert.deepEqual(validate(payload), { subject: payload.sub, email: payload.email });
  for (const patch of [{ email_verified: false }, { nonce: "different" }, { sub: "" }, { email: "hero@third-party.test" }]) {
    assert.throws(() => validate({ ...payload, ...patch }));
  }
  assert.deepEqual(validate({ ...payload, email: "hero@company.test", hd: "company.test" }), { subject: payload.sub, email: "hero@company.test" });
});

test("auth HTTP rejects CSRF, forged ownership and nonce replay; never returns tokens", async () => {
  const token = newToken(), challenge = newToken(), nonce = newToken();
  let nonceAvailable = true, verified = 0, revoked = "", createdOwner = "";
  const repo = {
    consumeLimit: async () => true,
    session: async (value: string) => value === token ? { id: "account-a", email: "hero@gmail.com", email_verified: true, status: "active" } : null,
    revoke: async (value: string) => { revoked = value; },
    consumeChallenge: async (value: string) => { if (value !== challenge || !nonceAvailable) return null; nonceAvailable = false; return nonce; },
    googleAccount: async () => ({ id: "google-account" }),
    newSession: async () => token,
    createCharacter: async (id: string, name: string, hero_class: string) => { createdOwner = id; return { name, hero_class, level: 1 }; },
  } as unknown as AuthRepository;
  const handler = createAuthHandler({ repo, characters: { getCharacterForAccount: async () => null } as unknown as CharacterRepository,
    production: true, origin: "https://game.test", googleClientId: "client",
    verifyGoogle: async (_credential, receivedNonce) => { verified++; assert.equal(receivedNonce, nonce); return { subject: "sub", email: "hero@gmail.com" }; },
  });
  async function invoke(path: string, body?: unknown, origin = "https://game.test", cookie = "") {
    const request = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
    Object.assign(request, { url: path, method: body === undefined ? "GET" : "POST", headers: { origin, cookie, "content-type": "application/json" } });
    const headers = new Map<string, unknown>(); let status = 0, output = "";
    const response = { setHeader: (key: string, value: unknown) => headers.set(key, value),
      writeHead: (code: number) => { status = code; }, end: (data: string) => { output = data; } } as unknown as ServerResponse;
    await handler(request, response); return { status, output, headers };
  }
  assert.equal((await invoke("/auth/logout", {}, "https://attacker.test")).status, 403);
  assert.equal((await invoke("/auth/logout", {}, "")).status, 403);
  assert.equal((await invoke("/auth/character", { name: "Taichou", heroClass: "guerreiro" })).status, 401);
  const sessionCookie = `${cookieName(true)}=${token}`;
  assert.equal((await invoke("/auth/character", { name: "Taichou", heroClass: "guerreiro", accountId: "account-b" }, undefined, sessionCookie)).status, 400);
  const created = await invoke("/auth/character", { name: "Taichou", heroClass: "guerreiro" }, undefined, sessionCookie);
  assert.equal(created.status, 201); assert.equal(createdOwner, "account-a"); assert.equal(JSON.parse(created.output).character.level, 1);
  const googleCookie = `${cookieName(true, true)}=${challenge}`;
  assert.equal((await invoke("/auth/google", { credential: "signed-token" })).status, 401);
  const result = await invoke("/auth/google", { credential: "signed-token" }, undefined, googleCookie);
  assert.equal(result.status, 200); assert.equal(result.output.includes(token), false);
  assert.ok(String(result.headers.get("Set-Cookie")).includes("HttpOnly"));
  assert.equal((await invoke("/auth/google", { credential: "signed-token" }, undefined, googleCookie)).status, 401);
  assert.equal(verified, 1);
  assert.equal((await invoke("/auth/logout", {}, undefined, sessionCookie)).status, 200); assert.equal(revoked, token);
  assert.equal((await invoke("/auth/register", { email: "bad", password: "short" })).status, 400);
  assert.equal((await invoke("/auth/register", { email: "a@b.test", password: "x".repeat(17000) })).status, 413);
});
