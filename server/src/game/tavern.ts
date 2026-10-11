import type { PoolClient } from 'pg';
import { POTIONS, normalizePotions, applyPotionEffect, type PotionId, type PotionInventory } from '../../../shared/src/items/potions.js';
import { RECOVERY_POTION_IDS, isRecoveryPotion, TAVERN_REST_COST } from '../../../shared/src/items/tavern.js';
import type { Stats, CombatantState } from '../../../shared/src/types/combat.js';
import { AuthError } from '../auth/security.js';
import { onlyFields, uuid } from './rules.js';
export interface TavernCharacter { id: string; version: string; gold: string; current_hp: number | null; current_mana: number | null; potion_inventory: PotionInventory; }
export type TavernCommand = { operation: 'buy'; potionId: PotionId; quantity: number } | { operation: 'use'; potionId: PotionId } | { operation: 'rest' };
const icons: Partial<Record<PotionId, string>> = { healthPotion:'hp', greaterHealthPotion:'hp_media', superiorHealthPotion:'hp_grande', manaPotion:'mana', greaterManaPotion:'mana_media', superiorManaPotion:'mana_grande', restorativePotion:'restauradora', greaterRestorativePotion:'restauradora_superior', elixir:'elixir' };
function hero(stats: Stats): CombatantState { return { id:'preview', name:'Hero', stats:{...stats}, isAlive:stats.hp > 0, atb:0, defending:false }; }
export function tavernSnapshot(character: TavernCharacter, stats: Stats) {
  const inventory = normalizePotions(character.potion_inventory);
  return { restCost:TAVERN_REST_COST,
    restBlocked:stats.hp >= stats.maxHp && stats.mana >= stats.maxMana ? 'HP e mana já estão completos.' : Number(character.gold) < TAVERN_REST_COST ? 'Ouro insuficiente.' : null,
    potions:RECOVERY_POTION_IDS.map(id => ({ id, ...POTIONS[id], icon:`/game-assets/potions/${icons[id]}.png`, quantity:inventory[id] ?? 0,
      buyBlocked:(inventory[id] ?? 0) >= 9999 ? 'Limite de estoque atingido.' : Number(character.gold) < POTIONS[id].price ? 'Ouro insuficiente.' : null,
      useBlocked:!(inventory[id]! > 0) ? 'Você não possui esta poção.' : !applyPotionEffect(hero(stats),id) ? 'Sem recursos a recuperar.' : null })) };
}
export function parseTavernCommand(operation: string, body: Record<string, unknown>): TavernCommand {
  onlyFields(body, ['requestId', 'version', ...(operation === 'buy' ? ['potionId','quantity'] : operation === 'use' ? ['potionId'] : [])]);
  if (!uuid(body.requestId) || typeof body.version !== 'string' || !/^\d{1,19}$/.test(body.version)) throw new AuthError(400,'Comando inválido.');
  if (operation === 'rest') return { operation };
  if (!isRecoveryPotion(body.potionId)) throw new AuthError(400,'Poção indisponível para preparação.');
  if (operation === 'use') return { operation, potionId:body.potionId };
  if (operation === 'buy' && Number.isInteger(body.quantity) && Number(body.quantity) >= 1 && Number(body.quantity) <= 99) return { operation, potionId:body.potionId, quantity:Number(body.quantity) };
  throw new AuthError(400,'Compra inválida.');
}
export async function tavernCommand(client: PoolClient, character: TavernCharacter, stats: Stats, requestId: string, version: string, command: TavernCommand, fighting: boolean) {
  const previous = await client.query('SELECT command FROM online_tavern_commands WHERE character_id = $1 AND request_id = $2',[character.id,requestId]);
  if (previous.rows[0]) {
    const stored = previous.rows[0].command;
    if (Object.keys(stored).length !== Object.keys(command).length || Object.entries(command).some(([key,value])=>stored[key] !== value)) throw new AuthError(409,'Identificador usado em outro comando.');
    return false;
  }
  if (character.version !== version) throw new AuthError(409,'O personagem mudou. Atualize para continuar.');
  if (fighting) throw new AuthError(409,'Conclua a batalha antes de usar a Taberna.');
  const inventory = normalizePotions(character.potion_inventory), before = { gold:character.gold, hp:stats.hp, mana:stats.mana };
  if (command.operation === 'buy') {
    if (!isRecoveryPotion(command.potionId) || !Number.isInteger(command.quantity) || command.quantity < 1 || command.quantity > 99) throw new AuthError(400,'Compra inválida.');
    const count = inventory[command.potionId] ?? 0, price = POTIONS[command.potionId].price * command.quantity;
    if (count + command.quantity > 9999) throw new AuthError(409,'Limite de estoque atingido.');
    if (Number(character.gold) < price) throw new AuthError(409,'Ouro insuficiente.');
    character.gold = String(Number(character.gold) - price); inventory[command.potionId] = count + command.quantity;
  } else if (command.operation === 'use') {
    if (!isRecoveryPotion(command.potionId)) throw new AuthError(400,'Poção indisponível para preparação.');
    if (!(inventory[command.potionId]! > 0)) throw new AuthError(409,'Você não possui esta poção.');
    const target = hero(stats);
    if (!applyPotionEffect(target,command.potionId)) throw new AuthError(409,'Sem recursos a recuperar. Sua poção foi preservada.');
    inventory[command.potionId]!--; stats.hp = target.stats.hp; stats.mana = target.stats.mana;
  } else {
    if (stats.hp >= stats.maxHp && stats.mana >= stats.maxMana) throw new AuthError(409,'HP e mana já estão completos.');
    if (Number(character.gold) < TAVERN_REST_COST) throw new AuthError(409,'Ouro insuficiente.');
    character.gold = String(Number(character.gold) - TAVERN_REST_COST); stats.hp = stats.maxHp; stats.mana = stats.maxMana;
  }
  character.potion_inventory = inventory; character.current_hp = stats.hp; character.current_mana = stats.mana;
  await client.query('INSERT INTO online_tavern_commands (character_id,request_id,command,receipt) VALUES ($1,$2,$3,$4)',[character.id,requestId,JSON.stringify(command),JSON.stringify({ before, after:{ gold:character.gold, hp:stats.hp, mana:stats.mana }, potionId:command.operation === 'rest' ? null : command.potionId, quantity:command.operation === 'buy' ? command.quantity : command.operation === 'use' ? -1 : 0 })]);
  return true;
}
