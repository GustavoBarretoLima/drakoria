import type { BattleState } from "../types/combat.js";
import { POTIONS,applyPotionEffect,isPotionId,normalizePotions,tickPotionBuff } from "../items/potions.js";
import { tickHeroDamage } from "./combatEngine.js";
import { finishBerserkAction,tickBerserkBleed } from "./berserkCombat.js";
export function applyPotionAction(state:BattleState,id:unknown):BattleState{
 if(!isPotionId(id)||state.finished||state.turnOwnerId!==state.hero.id||!state.hero.isAlive||!state.enemy.isAlive)return state;
 const inventory=normalizePotions(state.potions);if(!(inventory[id]!>0))return state;
 const hero={...state.hero,stats:{...state.hero.stats},...(state.hero.berserk?{berserk:{...state.hero.berserk}}:{})};
 if(!applyPotionEffect(hero,id))return state;
 const enemy={...state.enemy,stats:{...state.enemy.stats}};
 const status=tickHeroDamage(hero)+tickBerserkBleed(enemy);
 hero.skillCooldowns=Object.fromEntries(Object.entries(hero.skillCooldowns??{}).map(([key,value])=>[key,Math.max(0,(value??0)-1)]));
 finishBerserkAction(hero,state.hero);hero.skillLockedTurns=Math.max(0,(hero.skillLockedTurns??0)-1);
 if(state.hero.potionBuff)tickPotionBuff(hero);
 hero.atb=0;inventory[id]!--;
 const finished=!hero.isAlive||!enemy.isAlive;
 return {...state,hero,enemy,potions:inventory,finished,turnOwnerId:finished?(hero.isAlive?hero.id:enemy.id):null,
 ...(finished?{winnerId:hero.isAlive?hero.id:enemy.id}:{}),
 lastEvent:{actorId:hero.id,targetId:hero.id,action:"DEFEND",special:POTIONS[id].name,message:`${status}${hero.name} usou ${POTIONS[id].name}.`}};
}
