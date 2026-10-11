import { POTIONS, isPotionId, type PotionId } from './potions.js';
export const TAVERN_REST_COST = 20;
export const RECOVERY_POTION_IDS = (Object.keys(POTIONS) as PotionId[]).filter(id => !('buff' in POTIONS[id] || 'cleanse' in POTIONS[id]));
export function isRecoveryPotion(id: unknown): id is PotionId { return isPotionId(id) && RECOVERY_POTION_IDS.includes(id); }
export function defeatRecoveryHp(maxHp: number): number { return Math.max(1, Math.floor(maxHp * 0.3)); }
