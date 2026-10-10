import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { gameAssets, serveGameAsset } from '../server/src/game/assets.js';
const { equipmentIcon, isNewTurn } = await import(new URL('../server/public/play-visuals.js', import.meta.url).href);

test('online art is served from an exact allowlist with correct MIME and HEAD behavior', async () => {
  for (const file of gameAssets.values()) await access(new URL(`../${file}`, import.meta.url));
  async function request(url: string, method = 'GET') {
    let status = 0, body: unknown; const headers: Record<string, unknown> = {};
    const res = { setHeader(key: string, value: unknown) { headers[key] = value; },
      writeHead(code: number, values?: Record<string, unknown>) { status = code; Object.assign(headers, values); },
      end(value: unknown) { body = value; } } as unknown as ServerResponse;
    assert.equal(await serveGameAsset({ url, method } as IncomingMessage, res), true);
    return { status, body, headers };
  }
  const png = await request('/game-assets/forest.png'); assert.equal(png.status, 200); assert.equal(png.headers['Content-Type'], 'image/png');
  assert.equal(png.headers['Cross-Origin-Resource-Policy'], 'same-origin');
  const gif = await request('/game-assets/guerreiro-idle.gif'); assert.equal(gif.status, 200); assert.equal(gif.headers['Content-Type'], 'image/gif');
  const head = await request('/game-assets/guerreiro-idle.gif', 'HEAD'); assert.equal(head.status, 200); assert.equal(head.body, undefined);
  assert.ok(Number(head.headers['Content-Length']) > 0);
  assert.equal((await request('/game-assets/forest.png', 'POST')).status, 405);
  for (const path of ['../server/src/index.ts', '%2e%2e/.env', 'forest.png?path=../../../.env', 'unknown.png']) {
    assert.equal((await request(`/game-assets/${path}`)).status, 404);
  }
});
test('visual paths reject external and traversal URLs; repeated snapshots never replay a turn', () => {
  assert.equal(equipmentIcon('/img/itens/loot_monstros/icones_128/goblin-tooth-ring.png'), '/game-assets/items/goblin-tooth-ring.png');
  for (const path of ['https://evil.example/icon.png', '/img/itens/loot_monstros/icones_128/../secret.png', 'javascript:alert(1)']) assert.equal(equipmentIcon(path), null);
  const previous = { battle: { id: 'battle-1', revision: 2 } };
  assert.equal(isNewTurn(previous, { battle: { id: 'battle-1', revision: 3 } }), true);
  assert.equal(isNewTurn(previous, previous), false);
  assert.equal(isNewTurn(previous, { battle: { id: 'battle-2', revision: 3 } }), false);
  assert.equal(isNewTurn(previous, { battle: { id: 'battle-1', revision: 7 } }), false);
});
