import { POTIONS, normalizePotions, applyPotionEffect, type PotionId, type PotionInventory } from "../../../shared/src/items/potions.js";
import type { CombatantState } from "../../../shared/src/types/combat.js";
export interface HeroVitals {
  hp: number;
  mana: number;
  maxHp: number;
  maxMana: number;
}

export interface ConsumablesState extends PotionInventory {
  restorativePotion: number;
  healthPotion: number;
  manaPotion: number;
}

export interface PotionUseResult {
  used: boolean;
  remaining: number;
  vitals: HeroVitals;
}

const VITALS_KEY = "drakoriaHeroVitals";
const CONSUMABLES_KEY = "drakoriaConsumables";

export function loadHeroVitals(maxHp: number, maxMana: number): HeroVitals {
  const saved = localStorage.getItem(VITALS_KEY);
  if (!saved) return { hp: maxHp, mana: maxMana, maxHp, maxMana };

  try {
    const parsed = JSON.parse(saved) as Partial<HeroVitals>;
    const hp = Math.min(maxHp, Math.max(0, Math.floor(Number(parsed.hp ?? maxHp))));
    const mana = Math.min(maxMana, Math.max(0, Math.floor(Number(parsed.mana ?? maxMana))));
    return { hp, mana, maxHp, maxMana };
  } catch {
    return { hp: maxHp, mana: maxMana, maxHp, maxMana };
  }
}

export function saveHeroVitals(vitals: HeroVitals): void {
  localStorage.setItem(VITALS_KEY, JSON.stringify({
    hp: Math.min(vitals.maxHp, Math.max(0, Math.floor(vitals.hp))),
    mana: Math.min(vitals.maxMana, Math.max(0, Math.floor(vitals.mana))),
    maxHp: Math.max(1, Math.floor(vitals.maxHp)),
    maxMana: Math.max(0, Math.floor(vitals.maxMana)),
  }));
}

export function loadConsumables(): ConsumablesState {
  const saved = localStorage.getItem(CONSUMABLES_KEY);
  if (!saved) {
    const starter: ConsumablesState = {
      restorativePotion: 3,
      healthPotion: 0,
      manaPotion: 0,
    };
    localStorage.setItem(CONSUMABLES_KEY, JSON.stringify(starter));
    return starter;
  }

  try { return {restorativePotion:0,healthPotion:0,manaPotion:0,...normalizePotions(JSON.parse(saved))}; }
  catch { return {restorativePotion:0,healthPotion:0,manaPotion:0}; }
}
export function savePotionInventory(potions:PotionInventory):void { saveConsumables({restorativePotion:0,healthPotion:0,manaPotion:0,...normalizePotions(potions)}); }

function loadStoredVitals(): HeroVitals {
  const savedVitals = localStorage.getItem(VITALS_KEY);
  const fallback: HeroVitals = { hp: 1, mana: 0, maxHp: 1, maxMana: 0 };
  if (!savedVitals) return fallback;

  try {
    const parsed = JSON.parse(savedVitals) as HeroVitals;
    return {
      hp: Math.max(0, Math.floor(parsed.hp)),
      mana: Math.max(0, Math.floor(parsed.mana)),
      maxHp: Math.max(1, Math.floor(parsed.maxHp)),
      maxMana: Math.max(0, Math.floor(parsed.maxMana)),
    };
  } catch {
    return fallback;
  }
}

function saveConsumables(consumables: ConsumablesState): void {
  localStorage.setItem(CONSUMABLES_KEY, JSON.stringify(consumables));
}

export function useCityPotion(id:PotionId):PotionUseResult {
 const consumables=loadConsumables(),vitals=loadStoredVitals();
 if(!(consumables[id]!>0))return {used:false,remaining:consumables[id]??0,vitals};
 const definition=POTIONS[id];
 if("buff" in definition||"cleanse" in definition)return {used:false,remaining:consumables[id]??0,vitals};
 const hero={isAlive:vitals.hp>0,stats:{hp:vitals.hp,mana:vitals.mana,maxHp:vitals.maxHp,maxMana:vitals.maxMana}} as CombatantState;
 if(!applyPotionEffect(hero,id))return {used:false,remaining:consumables[id]??0,vitals};
 vitals.hp=hero.stats.hp;vitals.mana=hero.stats.mana;consumables[id]!--;
 saveConsumables(consumables);saveHeroVitals(vitals);
 return {used:true,remaining:consumables[id]??0,vitals};
}
export function useRestorativePotion():PotionUseResult{return useCityPotion("restorativePotion");}
export function useHealthPotion():PotionUseResult{return useCityPotion("healthPotion");}
export function useManaPotion():PotionUseResult{return useCityPotion("manaPotion");}

export function clearHeroVitals(): void {
  localStorage.removeItem(VITALS_KEY);
}
