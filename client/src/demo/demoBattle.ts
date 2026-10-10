import { applyBattleAction as applyHeroAction, applyEnemyTurn } from "../../../shared/src/combat/combatEngine.js";
import { emptyBerserkState } from "../../../shared/src/combat/berserkCombat.js";
import { hasBerserkAxe } from "../../../shared/src/equipment/berserkWeapons.js";
import { hasMonsterInsight } from "../../../shared/src/equipment/monsterInsight.js";
import { createStatsForLevel, normalizeHeroLevel } from "../../../shared/src/combat/classStats.js";
import { applySubclassStats } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats, normalizeTreeRanks, normalizeBerserkLoadout } from "../../../shared/src/classes/skillTrees.js";
import { loadSubclassProgress } from "../progression/subclassClient.js";
import {
  advanceBattleAtb,
  ATB_TICK_MS,
} from "../../../shared/src/combat/atb.js";
import type { BattleAction } from "../../../shared/src/combat/actions.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { adaptSubclassWeaponDrops } from "../../../shared/src/equipment/assassinWeapons.js";
import { rollMonsterDrops } from "../../../shared/src/loot/lootTables.js";
import { rollSubclassBookDrops } from "../../../shared/src/loot/subclassBooks.js";
import type {
  BattleState,
  HeroClass,
} from "../../../shared/src/types/combat.js";
import { applyPotionAction } from "../../../shared/src/combat/potionAction.js";
import type { PotionId } from "../../../shared/src/items/potions.js";
import { loadConsumables, savePotionInventory, loadHeroVitals } from "../battle/heroVitals.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import {
  createDemoMonster,
  getDemoMonsterRewards,
} from "./demoMonsters.js";

type BattleListener = (state: BattleState) => void;
export type DemoConsumableId = PotionId;

let battleState: BattleState | null = null;
let listener: BattleListener | null = null;
let atbTimer: number | null = null;

export function isPagesDemoMode(): boolean {
  return (
    import.meta.env.PROD &&
    window.location.hostname.endsWith("github.io") &&
    window.location.pathname.startsWith("/drakoria/")
  );
}

export function subscribeDemoBattle(nextListener: BattleListener): void {
  listener = nextListener;
}

function stopAtbLoop(): void {
  if (atbTimer === null) return;
  window.clearInterval(atbTimer);
  atbTimer = null;
}

function startAtbLoop(expectedBattleId: string): void {
  stopAtbLoop();
  atbTimer = window.setInterval(() => {
    if (!battleState || battleState.id !== expectedBattleId || battleState.finished) {
      stopAtbLoop();
      return;
    }
    const nextState = advanceBattleAtb(battleState);
    if (nextState !== battleState) {
      battleState = nextState;
      emitState();
    }
    if (battleState.turnOwnerId === battleState.enemy.id) {
      processEnemyTurn(expectedBattleId);
    }
  }, ATB_TICK_MS);
}

export function startDemoBattle(
  heroClass: HeroClass,
  monsterId = "goblin-normal-lvl-1",
  heroLevel = 1,
): void {
  stopAtbLoop();
  const baseRewards = getDemoMonsterRewards(monsterId);
  const equippedItems = getEquippedItems();
  const subclassId = getActiveSubclass(heroClass);
  const treeRanks = normalizeTreeRanks(subclassId, heroLevel, loadSubclassProgress().treeRanks);
  const heroStats = applyTreeStats(applySubclassStats(
    applyEquipmentStats(
      createStatsForLevel(heroClass, heroLevel),
      equippedItems,
    ),
    subclassId,
  ), subclassId, heroLevel, treeRanks);
  const vitals = loadHeroVitals(heroStats.maxHp, heroStats.maxMana);
  heroStats.hp = vitals.hp;
  heroStats.mana = vitals.mana;
  const enemy = createDemoMonster(monsterId);
  const classBooks = rollSubclassBookDrops(monsterId);
  if (monsterId.startsWith("orc-king-boss-lvl-")) enemy.phase = 1;

  battleState = {
    id: `demo-battle-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    hero: {
      id: "demo-player",
      name: localStorage.getItem("nomeHeroi") || "Heroi",
      className: heroClass,
      level: normalizeHeroLevel(heroLevel),
      ...(subclassId ? { subclassId } : {}), treeRanks,
      ...(subclassId === "berserker" ? { fury: 0, berserk: emptyBerserkState(), hasTwoHandedAxe: hasBerserkAxe(equippedItems), equippedSkills: normalizeBerserkLoadout(heroLevel, treeRanks, loadSubclassProgress().equippedSkills) } : {}),
      stats: heroStats,
      atb: 0,
      defending: false,
      isAlive: heroStats.hp > 0,
    },
    enemy,
    rewards: {
      ...baseRewards,
      drops: adaptSubclassWeaponDrops(rollMonsterDrops(monsterId), subclassId),
      ...(classBooks.length > 0 ? { classBooks } : {}),
    },
    potions:loadConsumables(),
    revealEnemyStats: hasMonsterInsight(equippedItems, heroLevel),
    turnOwnerId: null,
    finished: false,
  };

  emitState();
  startAtbLoop(battleState.id);
}

export function performDemoAction(action: BattleAction): void {
  if (!battleState || battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.hero.id) return;

  battleState = applyHeroAction(battleState, action);
  emitState();

  if (battleState.finished) stopAtbLoop();
}

export function useDemoConsumable(itemId:DemoConsumableId):boolean {
 if(!battleState)return false;
 const next=applyPotionAction(battleState,itemId);
 if(next===battleState)return false;
 battleState=next;savePotionInventory(next.potions??{});
 if(next.finished)stopAtbLoop();emitState();return true;
}

function processEnemyTurn(expectedBattleId: string): void {
  if (!battleState || battleState.id !== expectedBattleId || battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.enemy.id) return;

  battleState = applyEnemyTurn(battleState);

  emitState();
  if (battleState.finished) stopAtbLoop();
}

function emitState(): void {
  if (battleState && listener) listener(battleState);
}
