import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createDatabasePool } from '../src/database/pool.js';
import { migrateDatabase } from '../src/database/migrate.js';
import { AuthRepository } from '../src/auth/repository.js';
import { GameRepository } from '../src/game/repository.js';
import { createGameHandler } from '../src/game/http.js';
import { RECOVERY_POTION_IDS } from '../../shared/src/items/tavern.js';
import { POTIONS } from '../../shared/src/items/potions.js';

test('online tavern charges canonical prices and persists recovery with atomic retry-safe commands',async t=>{
 if(!process.env.TEST_DATABASE_URL)throw new Error('TEST_DATABASE_URL obrigatoria.');
 const env={DATABASE_URL:process.env.TEST_DATABASE_URL,DATABASE_SSL:process.env.DATABASE_SSL??'disable'};
 const admin=createDatabasePool(env),pool=createDatabasePool(env),schema=`tavern_${randomUUID().replaceAll('-','')}`;
 await admin.query(`CREATE SCHEMA ${schema}`);pool.on('connect',client=>{void client.query(`SET search_path TO ${schema}`);});
 const auth=new AuthRepository(pool),game=new GameRepository(pool);
 try{
  await migrateDatabase(pool);
  const a=await auth.createPasswordAccount('tavern-a@example.test','a'.repeat(64)),b=await auth.createPasswordAccount('tavern-b@example.test','b'.repeat(64));
  await auth.createCharacter(a.id,'Alice','mago');await auth.createCharacter(b.id,'Bruno','guerreiro');
  let state=await game.load(a.id);
  const count=(id:string)=>state.tavern.potions.find(p=>p.id===id)!.quantity;
  await t.test('old characters preserve their progress and new stocks start empty; insufficient gold cannot buy',async()=>{
   assert.equal(state.tavern.potions.length,9);assert.equal(count('healthPotion'),0);
   await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'buy',potionId:'healthPotion',quantity:1}));
   await pool.query('UPDATE characters SET gold = 500, level = 20, current_hp = 1, current_mana = 1 WHERE id = $1',[state.character.id]);state=await game.load(a.id);
   assert.equal(state.character.level,20);assert.equal(state.character.gold,500);
  });
  await t.test('five identical purchases charge once; reuse with a different intent and stale versions fail',async()=>{
   const request=randomUUID(),version=state.character.version;
   const replies=await Promise.all(Array.from({length:5},()=>game.tavern(a.id,request,version,{operation:'buy',potionId:'healthPotion',quantity:2})));
   state=replies[0]!;assert.equal(new Set(replies.map(s=>s.character.version)).size,1);assert.equal(state.character.gold,490);assert.equal(count('healthPotion'),2);
   await assert.rejects(game.tavern(a.id,request,version,{operation:'buy',potionId:'manaPotion',quantity:2}));
   await assert.rejects(game.tavern(a.id,randomUUID(),version,{operation:'buy',potionId:'healthPotion',quantity:1}));
   assert.equal((await game.load(b.id)).tavern.potions.every(p=>p.quantity===0),true);
   assert.deepEqual(await new GameRepository(pool).load(a.id),state);
  });
  await t.test('concurrent consuming restores once; full resources preserve potion and version',async()=>{
   const request=randomUUID(),version=state.character.version;
   const replies=await Promise.all(Array.from({length:5},()=>game.tavern(a.id,request,version,{operation:'use',potionId:'healthPotion'})));
   state=replies[0]!;assert.equal(state.character.stats.hp,41);assert.equal(count('healthPotion'),1);assert.equal(state.character.gold,490);
   state=await game.tavern(a.id,randomUUID(),state.character.version,{operation:'rest'});assert.equal(state.character.gold,470);
   assert.equal(state.character.stats.hp,state.character.stats.maxHp);assert.equal(state.character.stats.mana,state.character.stats.maxMana);
   const before=state;await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'use',potionId:'healthPotion'}));
   await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'rest'}));assert.deepEqual(await game.load(a.id),before);
   await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'use',potionId:'elixir'}));
  });
  await t.test('all nine potions preserve canonical prices/effects and cap resources',async()=>{
   await pool.query('UPDATE characters SET gold = 5000 WHERE id = $1',[state.character.id]);state=await game.load(a.id);
   for(const id of RECOVERY_POTION_IDS){
    await pool.query('UPDATE characters SET current_hp = 1, current_mana = 1 WHERE id = $1',[state.character.id]);state=await game.load(a.id);
    const gold=state.character.gold,potion=POTIONS[id] as {price:number;hp?:number;mana?:number;percent?:number};
    state=await game.tavern(a.id,randomUUID(),state.character.version,{operation:'buy',potionId:id,quantity:1});assert.equal(state.character.gold,gold-potion.price);
    state=await game.tavern(a.id,randomUUID(),state.character.version,{operation:'use',potionId:id});
    assert.equal(state.character.stats.hp,Math.min(state.character.stats.maxHp,1+(potion.hp??Math.floor(state.character.stats.maxHp*(potion.percent??0)))));
    assert.equal(state.character.stats.mana,Math.min(state.character.stats.maxMana,1+(potion.mana??Math.floor(state.character.stats.maxMana*(potion.percent??0)))));
   }
   await pool.query(`UPDATE characters SET potion_inventory = '{"healthPotion":9999}' WHERE id = $1`,[state.character.id]);state=await game.load(a.id);
   await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'buy',potionId:'healthPotion',quantity:1}));assert.equal(count('healthPotion'),9999);
  });
  await t.test('late save failure rolls back charged gold, inventory, resources and immutable receipts',async()=>{
   await pool.query(`CREATE FUNCTION fail_tavern() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late save failure'; END; $$`);
   await pool.query('CREATE TRIGGER fail_tavern BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION fail_tavern()');
   const before=state,receipts=(await pool.query('SELECT count(*) FROM online_tavern_commands')).rows[0].count;
   await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,{operation:'buy',potionId:'manaPotion',quantity:2}));assert.deepEqual(await game.load(a.id),before);
   assert.equal((await pool.query('SELECT count(*) FROM online_tavern_commands')).rows[0].count,receipts);
   await pool.query('DROP TRIGGER fail_tavern ON characters');await pool.query('DROP FUNCTION fail_tavern()');
   await assert.rejects(pool.query('DELETE FROM online_tavern_commands'));
  });
  await t.test('dead legacy saves recover only 30% HP once; active battles reject every tavern command',async()=>{
   const other=await game.load(b.id);await pool.query('UPDATE characters SET current_hp = 0, current_mana = 0 WHERE id = $1',[other.character.id]);
   const recovered=await game.load(b.id);assert.equal(recovered.character.gold,0);assert.equal(recovered.character.stats.hp,Math.max(1,Math.floor(recovered.character.stats.maxHp*.3)));assert.equal(recovered.character.stats.mana,0);
   assert.deepEqual(await game.load(b.id),recovered);
   state=await game.start(a.id,randomUUID(),'cemiterio-esquecido',state.character.version);
   for(const command of [{operation:'buy',potionId:'manaPotion',quantity:1},{operation:'use',potionId:'healthPotion'},{operation:'rest'}] as const)await assert.rejects(game.tavern(a.id,randomUUID(),state.character.version,command));
   assert.deepEqual(await game.load(a.id),state);
  });
  await t.test('HTTP rejects identity/price/effect forgery, invalid quantities, no login and foreign origin; old free-rest body is invalid',async()=>{
   const token=await auth.newSession(a.id),handler=createGameHandler({auth,game,origin:'https://game.example',production:false});
   async function request(path:string,body:unknown,extra:Record<string,string>={}){
    const req=Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;req.url=path;req.method='POST';req.headers={'content-type':'application/json',origin:'https://game.example',cookie:`drakoria_session=${token}`,...extra};
    let status=0;const res={setHeader(){},writeHead(code:number){status=code;},end(){}} as unknown as ServerResponse;await handler(req,res);return status;
   }
   const valid={requestId:randomUUID(),version:state.character.version,potionId:'healthPotion',quantity:1},path='/game/tavern/buy';
   assert.equal(await request(path,valid,{cookie:''}),401);assert.equal(await request(path,valid,{origin:'https://evil.example'}),403);
   for(const field of ['accountId','characterId','gold','price','hp','stats','potion_inventory'])assert.equal(await request(path,{...valid,[field]:999}),400);
   for(const quantity of [0,-1,100,1.5,'1'])assert.equal(await request(path,{...valid,quantity}),400);
   for(const potionId of ['__proto__','strengthPotion','antidote'])assert.equal(await request(path,{...valid,potionId}),400);
   assert.equal(await request('/game/rest',{version:state.character.version}),400);
   assert.equal(await request('/game/rest',{requestId:randomUUID(),version:state.character.version}),409);
  });
 }finally{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();}
});
