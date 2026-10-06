import type {
  BattleState,
  BattleEvent,
} from "../../../../shared/src/types/combat.js";
import type { BattleAction } from "../../../../shared/src/combat/actions.js";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollCritical(criticalChance: number): boolean {
  const normalizedChance = Math.min(100, Math.max(0, criticalChance));
  return Math.random() * 100 < normalizedChance;
}

export function applyCriticalDamage(
  damage: number,
  criticalDamage: number,
): number {
  const bonus = Math.max(0, criticalDamage) / 100;
  return Math.max(1, Math.floor(damage * (1 + bonus)));
}

export function calculateDamageTaken(
  baseDamage: number,
  defense: number,
  defending: boolean,
): number {
  const safeBaseDamage = Math.max(1, Math.floor(baseDamage));
  const safeDefense = Math.max(0, Math.floor(defense));

  const defenseReduction = Math.floor(safeDefense * 0.5);
  let damage = Math.max(1, safeBaseDamage - defenseReduction);

  if (defending) {
    damage = Math.max(1, Math.floor(damage / 2));
  }

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
  const event: BattleEvent = {
    actorId,
    targetId,
    action,
    message,
  };

  if (damage !== undefined) event.damage = damage;
  if (critical !== undefined) event.critical = critical;

  return event;
}

export function applyBattleAction(
  state: BattleState,
  action: BattleAction,
): BattleState {
  if (state.finished) return state;
  if (state.turnOwnerId !== state.hero.id) return state;

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
      throw new Error("Unknown action type");
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
