import type { CombatantState } from "../types/combat.js";
export const POTIONS = {
 healthPotion:{name:"Poção de HP",price:5,hp:40,detail:"Recupera até 40 HP"},
 greaterHealthPotion:{name:"Poção de HP Média",price:15,hp:120,detail:"Recupera até 120 HP"},
 superiorHealthPotion:{name:"Poção de HP Grande",price:35,hp:300,detail:"Recupera até 300 HP"},
 manaPotion:{name:"Poção de Mana",price:5,mana:20,detail:"Recupera até 20 mana"},
 greaterManaPotion:{name:"Poção de Mana Média",price:15,mana:60,detail:"Recupera até 60 mana"},
 superiorManaPotion:{name:"Poção de Mana Grande",price:35,mana:150,detail:"Recupera até 150 mana"},
 restorativePotion:{name:"Poção Restauradora",price:10,hp:40,mana:20,detail:"Recupera até 40 HP e 20 mana"},
 greaterRestorativePotion:{name:"Restauradora Superior",price:45,percent:.5,detail:"Recupera 50% do HP e da mana máximos"},
 elixir:{name:"Elixir",price:100,percent:1,detail:"Restaura HP e mana completos"},
 antidote:{name:"Antídoto",price:12,cleanse:"Veneno",detail:"Remove Veneno; uso em combate"},
 bandage:{name:"Poção Hemostática",price:12,cleanse:"Sangramento",detail:"Remove Sangramento; uso em combate"},
 purifyingPotion:{name:"Poção Purificadora",price:20,cleanse:"all",detail:"Remove dano contínuo e Quebra-osso; uso em combate"},
 strengthPotion:{name:"Poção de Força",price:25,buff:"attack",detail:"+15% ataque físico por 3 ações suas"},
 defensePotion:{name:"Poção de Defesa",price:25,buff:"defense",detail:"+15% defesa física por 3 ações suas"},
 magicPotion:{name:"Poção Arcana",price:25,buff:"magicPower",detail:"+15% poder mágico por 3 ações suas"},
 speedPotion:{name:"Poção de Agilidade",price:35,buff:"speed",detail:"+15% velocidade por 3 ações suas"},
} as const;
export type PotionId=keyof typeof POTIONS;
export type PotionInventory=Partial<Record<PotionId,number>>;
type Potion={name:string;price:number;detail:string;hp?:number;mana?:number;percent?:number;cleanse?:string;buff?:"attack"|"defense"|"magicPower"|"speed"};
export function isPotionId(id:unknown):id is PotionId{return typeof id==="string"&&Object.hasOwn(POTIONS,id);}
export function normalizePotions(raw:unknown):PotionInventory{
 const out:PotionInventory={};if(!raw||typeof raw!=="object")return out;
 for(const id of Object.keys(POTIONS) as PotionId[]){const n=(raw as PotionInventory)[id];if(typeof n==="number"&&Number.isFinite(n)&&n>0)out[id]=Math.min(9999,Math.floor(n));}return out;
}
export function applyPotionEffect(hero:CombatantState,id:PotionId):boolean{
 if(!hero.isAlive||hero.stats.hp<=0)return false;
 const potion:Potion=POTIONS[id];let changed=false;
 const hp=Math.min(hero.stats.maxHp,hero.stats.hp+(potion.hp??Math.floor(hero.stats.maxHp*(potion.percent??0))));
 const mana=Math.min(hero.stats.maxMana,hero.stats.mana+(potion.mana??Math.floor(hero.stats.maxMana*(potion.percent??0))));
 if(hp!==hero.stats.hp||mana!==hero.stats.mana){hero.stats.hp=hp;hero.stats.mana=mana;changed=true;}
 if(potion.cleanse){if(hero.ongoingDamage&&(potion.cleanse==="all"||hero.ongoingDamage.name===potion.cleanse)){delete hero.ongoingDamage;changed=true;}
 if(potion.cleanse==="all"&&(hero.skillLockedTurns??0)>0){hero.skillLockedTurns=0;changed=true;}}
 if(potion.buff&&!hero.potionBuff){const amount=Math.max(1,Math.floor(hero.stats[potion.buff]*.15));hero.stats[potion.buff]+=amount;hero.potionBuff={stat:potion.buff,amount,turns:3};changed=true;}
 return changed;
}
export function tickPotionBuff(hero:CombatantState):void{
 if(!hero.potionBuff)return;const buff={...hero.potionBuff,turns:hero.potionBuff.turns-1};
 if(buff.turns<=0){hero.stats[buff.stat]=Math.max(0,hero.stats[buff.stat]-buff.amount);delete hero.potionBuff;}else hero.potionBuff=buff;
}
