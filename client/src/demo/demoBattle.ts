import { applyBattleAction as applyHeroAction, applyEnemyTurn, tickHeroDamage } from "../../../shared/src/combat/combatEngine.js";
import { emptyBerserkState, finishBerserkAction, tickBerserkBleed } from "../../../shared/src/combat/berserkCombat.js";
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
import { loadHeroVitals } from "../battle/heroVitals.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import {
  createDemoMonster,
  getDemoMonsterRewards,
} from "./demoMonsters.js";

type BattleListener = (state: BattleState) => void;
export type DemoConsumableId = "healthPotion" | "manaPotion" | "restorativePotion";

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

export function useDemoConsumable(itemId: DemoConsumableId): boolean {
  if (!battleState || battleState.finished) return false;
  if (battleState.turnOwnerId !== battleState.hero.id) return false;

  const hero = { ...battleState.hero, stats: { ...battleState.hero.stats }, atb: 0 };
  const beforeHp = hero.stats.hp;
  const beforeMana = hero.stats.mana;

  if (itemId === "healthPotion" || itemId === "restorativePotion") {
    hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + 40);
  }
  if (itemId === "manaPotion" || itemId === "restorativePotion") {
    hero.stats.mana = Math.min(hero.stats.maxMana, hero.stats.mana + 20);
  }

  const recoveredHp = hero.stats.hp - beforeHp;
  const recoveredMana = hero.stats.mana - beforeMana;
  if (recoveredHp <= 0 && recoveredMana <= 0) return false;

  const enemy = { ...battleState.enemy, stats: { ...battleState.enemy.stats } };
  const statusMessage = tickHeroDamage(hero) + tickBerserkBleed(enemy);
  hero.skillCooldowns = Object.fromEntries(Object.entries(hero.skillCooldowns ?? {}).map(([id, value]) => [id, Math.max(0, (value ?? 0) - 1)]));
  finishBerserkAction(hero, battleState.hero);
  hero.skillLockedTurns = Math.max(0, (hero.skillLockedTurns ?? 0) - 1);
  const itemName = itemId === "healthPotion"
    ? "Poção de HP"
    : itemId === "manaPotion"
      ? "Poção de Mana"
      : "Poção Restauradora";

  battleState = {
    ...battleState,
    hero, enemy,
    turnOwnerId: !hero.isAlive ? enemy.id : !enemy.isAlive ? hero.id : null,
    finished: !hero.isAlive || !enemy.isAlive,
    ...(!hero.isAlive ? { winnerId: enemy.id } : !enemy.isAlive ? { winnerId: hero.id } : {}),
    lastEvent: {
      actorId: hero.id,
      targetId: hero.id,
      action: "DEFEND",
      special: itemName,
      message: `${statusMessage}${hero.name} usou ${itemName}.${recoveredHp > 0 ? ` +${recoveredHp} HP.` : ""}${recoveredMana > 0 ? ` +${recoveredMana} MP.` : ""}`,
    },
  };
  if (battleState.finished) stopAtbLoop();
  emitState();
  return true;
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
