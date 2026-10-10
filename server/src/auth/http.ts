import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { AuthRepository } from "./repository.js";
import { CharacterRepository } from "../database/characterRepository.js";
import { AuthError, cookieName, makeCookie, normalizeEmail, readCookie } from "./security.js";
import { hashPassword, validPassword, verifyPassword } from "./password.js";
import type { GoogleIdentity } from "./google.js";

interface Dependencies {
  repo: AuthRepository;
  characters: CharacterRepository;
  origin: string;
  production: boolean;
  googleClientId?: string;
  verifyGoogle?: (credential: string, nonce: string) => Promise<GoogleIdentity>;
}
const publicFiles = new Map([
  ["/login", ["login.html", "text/html; charset=utf-8"]],
  ["/account.js", ["account.js", "text/javascript; charset=utf-8"]],
  ["/account.css", ["account.css", "text/css; charset=utf-8"]],
]);

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
export async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers["content-type"] ?? "")) throw new AuthError(415, "Envie JSON.");
  if (Number(request.headers["content-length"] ?? 0) > 16384) throw new AuthError(413, "Solicitação muito grande.");
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    const finish = (error?: Error, value?: Record<string, unknown>) => {
      clearTimeout(timer);
      request.off("data", data); request.off("end", end); request.off("error", fail); request.off("aborted", aborted);
      if (error) { request.resume(); reject(error); } else resolve(value!);
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > 16384) finish(new AuthError(413, "Solicitação muito grande.")); else chunks.push(chunk);
    };
    const end = () => {
      try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        finish(undefined, parsed as Record<string, unknown>);
      } catch { finish(new AuthError(400, "JSON inválido.")); }
    };
    const fail = () => finish(new AuthError(400, "Solicitação interrompida."));
    const aborted = () => fail();
    const timer = setTimeout(() => finish(new AuthError(408, "Solicitação demorou demais.")), 10000);
    timer.unref();
    request.on("data", data); request.once("end", end); request.once("error", fail); request.once("aborted", aborted);
  });
}
function fields(body: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new AuthError(400, "Campos inválidos.");
}
function credentials(body: Record<string, unknown>) {
  fields(body, ["email", "password"]);
  const email = normalizeEmail(body.email);
  if (!email || !validPassword(body.password)) throw new AuthError(400, "Informe email válido e senha de 12 a 128 caracteres.");
  return { email, password: body.password };
}
export function createAuthHandler(deps: Dependencies) {
  const sessionName = cookieName(deps.production), challengeName = cookieName(deps.production, true);
  let active = 0;
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    const path = request.url ?? "";
    if (!publicFiles.has(path) && !path.startsWith("/auth/")) return false;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' https://accounts.google.com/gsi/style; frame-src https://accounts.google.com; connect-src 'self' https://accounts.google.com; img-src 'self' data: https://*.googleusercontent.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    let acquired = false;
    try {
      if (publicFiles.has(path)) {
        if (request.method !== "GET") throw new AuthError(405, "Método inválido.");
        const [file, type] = publicFiles.get(path)!;
        const data = await readFile(new URL(`../../public/${file}`, import.meta.url));
        response.writeHead(200, { "Content-Type": type! }); response.end(data); return true;
      }
      if (request.method === "GET" && path === "/auth/config") {
        send(response, 200, { googleClientId: deps.googleClientId ?? null }); return true;
      }
      const token = readCookie(request.headers.cookie, sessionName);
      if (request.method === "GET" && path === "/auth/session") {
        const account = token ? await deps.repo.session(token) : null;
        if (!account) throw new AuthError(401, "Entre para acessar sua conta.");
        const character = await deps.characters.getCharacterForAccount(account.id);
        send(response, 200, { account: { id: account.id, email: account.email, emailVerified: account.email_verified }, character }); return true;
      }
      if (request.method !== "POST") throw new AuthError(404, "Rota não encontrada.");
      // Same-origin UI and JSON-only POSTs prevent login CSRF without cross-site cookies.
      if (request.headers.origin !== deps.origin) throw new AuthError(403, "Origem inválida.");
      if (active >= 2) throw new AuthError(429, "Muitas solicitações. Tente novamente em instantes.");
      active++; acquired = true;
      if (!await deps.repo.consumeLimit("auth:global", 60, 60)) throw new AuthError(429, "Muitas solicitações. Aguarde um minuto.");
      const body = await readJson(request);
      const establish = async (accountId: string) => {
        const fresh = await deps.repo.newSession(accountId, token);
        const cookie = makeCookie(sessionName, fresh, deps.production, 7 * 86400);
        response.setHeader("Set-Cookie", path === "/auth/google" ? [makeCookie(challengeName, "", deps.production, 0), cookie] : cookie);
        send(response, 200, { authenticated: true });
      };
      if (path === "/auth/register" || path === "/auth/login") {
        const { email, password } = credentials(body);
        if (!await deps.repo.consumeLimit(`email:${email}`, 8, 900)) throw new AuthError(429, "Muitas tentativas. Aguarde 15 minutos.");
        if (path === "/auth/register") {
          const account = await deps.repo.createPasswordAccount(email, await hashPassword(password));
          await establish(account.id);
        } else {
          const account = await deps.repo.findPasswordAccount(email);
          const valid = await verifyPassword(password, account?.password_hash ?? null);
          if (!valid || !account || account.status !== "active") throw new AuthError(401, "Email ou senha inválidos.");
          await establish(account.id);
        }
      } else if (path === "/auth/logout") {
        fields(body, []);
        if (token) await deps.repo.revoke(token);
        response.setHeader("Set-Cookie", makeCookie(sessionName, "", deps.production, 0));
        send(response, 200, { authenticated: false });
      } else if (path === "/auth/google-challenge") {
        fields(body, []);
        if (!deps.googleClientId || !deps.verifyGoogle) throw new AuthError(503, "Login com Google ainda não está disponível.");
        const previous = readCookie(request.headers.cookie, challengeName);
        if (previous) await deps.repo.consumeChallenge(previous);
        const challenge = await deps.repo.challenge();
        response.setHeader("Set-Cookie", makeCookie(challengeName, challenge.token, deps.production, 300));
        send(response, 200, { nonce: challenge.nonce });
      } else if (path === "/auth/google") {
        fields(body, ["credential"]);
        if (!deps.googleClientId || !deps.verifyGoogle) throw new AuthError(503, "Login com Google ainda não está disponível.");
        if (typeof body.credential !== "string" || body.credential.length > 8192) throw new AuthError(400, "Credencial inválida.");
        const challenge = readCookie(request.headers.cookie, challengeName);
        const nonce = challenge ? await deps.repo.consumeChallenge(challenge) : null;
        response.setHeader("Set-Cookie", makeCookie(challengeName, "", deps.production, 0));
        if (!nonce) throw new AuthError(401, "Recarregue a página e tente entrar com Google novamente.");
        const identity = await deps.verifyGoogle(body.credential, nonce);
        const account = await deps.repo.googleAccount(identity);
        await establish(account.id);
      } else if (path === "/auth/character") {
        fields(body, ["name", "heroClass"]);
        const account = token ? await deps.repo.session(token) : null;
        if (!account) throw new AuthError(401, "Entre novamente.");
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name || [...name].length > 40 || /[\u0000-\u001f\u007f]/.test(name) || !["guerreiro", "mago", "arqueiro"].includes(String(body.heroClass))) {
          throw new AuthError(400, "Informe nome de até 40 caracteres e uma classe válida.");
        }
        const character = await deps.repo.createCharacter(account.id, name, body.heroClass as "guerreiro" | "mago" | "arqueiro");
        send(response, 201, { character });
      } else throw new AuthError(404, "Rota não encontrada.");
    } catch (error) {
      if (error instanceof AuthError) send(response, error.status, { error: error.message });
      else if ((error as { code?: string })?.code === "23505") send(response, 409, { error: "Não foi possível concluir. Use sua conta existente se já estiver cadastrado." });
      else { console.error("Falha na operação de conta."); send(response, 503, { error: "Serviço indisponível. Tente novamente em instantes." }); }
    } finally { if (acquired) active--; }
    return true;
  };
}
