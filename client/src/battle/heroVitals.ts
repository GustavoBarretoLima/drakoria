export interface HeroVitals {
  hp: number;
  mana: number;
  maxHp: number;
  maxMana: number;
}

export interface ConsumablesState {
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

  try {
    const parsed = JSON.parse(saved) as Partial<ConsumablesState>;
    return {
      restorativePotion: Math.max(0, Math.floor(Number(parsed.restorativePotion ?? 0))),
      healthPotion: Math.max(0, Math.floor(Number(parsed.healthPotion ?? 0))),
      manaPotion: Math.max(0, Math.floor(Number(parsed.manaPotion ?? 0))),
    };
  } catch {
    return { restorativePotion: 0, healthPotion: 0, manaPotion: 0 };
  }
}

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

export function useRestorativePotion(): PotionUseResult {
  const consumables = loadConsumables();
  const vitals = loadStoredVitals();

  if (
    consumables.restorativePotion <= 0 ||
    (vitals.hp >= vitals.maxHp && vitals.mana >= vitals.maxMana)
  ) {
    return {
      used: false,
      remaining: consumables.restorativePotion,
      vitals,
    };
  }

  vitals.hp = Math.min(vitals.maxHp, vitals.hp + 40);
  vitals.mana = Math.min(vitals.maxMana, vitals.mana + 20);
  consumables.restorativePotion -= 1;
  saveConsumables(consumables);
  saveHeroVitals(vitals);

  return {
    used: true,
    remaining: consumables.restorativePotion,
    vitals,
  };
}

export function useHealthPotion(): PotionUseResult {
  const consumables = loadConsumables();
  const vitals = loadStoredVitals();

  if (consumables.healthPotion <= 0 || vitals.hp >= vitals.maxHp) {
    return { used: false, remaining: consumables.healthPotion, vitals };
  }

  vitals.hp = Math.min(vitals.maxHp, vitals.hp + 40);
  consumables.healthPotion -= 1;
  saveConsumables(consumables);
  saveHeroVitals(vitals);

  return { used: true, remaining: consumables.healthPotion, vitals };
}

export function useManaPotion(): PotionUseResult {
  const consumables = loadConsumables();
  const vitals = loadStoredVitals();

  if (consumables.manaPotion <= 0 || vitals.mana >= vitals.maxMana) {
    return { used: false, remaining: consumables.manaPotion, vitals };
  }

  vitals.mana = Math.min(vitals.maxMana, vitals.mana + 20);
  consumables.manaPotion -= 1;
  saveConsumables(consumables);
  saveHeroVitals(vitals);

  return { used: true, remaining: consumables.manaPotion, vitals };
}

export function clearHeroVitals(): void {
  localStorage.removeItem(VITALS_KEY);
}
