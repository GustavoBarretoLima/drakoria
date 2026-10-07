import { hasMonsterInsight } from "../../../shared/src/equipment/monsterInsight.js";
import { createStatsForLevel, normalizeHeroLevel } from "../../../shared/src/combat/classStats.js";
import {
  advanceBattleAtb,
  ATB_TICK_MS,
} from "../../../shared/src/combat/atb.js";
import type { BattleAction } from "../../../shared/src/combat/actions.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { rollMonsterDrops } from "../../../shared/src/loot/lootTables.js";
import type {
  BattleEvent,
  BattleState,
  HeroClass,
} from "../../../shared/src/types/combat.js";
import { loadHeroVitals } from "../battle/heroVitals.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
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
  const heroStats = applyEquipmentStats(
    createStatsForLevel(heroClass, heroLevel),
    equippedItems,
  );
  const vitals = loadHeroVitals(heroStats.maxHp, heroStats.maxMana);
  heroStats.hp = vitals.hp;
  heroStats.mana = vitals.mana;
  const enemy = createDemoMonster(monsterId);
  if (monsterId.startsWith("orc-king-boss-lvl-")) enemy.phase = 1;

  battleState = {
    id: `demo-battle-${Date.now()}`,
    hero: {
      id: "demo-player",
      name: localStorage.getItem("nomeHeroi") || "Heroi",
      className: heroClass,
      level: normalizeHeroLevel(heroLevel),
      stats: heroStats,
      atb: 0,
      defending: false,
      isAlive: heroStats.hp > 0,
    },
    enemy,
    rewards: {
      ...baseRewards,
      drops: rollMonsterDrops(monsterId),
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

function applyHeroAction(state: BattleState, action: BattleAction): BattleState {
  const hero = { ...state.hero, stats: { ...state.hero.stats }, atb: 0 };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats } };
  let event: BattleEvent;

  switch (action.type) {
    case "ATTACK": {
      const critical = rollCritical(hero.stats.criticalChance);
      const rawDamage = randomInt(5, 15) + hero.stats.attack;
      const mitigatedDamage = calculateDamageTaken(
        rawDamage,
        enemy.stats.defense,
        enemy.defending,
      );
      const damage = critical
        ? applyCriticalDamage(mitigatedDamage, hero.stats.criticalDamage)
        : mitigatedDamage;
      enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
      enemy.isAlive = enemy.stats.hp > 0;
      enemy.defending = false;
      event = createEvent(
        hero.id,
        enemy.id,
        "ATTACK",
        critical
          ? `CRITICO! ${hero.name} causou ${damage} de dano.`
          : `${hero.name} causou ${damage} de dano.`,
        damage,
        critical,
      );
      break;
    }
    case "DEFEND": {
      hero.defending = true;
      event = createEvent(
        hero.id,
        hero.id,
        "DEFEND",
        `${hero.name} entrou em postura defensiva e reduzira o proximo dano recebido.`,
      );
      break;
    }
    case "CAST_MAGIC": {
      if (hero.stats.mana >= 10) {
        hero.stats.mana -= 10;
        const critical = rollCritical(hero.stats.criticalChance);
        const rawDamage = randomInt(10, 25) + hero.stats.attack;
        const mitigatedDamage = calculateDamageTaken(
          rawDamage,
          enemy.stats.magicDefense,
          enemy.defending,
        );
        const damage = critical
          ? applyCriticalDamage(mitigatedDamage, hero.stats.criticalDamage)
          : mitigatedDamage;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
        enemy.isAlive = enemy.stats.hp > 0;
        enemy.defending = false;
        event = createEvent(
          hero.id,
          enemy.id,
          "CAST_MAGIC",
          critical
            ? `CRITICO! ${hero.name} lançou magia e causou ${damage} de dano.`
            : `${hero.name} lançou magia e causou ${damage} de dano.`,
          damage,
          critical,
        );
      } else {
        event = createEvent(
          hero.id,
          hero.id,
          "CAST_MAGIC",
          `${hero.name} tentou usar magia sem mana suficiente.`,
        );
      }
      break;
    }
    default: {
      const exhaustiveCheck: never = action;
      void exhaustiveCheck;
      return state;
    }
  }

  const finished = !enemy.isAlive;
  return {
    ...state,
    hero,
    enemy,
    finished,
    ...(finished ? { winnerId: hero.id } : {}),
    turnOwnerId: finished ? hero.id : null,
    lastEvent: event,
  };
}

