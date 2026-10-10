import { readFile } from 'node:fs/promises';
import { getMonsterById } from '../modules/monsters/monsterService.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Exact public allowlist: no URL-derived filesystem path or repository browsing.
export const gameAssets = new Map<string, string>([
  ['/game-assets/forest.png', 'img/stages/floresta_sombria.png'],
  ['/game-assets/goblin-idle.gif', 'img/monstros/goblin.gif'],
  ['/game-assets/goblin-attack.gif', 'img/monstros/goblin-ataque.gif'],
  ['/game-assets/goblin-damage.gif', 'img/monstros/goblin-dano.gif'],
  ['/game-assets/goblin-static.png', 'img/monstros/goblin.png'],
  ['/game-assets/goblin-death.png', 'img/monstros/goblin-dead.png'],
]);
for (const [heroClass, folder] of [['guerreiro', 'heroi_anime'], ['mago', 'mago_anime'], ['arqueiro', 'elfo_anime']]) {
  for (const state of ['idle', 'attack', 'damage', 'death']) {
    gameAssets.set(`/game-assets/${heroClass}-${state}.gif`, `img/personagens/${folder}/${state}.gif`);
  }
  gameAssets.set(`/game-assets/${heroClass}-static.png`, `img/personagens/${folder}/idle_00.png`);
  gameAssets.set(`/game-assets/${heroClass}-death.png`, `img/personagens/${folder}/death_03.png`);
}
gameAssets.set('/game-assets/guild.png', 'img/stages/guilda-anime.png');
gameAssets.set('/game-assets/world-map.png', 'img/mapas/arredores_de_drakoria.png');
for (const stage of ['cemiterio_esquecido', 'pantano_corrompido', 'floresta_sombria', 'acampamento_orc', 'fortaleza_rei_orc']) {
  gameAssets.set(`/game-assets/stages/${stage}.png`, `img/stages/${stage}.png`);
}
const monsterFolders = ['esqueleto_guerreiro', 'espectro_cemiterio', 'coveiro_maldito', 'rato_mutante', 'aranha_pestilenta', 'hidra_corrupcao', 'lobo_sombrio', 'arvore_demoniaca', 'lobo_mutante_boss', 'orc', 'hobgoblin', 'orc_rei'];
for (const folder of monsterFolders) {
  for (const pose of ['idle', 'attack', 'damage', 'death']) {
    gameAssets.set(`/game-assets/monsters/${folder}/${pose}.gif`, `img/monstros/${folder}/${pose}.gif`);
  }
  gameAssets.set(`/game-assets/monsters/${folder}/static.png`, `img/monstros/${folder}/idle_00.png`);
  gameAssets.set(`/game-assets/monsters/${folder}/death.png`, `img/monstros/${folder}/death_03.png`);
}
export function enemyPresentation(monsterId: string) {
  const monster = getMonsterById(monsterId);
  const result: Record<string, string> = {};
  if (monster?.sprites?.idle === '/img/monstros/goblin.gif') {
    for (const pose of ['idle', 'attack', 'damage']) result[pose] = `/game-assets/goblin-${pose}.gif`;
    result.death = '/game-assets/goblin-death.png'; result.static = '/game-assets/goblin-static.png'; result.staticDeath = result.death;
  } else {
    const folder = monsterFolders.find(folder => monster?.sprites?.idle === `/img/monstros/${folder}/idle.gif`);
    if (!folder) throw new Error('Arte de monstro online ausente.');
    for (const pose of ['idle', 'attack', 'damage', 'death']) result[pose] = `/game-assets/monsters/${folder}/${pose}.gif`;
    result.static = `/game-assets/monsters/${folder}/static.png`; result.staticDeath = `/game-assets/monsters/${folder}/death.png`;
  }
  return result;
}
// Equipment icons are added from the checked-in list below.
gameAssets.set('/game-assets/items/drakoria-arqueiro-armor-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-armor-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-boots-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-boots-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-earring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-earring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-gloves-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-gloves-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-legs-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-legs-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-necklace-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-necklace-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-ring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-ring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-shield-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-shield-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-arqueiro-weapon-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-arqueiro-weapon-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-armor-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-armor-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-boots-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-boots-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-earring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-earring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-gloves-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-gloves-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-legs-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-legs-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-necklace-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-necklace-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-ring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-ring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-shield-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-shield-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-guerreiro-weapon-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-guerreiro-weapon-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-armor-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-armor-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-boots-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-boots-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-earring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-earring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-gloves-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-gloves-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-legs-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-legs-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-necklace-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-necklace-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-ring-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-ring-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-shield-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-shield-rare-lvl-20.png');
gameAssets.set('/game-assets/items/drakoria-mago-weapon-rare-lvl-20.png', 'img/itens/loot_monstros/icones_128/drakoria-mago-weapon-rare-lvl-20.png');
gameAssets.set('/game-assets/items/goblin-hide-gloves.png', 'img/itens/loot_monstros/icones_128/goblin-hide-gloves.png');
gameAssets.set('/game-assets/items/goblin-shadow-ring.png', 'img/itens/loot_monstros/icones_128/goblin-shadow-ring.png');
gameAssets.set('/game-assets/items/goblin-tooth-ring.png', 'img/itens/loot_monstros/icones_128/goblin-tooth-ring.png');
gameAssets.set('/game-assets/items/monster-loot-01.png', 'img/itens/loot_monstros/icones_128/monster-loot-01.png');
gameAssets.set('/game-assets/items/monster-loot-02.png', 'img/itens/loot_monstros/icones_128/monster-loot-02.png');
gameAssets.set('/game-assets/items/monster-loot-03.png', 'img/itens/loot_monstros/icones_128/monster-loot-03.png');
gameAssets.set('/game-assets/items/monster-loot-04.png', 'img/itens/loot_monstros/icones_128/monster-loot-04.png');
gameAssets.set('/game-assets/items/monster-loot-05.png', 'img/itens/loot_monstros/icones_128/monster-loot-05.png');
gameAssets.set('/game-assets/items/monster-loot-06.png', 'img/itens/loot_monstros/icones_128/monster-loot-06.png');
gameAssets.set('/game-assets/items/monster-loot-07.png', 'img/itens/loot_monstros/icones_128/monster-loot-07.png');
gameAssets.set('/game-assets/items/monster-loot-08.png', 'img/itens/loot_monstros/icones_128/monster-loot-08.png');
gameAssets.set('/game-assets/items/monster-loot-09.png', 'img/itens/loot_monstros/icones_128/monster-loot-09.png');
gameAssets.set('/game-assets/items/monster-loot-10.png', 'img/itens/loot_monstros/icones_128/monster-loot-10.png');
gameAssets.set('/game-assets/items/monster-loot-11.png', 'img/itens/loot_monstros/icones_128/monster-loot-11.png');
gameAssets.set('/game-assets/items/monster-loot-12.png', 'img/itens/loot_monstros/icones_128/monster-loot-12.png');
gameAssets.set('/game-assets/items/monster-loot-13.png', 'img/itens/loot_monstros/icones_128/monster-loot-13.png');
gameAssets.set('/game-assets/items/monster-loot-14.png', 'img/itens/loot_monstros/icones_128/monster-loot-14.png');
gameAssets.set('/game-assets/items/monster-loot-15.png', 'img/itens/loot_monstros/icones_128/monster-loot-15.png');
gameAssets.set('/game-assets/items/monster-loot-16.png', 'img/itens/loot_monstros/icones_128/monster-loot-16.png');
gameAssets.set('/game-assets/items/orc-iron-axe.png', 'img/itens/loot_monstros/icones_128/orc-iron-axe.png');
gameAssets.set('/game-assets/items/orc-iron-chest.png', 'img/itens/loot_monstros/icones_128/orc-iron-chest.png');
gameAssets.set('/game-assets/items/orc-king-eye-of-truth.png', 'img/itens/loot_monstros/icones_128/orc-king-eye-of-truth.png');
gameAssets.set('/game-assets/items/orc-warlord-axe.png', 'img/itens/loot_monstros/icones_128/orc-warlord-axe.png');
gameAssets.set('/game-assets/items/orc-warlord-bow.png', 'img/itens/loot_monstros/icones_128/orc-warlord-bow.png');
gameAssets.set('/game-assets/items/orc-warlord-chest.png', 'img/itens/loot_monstros/icones_128/orc-warlord-chest.png');
gameAssets.set('/game-assets/items/orc-warlord-gloves.png', 'img/itens/loot_monstros/icones_128/orc-warlord-gloves.png');
gameAssets.set('/game-assets/items/orc-warlord-ring.png', 'img/itens/loot_monstros/icones_128/orc-warlord-ring.png');
gameAssets.set('/game-assets/items/orc-warlord-shield.png', 'img/itens/loot_monstros/icones_128/orc-warlord-shield.png');
gameAssets.set('/game-assets/items/orc-warlord-staff.png', 'img/itens/loot_monstros/icones_128/orc-warlord-staff.png');
gameAssets.set('/game-assets/items/orc-warlord-sword.png', 'img/itens/loot_monstros/icones_128/orc-warlord-sword.png');
gameAssets.set('/game-assets/items/ring-universal-legendary-pascoa-lvl-100.png', 'img/itens/loot_monstros/icones_128/ring-universal-legendary-pascoa-lvl-100.png');
gameAssets.set('/game-assets/items/weapon-universal-legendary-natal-lvl-100.png', 'img/itens/loot_monstros/icones_128/weapon-universal-legendary-natal-lvl-100.png');

export async function serveGameAsset(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
  const path = request.url ?? '';
  if (!path.startsWith('/game-assets/')) return false;
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  const file = gameAssets.get(path);
  if (!file) { response.writeHead(404); response.end(); return true; }
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return true; }
  try {
    const data = await readFile(new URL(`../../../${file}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': file.endsWith('.gif') ? 'image/gif' : 'image/png',
      'Content-Length': data.byteLength, 'Cache-Control': 'public, max-age=86400' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404); response.end(); }
  return true;
}
