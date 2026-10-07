import { applyBattleAction as applyHeroAction, applyEnemyTurn } from "../../../shared/src/combat/combatEngine.js";
import { hasMonsterInsight } from "../../../shared/src/equipment/monsterInsight.js";
import { createStatsForLevel, normalizeHeroLevel } from "../../../shared/src/combat/classStats.js";
import { applySubclassStats } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats, normalizeTreeRanks } from "../../../shared/src/classes/skillTrees.js";
import { loadSubclassProgress } from "../progression/subclassClient.js";
import {
  advanceBattleAtb,
  ATB_TICK_MS,
} from "../../../shared/src/combat/atb.js";
import type { BattleAction } from "../../../shared/src/combat/actions.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { rollMonsterDrops } from "../../../shared/src/loot/lootTables.js";
import { rollSubclassBookDrops } from "../../../shared/src/loot/subclassBooks.js";
import type {
  BattleState,
  HeroClass,
} from "../../../shared/src/types/combat.js";
import { loadHeroVitals } from "../battle/heroVitals.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import {
  createDemoMonster,
  getDemoMonsterRewards,
} from "./demoMonsters.js";

type BattleListener = (state: BattleState) => void;

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
  const classBooks = rollSubclassBookDrops(monsterId, Math.random, localStorage.getItem("nomeHeroi") || "");
  if (monsterId.startsWith("orc-king-boss-lvl-")) enemy.phase = 1;

  battleState = {
    id: `demo-battle-${Date.now()}`,
    hero: {
      id: "demo-player",
      name: localStorage.getItem("nomeHeroi") || "Heroi",
      className: heroClass,
      level: normalizeHeroLevel(heroLevel),
      ...(subclassId ? { subclassId } : {}), treeRanks,
      stats: heroStats,
      atb: 0,
      defending: false,
      isAlive: heroStats.hp > 0,
    },
    enemy,
    rewards: {
      ...baseRewards,
      drops: rollMonsterDrops(monsterId),
      ...(classBooks.length > 0 ? { classBooks } : {}),
    },
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
