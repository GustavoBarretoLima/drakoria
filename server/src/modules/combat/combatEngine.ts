import type {
  BattleState,
  CombatantState,
  BattleEvent,
} from "../../../../shared/src/types/combat.js";
import type { BattleAction } from "../../../../shared/src/combat/actions.js";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function calculateDamageTaken(baseDamage: number, defending: boolean) {
  if (!defending) return baseDamage;
  return Math.max(1, Math.floor(baseDamage / 2));
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

  if (damage !== undefined) {
    event.damage = damage;
  }

  if (critical !== undefined) {
    event.critical = critical;
  }

  return event;
}

export function applyBattleAction(
  state: BattleState,
  action: BattleAction,
): BattleState {
  if (state.finished) return state;
  if (state.turnOwnerId !== state.hero.id) return state;

  const hero = { ...state.hero, stats: { ...state.hero.stats } };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats } };

  let event: BattleEvent;

  switch (action.type) {
    case "ATTACK": {
      const critical = Math.random() < 0.2;
      let damage = randomInt(5, 15) + hero.stats.attack;

      if (critical) damage *= 2;

      enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
      enemy.isAlive = enemy.stats.hp > 0;

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
        const damage = randomInt(10, 25) + hero.stats.attack;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
        enemy.isAlive = enemy.stats.hp > 0;

        event = createEvent(
          hero.id,
          enemy.id,
          "CAST_MAGIC",
          `${hero.name} lançou magia e causou ${damage} de dano.`,
          damage,
          false,
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
    turnOwnerId: finished ? hero.id : enemy.id,
    lastEvent: event,
  };
}
