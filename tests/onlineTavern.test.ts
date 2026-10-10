import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POTIONS } from '../shared/src/items/potions.js';
import { RECOVERY_POTION_IDS, TAVERN_REST_COST, defeatRecoveryHp } from '../shared/src/items/tavern.js';
import { parseTavernCommand, tavernSnapshot } from '../server/src/game/tavern.js';
import { characterStats } from '../server/src/game/rules.js';
import { gameAssets } from '../server/src/game/assets.js';
const common = { requestId:'00000000-0000-0000-0000-000000000001', version:'1' };
test('online tavern exposes original recovery prices/effects, capped resources and original icons', () => {
  const stats = characterStats('mago',20,[]); stats.hp = 1; stats.mana = 1;
  const character = { id:common.requestId,version:'1',gold:'100',current_hp:1,current_mana:1,potion_inventory:{ healthPotion:2 } };
  const snapshot = tavernSnapshot(character,stats);
  assert.equal(snapshot.restCost,TAVERN_REST_COST); assert.equal(snapshot.restCost,20); assert.equal(snapshot.potions.length,9);
  for (const potion of snapshot.potions) { assert.equal(potion.price,POTIONS[potion.id].price); assert.equal(potion.detail,POTIONS[potion.id].detail); assert.ok(gameAssets.has(potion.icon)); }
  assert.equal(snapshot.potions.find(p=>p.id==='healthPotion')!.useBlocked,null);
  stats.hp=stats.maxHp;stats.mana=stats.maxMana;
  assert.ok(tavernSnapshot(character,stats).potions.find(p=>p.id==='healthPotion')!.useBlocked);
  assert.ok(tavernSnapshot(character,stats).restBlocked);
  assert.equal(defeatRecoveryHp(101),30); assert.equal(defeatRecoveryHp(1),1);
  assert.ok(RECOVERY_POTION_IDS.every(id=>!('buff' in POTIONS[id]||'cleanse' in POTIONS[id])));
});
test('tavern intent parser rejects forged price, inventory, healing and malformed quantities', () => {
  const valid = {...common,potionId:'healthPotion',quantity:1};
  assert.deepEqual(parseTavernCommand('buy',valid),{operation:'buy',potionId:'healthPotion',quantity:1});
  for(const key of ['accountId','characterId','price','gold','hp','stats','potion_inventory']) assert.throws(()=>parseTavernCommand('buy',{...valid,[key]:999}));
  for(const quantity of [0,-1,100,1.5,'1',null]) assert.throws(()=>parseTavernCommand('buy',{...valid,quantity}));
  for(const potionId of ['__proto__','strengthPotion','bandage','admin']) assert.throws(()=>parseTavernCommand('buy',{...valid,potionId}));
  assert.throws(()=>parseTavernCommand('use',valid)); assert.throws(()=>parseTavernCommand('rest',{...common,quantity:1}));
});