function processEnemyTurn(expectedBattleId: string): void {
  if (!battleState || battleState.id !== expectedBattleId || battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.enemy.id) return;

  const hero = { ...battleState.hero, stats: { ...battleState.hero.stats } };
  const enemy = {
    ...battleState.enemy,
    stats: { ...battleState.enemy.stats },
    atb: 0,
  };
  const entersPhaseTwo =
    enemy.id.startsWith("orc-king-boss-lvl-") &&
    enemy.phase !== 2 &&
    enemy.stats.hp <= Math.floor(enemy.stats.maxHp / 2);
  if (entersPhaseTwo) {
    enemy.phase = 2;
    enemy.stats.attack = Math.floor(enemy.stats.attack * 1.3);
    enemy.stats.defense = Math.floor(enemy.stats.defense * 1.25);
  }

  const usesMagic = enemy.phase === 2 && Math.random() < 0.35;
  const critical = rollCritical(enemy.stats.criticalChance);
  const rawDamage = usesMagic
    ? Math.floor(enemy.stats.attack * 1.15) + 6
    : enemy.stats.attack;
  const mitigatedDamage = calculateDamageTaken(
    rawDamage,
    usesMagic ? hero.stats.magicDefense : hero.stats.defense,
    hero.defending,
  );
  const damage = critical
    ? applyCriticalDamage(mitigatedDamage, enemy.stats.criticalDamage)
    : mitigatedDamage;
  const wasDefending = hero.defending;
  hero.stats.hp = Math.max(0, hero.stats.hp - damage);
  hero.isAlive = hero.stats.hp > 0;
  hero.defending = false;
  const phasePrefix = entersPhaseTwo
    ? "DANGER! O Orc Rei entrou em fúria: ataque e defesa aumentaram. "
    : "";

  battleState = {
    ...battleState,
    hero,
    enemy,
    finished: !hero.isAlive,
    ...(!hero.isAlive ? { winnerId: enemy.id } : {}),
    turnOwnerId: !hero.isAlive ? enemy.id : null,
    lastEvent: createEvent(
      enemy.id,
      hero.id,
      usesMagic ? "CAST_MAGIC" : "ATTACK",
      usesMagic
        ? `${phasePrefix}${enemy.name} lançou magia sombria e causou ${damage} de dano.`
        : critical
          ? `${phasePrefix}CRITICO! ${enemy.name} causou ${damage} de dano.`
          : wasDefending
            ? `${phasePrefix}${enemy.name} atacou, mas ${hero.name} se defendeu e recebeu apenas ${damage} de dano.`
            : `${phasePrefix}${enemy.name} atacou e causou ${damage} de dano.`,
      damage,
      critical,
    ),
  };

  emitState();
  if (battleState.finished) stopAtbLoop();
}

function emitState(): void {
  if (battleState && listener) listener(battleState);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollCritical(criticalChance: number): boolean {
  const normalizedChance = Math.min(100, Math.max(0, criticalChance));
  return Math.random() * 100 < normalizedChance;
}

function applyCriticalDamage(damage: number, criticalDamage: number): number {
  const bonus = Math.max(0, criticalDamage) / 100;
  return Math.max(1, Math.floor(damage * (1 + bonus)));
}

function calculateDamageTaken(
  baseDamage: number,
  defense: number,
  defending: boolean,
): number {
  const safeBaseDamage = Math.max(1, Math.floor(baseDamage));
  const safeDefense = Math.max(0, Math.floor(defense));
  const defenseReduction = Math.floor(safeDefense * 0.5);
  let damage = Math.max(1, safeBaseDamage - defenseReduction);
  if (defending) damage = Math.max(1, Math.floor(damage / 2));
  return damage;
}

function createEvent(
  actorId: string,
  targetId: string,
  action: BattleEvent["action"],
  message: string,
  damage?: number,
  critical?: boolean,
): BattleEvent {
  const event: BattleEvent = { actorId, targetId, action, message };
  if (damage !== undefined) event.damage = damage;
  if (critical !== undefined) event.critical = critical;
  return event;
}
