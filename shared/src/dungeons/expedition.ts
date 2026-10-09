import type { BattleRewards } from "../types/combat.js";
export interface ExpeditionLoot { name:string; quantity:number; }
export interface ExpeditionRewards { xp:number; gold:number; loot:ExpeditionLoot[]; battles:string[]; }
const count=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(value))):0;
export function normalizeExpedition(raw:unknown):ExpeditionRewards {
 const data=(raw&&typeof raw==="object"?raw:{}) as Partial<ExpeditionRewards>;
 return {xp:count(data.xp),gold:count(data.gold),loot:Array.isArray(data.loot)?data.loot.filter(item=>item&&typeof item.name==="string").map(item=>({name:item.name,quantity:count(item.quantity)})).filter(item=>item.quantity>0):[],battles:Array.isArray(data.battles)?[...new Set(data.battles.filter(id=>typeof id==="string"))]:[]};
}
export function addExpeditionRewards(raw:unknown,battleId:string,rewards:BattleRewards):ExpeditionRewards {
 const next=normalizeExpedition(raw);
 if(!battleId||next.battles.includes(battleId))return next;
 next.battles.push(battleId);next.xp+=count(rewards.xp);next.gold+=count(rewards.gold);
 const rarity={common:"Comum",uncommon:"Incomum",rare:"Raro",epic:"Épico",legendary:"Lendário",mythic:"Mítico"};
 const drops=[...(rewards.drops??[]).map(drop=>({name:`${drop.item.name} • ${rarity[drop.item.rarity]} • Nv.${drop.item.level}`,quantity:drop.quantity})),...(rewards.classBooks??[]).map(book=>({name:`Livro: ${book.name}`,quantity:book.quantity}))];
 for(const drop of drops){const quantity=count(drop.quantity);if(!quantity)continue;const old=next.loot.find(item=>item.name===drop.name);if(old)old.quantity+=quantity;else next.loot.push({...drop,quantity});}
 return next;
}
