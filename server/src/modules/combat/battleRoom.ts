import { createInitialStats } from "../../../../shared/src/combat/classStats.js";
import type {
  BattleState,
  HeroClass,
} from "../../../../shared/src/types/combat.js";

export function createInitialBattleState(
  heroClass: HeroClass = "guerreiro",
): BattleState {
  return {
    id: "battle-1",
    hero: {
      id: "player-1",
      name: "Heroi",
      className: heroClass,
      stats: createInitialStats(heroClass),
      defending: false,
      isAlive: true,
    },
    enemy: {
      id: "goblin-1",
      name: "Goblin",
      stats: {
        hp: 60,
        maxHp: 60,
        mana: 0,
        maxMana: 0,
        attack: 8,
        defense: 3,
      },
      defending: false,
      isAlive: true,
    },
    turnOwnerId: "player-1",
    finished: false,
  };
}
