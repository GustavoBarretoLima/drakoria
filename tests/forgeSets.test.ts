import { applyPotionAction } from "../shared/src/combat/potionAction.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { FORGE_RECIPES } from "../shared/src/equipment/crafting.js";
import { getForgeSet } from "../shared/src/equipment/forgeSets.js";
import { applyEquipmentStats } from "../shared/src/equipment/equipmentStats.js";
import { createStatsForLevel } from "../shared/src/combat/classStats.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { applyBattleAction } from "../shared/src/combat/combatEngine.js";
import { createBerserkAxe } from "../shared/src/equipment/berserkWeapons.js";
import { createAssassinDaggers } from "../shared/src/equipment/assassinWeapons.js";
import type { HeroClass } from "../shared/src/types/combat.js";
const set = (cls:HeroClass, rarity="rare") => FORGE_RECIPES.filter(r=>r.item.allowedClasses.includes(cls)&&r.item.rarity===rarity&&r.item.slot!=="shield").map(r=>r.item);
test("forge sets require eight distinct crafted slots of one family; weakest tier governs",()=>{
 const items=set("guerreiro"); assert.equal(items.length,8);
 assert.equal(getForgeSet(items,"guerreiro").active,true);
 assert.equal(getForgeSet(items.slice(1),"guerreiro").active,false);
 assert.equal(getForgeSet([...items.slice(1),items[1]!],"guerreiro").active,false);
 assert.equal(getForgeSet(set("mago"),"guerreiro").active,false);
 assert.equal(getForgeSet(items.map(i=>({...i,id:i.id.replace("forge-","drop-")})),"guerreiro").active,false);
 const mythic=set("guerreiro","mythic"); assert.equal(getForgeSet(mythic,"guerreiro").rank,3);
 mythic[0]=items[0]!; assert.equal(getForgeSet(mythic,"guerreiro").rank,0);
 for(const [cls,adapt] of [["guerreiro",createBerserkAxe],["arqueiro",createAssassinDaggers]] as const){
  const gear=set(cls); const index=gear.findIndex(i=>i.slot==="weapon");gear[index]=adapt(gear[index]!);assert.equal(getForgeSet(gear,cls).active,true);
 }
});
test("class set stats activate once, disappear on removal, and preserve dodge cap",()=>{
 for(const cls of ["guerreiro","mago","arqueiro"] as const){
  const gear=set(cls); const base=createStatsForLevel(cls,55);
  const without=applyEquipmentStats(base,gear.map(i=>({...i,id:"legacy-"+i.id})));
  const full=applyEquipmentStats(base,gear);
  assert.equal(full.forgeHpRegen,3);assert.equal(base.forgeHpRegen,undefined);
  assert.equal(applyEquipmentStats(base,gear.slice(1)).forgeHpRegen,undefined);
  if(cls==="guerreiro"){assert.equal(full.attack,Math.floor(without.attack*1.08));assert.equal(full.defense,Math.floor(without.defense*1.1));}
  if(cls==="mago"){assert.equal(full.magicPower,Math.floor(without.magicPower*1.12));assert.equal(full.forgeManaRegen,5);}
  if(cls==="arqueiro"){assert.equal(full.speed,Math.floor(without.speed*1.1));assert.equal(full.dodgeChance,Math.min(50,without.dodgeChance+3));}
 }
});
test("shared battle restores resources exactly once per valid player action, caps and never revives",()=>{
 const state=createInitialBattleState("mago","goblin-normal-lvl-1",set("mago","mythic"),55);
 state.turnOwnerId=state.hero.id; state.hero.stats.hp=Math.floor(state.hero.stats.maxHp/2);state.hero.stats.mana=0;
 const next=applyBattleAction(state,{type:"DEFEND"});
 assert.equal(next.hero.stats.hp,state.hero.stats.hp+Math.floor(state.hero.stats.maxHp*.06));
 assert.equal(next.hero.stats.mana,Math.floor(state.hero.stats.maxMana*.05));
 assert.match(next.lastEvent!.message,/Conjunto da forja/);
 state.potions={healthPotion:1};
 const potion=applyPotionAction(state,"healthPotion");assert.match(potion.lastEvent!.message,/Conjunto da forja/);assert.equal(potion.potions!.healthPotion,0);
 assert.equal(applyPotionAction(state,"invalid"),state);
 assert.equal(applyBattleAction(next,{type:"DEFEND"}),next);
 assert.equal(applyBattleAction(state,{type:"USE_SKILL",skillId:"invalid"} as never),state);
 const full=structuredClone(state);full.hero.stats.hp=full.hero.stats.maxHp;full.hero.stats.mana=full.hero.stats.maxMana;
 assert.equal(applyBattleAction(full,{type:"DEFEND"}).hero.stats.hp,full.hero.stats.maxHp);
 const dead=structuredClone(state);dead.hero.ongoingDamage={damage:dead.hero.stats.maxHp,turns:1,name:"Veneno"};
 const result=applyBattleAction(dead,{type:"DEFEND"});assert.equal(result.hero.stats.hp,0);assert.equal(result.finished,true);
});
