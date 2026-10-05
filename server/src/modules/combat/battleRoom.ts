import { createInitialStats } from "../../../../shared/src/combat/classStats.js";
import type {
  BattleState,
  HeroClass,
} from "../../../../shared/src/types/combat.js";
import { getMonsterById } from "../monsters/monsterService.js";

const DEFAULT_MONSTER_SPEED = 10;

function getMonsterMagicDefense(defense: number, magicPower: number): number {
  return Math.max(0, Math.floor((defense + magicPower) / 2));
}

export function createInitialBattleState(
  heroClass: HeroClass = "guerreiro",
  monsterId = "goblin-normal-lvl-1",
): BattleState {
  const monster = getMonsterById(monsterId);

  if (!monster) {
    throw new Error(`Monstro nao encontrado: ${monsterId}`);
  }

  return {
    id: `battle-${Date.now()}`,
    hero: {
      id: "player-1",
      name: "Heroi",
      className: heroClass,
      stats: createInitialStats(heroClass),
      defending: false,
      isAlive: true,
    },
    enemy: {
      id: monster.id,
      name: monster.name,
      stats: {
        hp: monster.stats.hp,
        maxHp: monster.stats.maxHp,
        mana: monster.stats.mana,
        maxMana: monster.stats.maxMana,
        attack: monster.stats.attack,
        defense: monster.stats.defense,
        magicDefense:
          monster.stats.magicDefense ??
          getMonsterMagicDefense(
            monster.stats.defense,
            monster.stats.magicPower,
          ),
        speed: DEFAULT_MONSTER_SPEED,
        criticalChance: monster.stats.criticalChance,
        criticalDamage: monster.stats.criticalDamage,
      },
      defending: false,
      isAlive: true,
    },
    turnOwnerId: "player-1",
    finished: false,
  };
}
