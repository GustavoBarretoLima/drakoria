import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import type { AuthRepository } from '../auth/repository.js';
import { AuthError, cookieName, readCookie } from '../auth/security.js';
import { readJson } from '../auth/http.js';
import type { GameRepository } from './repository.js';
import { serveGameAsset } from './assets.js';
import { questDefinition } from './guild.js';
import { regionConfig } from './world.js';
import { onlyFields, parseAction, uuid } from './rules.js';

interface Dependencies { auth: AuthRepository; game: GameRepository; origin: string; production: boolean; }
const files = new Map([
  ['/play', ['play.html', 'text/html; charset=utf-8']],
  ['/play.js', ['play.js', 'text/javascript; charset=utf-8']],
  ['/play-visuals.js', ['play-visuals.js', 'text/javascript; charset=utf-8']],
  ['/play.css', ['play.css', 'text/css; charset=utf-8']],
]);
const routes = ['/game/state', '/game/start', '/game/action', '/game/rest', '/game/equip', '/game/retreat', '/game/quests/accept', '/game/quests/claim'];
function send(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(data));
}
export function createGameHandler(deps: Dependencies) {
  let active = 0;
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    if (await serveGameAsset(request, response)) return true;
    const path = request.url ?? '';
    if (!files.has(path) && !path.startsWith('/game/')) return false;
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    let acquired = false;
    try {
      if (files.has(path)) {
        if (request.method !== 'GET') throw new AuthError(405, 'Método inválido.');
        const [name, type] = files.get(path)!;
        const content = await readFile(new URL(`../../public/${name}`, import.meta.url));
        response.writeHead(200, { 'Content-Type': type! }); response.end(content); return true;
      }
      if (!routes.includes(path)) throw new AuthError(404, 'Rota não encontrada.');
      if (request.method !== (path === '/game/state' ? 'GET' : 'POST')) throw new AuthError(405, 'Método inválido.');
      if (request.method === 'POST' && request.headers.origin !== deps.origin) throw new AuthError(403, 'Origem inválida.');
      if (active >= 4) throw new AuthError(429, 'Muitas solicitações. Tente novamente.');
      active++; acquired = true;
      const token = readCookie(request.headers.cookie, cookieName(deps.production));
      const account = token ? await deps.auth.session(token) : null;
      if (!account) throw new AuthError(401, 'Entre para jogar.');
      if (!await deps.auth.consumeLimit(`game:${account.id}`, 120, 60)) throw new AuthError(429, 'Aguarde um minuto antes de continuar.');
      if (path === '/game/state') { send(response, 200, await deps.game.load(account.id)); return true; }
      const body = await readJson(request);
      if (path === '/game/start') {
        onlyFields(body, ['requestId', 'regionId', 'version', 'expeditionId']);
        if (typeof body.regionId !== 'string' || typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version) || (body.expeditionId !== undefined && !uuid(body.expeditionId))) throw new AuthError(400, 'Expedição inválida.');
        regionConfig(body.regionId);
        if (!uuid(body.requestId)) throw new AuthError(400, 'Identificador inválido.');
        send(response, 200, await deps.game.start(account.id, body.requestId, body.regionId, body.version, body.expeditionId as string | undefined));
      } else if (path === '/game/action') {
        onlyFields(body, ['battleId', 'revision', 'action']);
        if (!uuid(body.battleId) || !Number.isSafeInteger(body.revision) || Number(body.revision) < 0 || Number(body.revision) > 2147483646) throw new AuthError(400, 'Turno inválido.');
        send(response, 200, await deps.game.action(account.id, body.battleId, Number(body.revision), parseAction(body.action)));
      } else if (path === '/game/quests/accept' || path === '/game/quests/claim') {
        onlyFields(body, ['requestId', 'questId', 'version']);
        if (!uuid(body.requestId) || typeof body.questId !== 'string' || typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version)) throw new AuthError(400, 'Missão inválida.');
        questDefinition(body.questId);
        send(response, 200, await deps.game.quest(account.id, body.requestId, body.questId, body.version, path === '/game/quests/accept' ? 'accept' : 'claim'));
      } else if (path === '/game/retreat') {
        onlyFields(body, ['version', 'expeditionId']);
        if (!uuid(body.expeditionId) || typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version)) throw new AuthError(400, 'Expedição inválida.');
        send(response, 200, await deps.game.retreat(account.id, body.version, body.expeditionId));
      } else {
        onlyFields(body, path === '/game/equip' ? ['version', 'instanceId'] : ['version']);
        if (typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version)) throw new AuthError(400, 'Versão inválida.');
        if (path === '/game/equip' && !uuid(body.instanceId)) throw new AuthError(400, 'Item inválido.');
        send(response, 200, await deps.game.camp(account.id, body.version, path === '/game/equip' ? body.instanceId as string : undefined));
      }
    } catch (error) {
      if (error instanceof AuthError) send(response, error.status, { error: error.message });
      else { console.error('Falha na operação do jogo online.'); send(response, 503, { error: 'Não foi possível concluir. Atualize para recuperar o estado salvo.' }); }
    } finally { if (acquired) active--; }
    return true;
  };
}
