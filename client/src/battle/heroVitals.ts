import { POTIONS, normalizePotions, applyPotionEffect, type PotionId, type PotionInventory } from "../../../shared/src/items/potions.js";
import type { CombatantState } from "../../../shared/src/types/combat.js";
import { isSaveRecord, saveInteger } from "../../../shared/src/progression/playerProgress.js";
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

function normalizeVitals(value: unknown, maxHp: number, maxMana: number): HeroVitals {
  const parsed = isSaveRecord(value) ? value : {};
  return {
    hp: saveInteger(parsed.hp, maxHp, 0, maxHp),
    mana: saveInteger(parsed.mana, maxMana, 0, maxMana),
    maxHp,
    maxMana,
  };
}

export function loadHeroVitals(maxHp: number, maxMana: number): HeroVitals {
  maxHp = saveInteger(maxHp, 1, 1);
  maxMana = saveInteger(maxMana, 0);
  const saved = localStorage.getItem(VITALS_KEY);
  if (!saved) return { hp: maxHp, mana: maxMana, maxHp, maxMana };

  try {
    return normalizeVitals(JSON.parse(saved), maxHp, maxMana);
  } catch {
    return { hp: maxHp, mana: maxMana, maxHp, maxMana };
  }
}

export function saveHeroVitals(vitals: HeroVitals): void {
  localStorage.setItem(VITALS_KEY, JSON.stringify(normalizeVitals(
    vitals, saveInteger(vitals.maxHp, 1, 1), saveInteger(vitals.maxMana, 0),
  )));
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
    const parsed: unknown = JSON.parse(savedVitals);
    if (!isSaveRecord(parsed)) return fallback;
    return normalizeVitals(parsed, saveInteger(parsed.maxHp, 1, 1), saveInteger(parsed.maxMana, 0));
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
