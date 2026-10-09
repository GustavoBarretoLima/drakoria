import assert from "node:assert/strict";
import { POTIONS,normalizePotions,applyPotionEffect } from "../shared/src/items/potions.js";
import { applyPotionAction } from "../shared/src/combat/potionAction.js";
import { applyBattleAction } from "../shared/src/combat/combatEngine.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { buyPotion } from "../client/src/progression/shopClient.js";
import { loadConsumables,saveHeroVitals,useCityPotion } from "../client/src/battle/heroVitals.js";
import { startDemoBattle,subscribeDemoBattle,useDemoConsumable } from "../client/src/demo/demoBattle.js";
import type { BattleState } from "../shared/src/types/combat.js";
const saved=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v)},window:{setInterval:()=>1,clearInterval(){}}});
assert.equal(Object.keys(POTIONS).length,16);
assert.deepEqual(normalizePotions({healthPotion:Infinity,manaPotion:-2,strengthPotion:3.8,fake:9}),{strengthPotion:3});
saved.set("drakoriaProgresso",'{"nivel":20,"ouro":1000}');
assert.equal(buyPotion("fake"),"Compra inválida");assert.equal(buyPotion("healthPotion",-1),"Compra inválida");
for(const [id,potion] of Object.entries(POTIONS)){
 const gold=JSON.parse(saved.get("drakoriaProgresso")!).ouro;assert.equal(buyPotion(id),null);assert.equal(JSON.parse(saved.get("drakoriaProgresso")!).ouro,gold-potion.price);
}
const before=saved.get("drakoriaConsumables");saved.set("drakoriaProgresso",'{"nivel":20,"ouro":0}');assert.equal(buyPotion("elixir"),"Ouro insuficiente");assert.equal(saved.get("drakoriaConsumables"),before);
const initial=createInitialBattleState("mago","orc-normal-lvl-25",[],20);initial.turnOwnerId=initial.hero.id;initial.hero.stats.hp=1;initial.hero.stats.mana=0;initial.potions=loadConsumables();
for(const id of Object.keys(POTIONS) as (keyof typeof POTIONS)[]){
 const state=structuredClone(initial);state.hero.ongoingDamage={name:id==="antidote"?"Veneno":"Sangramento",damage:2,turns:3};state.hero.skillLockedTurns=2;
 const snapshot=structuredClone(state);const next=applyPotionAction(state,id);
 assert.notEqual(next,state,id);assert.deepEqual(state,snapshot);
 assert.equal(next.potions![id],state.potions![id]!-1);assert.equal(next.hero.atb,0);assert.equal(next.hero.fury,state.hero.fury);
 assert.equal(applyPotionAction(next,id),next,"No second use out of turn");
}
const full=structuredClone(initial);full.hero.stats.hp=full.hero.stats.maxHp;full.hero.stats.mana=full.hero.stats.maxMana;
assert.equal(applyPotionAction(full,"elixir"),full);assert.equal(applyPotionAction(full,"antidote"),full);assert.equal(applyPotionAction(full,"fake"),full);
const poisoned=structuredClone(initial);poisoned.hero.ongoingDamage={name:"Veneno",damage:999,turns:3};const cured=applyPotionAction(poisoned,"antidote");assert.equal(cured.hero.stats.hp,1);assert.equal(cured.hero.ongoingDamage,undefined);
const base=structuredClone(full);const attack=base.hero.stats.attack;let buffed=applyPotionAction(base,"strengthPotion");assert.ok(buffed.hero.stats.attack>attack);assert.equal(buffed.hero.potionBuff!.turns,3);
buffed.turnOwnerId=buffed.hero.id;assert.equal(applyPotionAction(buffed,"defensePotion"),buffed,"No stacking buffs");
for(let i=0;i<3;i++){buffed.turnOwnerId=buffed.hero.id;buffed=applyBattleAction(buffed,{type:"DEFEND"});}
assert.equal(buffed.hero.potionBuff,undefined);assert.equal(buffed.hero.stats.attack,attack);
const dead=structuredClone(initial);dead.hero.isAlive=false;dead.hero.stats.hp=0;assert.equal(applyPotionAction(dead,"elixir"),dead);
saveHeroVitals({hp:1,mana:0,maxHp:200,maxMana:100});assert.equal(useCityPotion("greaterRestorativePotion").vitals.hp,101);assert.equal(useCityPotion("antidote").used,false);
saved.set("classeHeroi","mago");saved.set("drakoriaConsumables",JSON.stringify({healthPotion:2}));saved.set("drakoriaProgresso",'{"nivel":20}');
let demo!:BattleState;subscribeDemoBattle(state=>{demo=state;});startDemoBattle("mago","orc-normal-lvl-25",20);demo.turnOwnerId=demo.hero.id;
const expected=applyPotionAction(demo,"healthPotion");assert.equal(useDemoConsumable("healthPotion"),true);assert.deepEqual(demo,expected);assert.equal(loadConsumables().healthPotion,1);
console.log("Potion shop: 16 types, prices, caps, stock, full resources, cures, buffs/expiry, snapshots, no resurrection and shared demo/server item rules passed.");
