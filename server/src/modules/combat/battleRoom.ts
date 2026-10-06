import { createInitialStats } from "../../../../shared/src/combat/classStats.js";
import { rollMonsterDrops } from "../../../../shared/src/loot/lootTables.js";
import type {
  BattleState,
  HeroClass,
} from "../../../../shared/src/types/combat.js";
import type { MonsterFamily } from "../../../../shared/src/types/monster.js";
import { getMonsterById } from "../monsters/monsterService.js";

const MONSTER_SPEED_BY_FAMILY: Record<MonsterFamily, number> = {
  goblin: 12,
  orc: 8,
  undead: 9,
  beast: 14,
  demon: 11,
  dragon: 10,
  elemental: 10,
  slime: 7,
  spider: 13,
  troll: 6,
  construct: 5,
  cultist: 10,
  reptile: 11,
  plant: 7,
  spirit: 13,
  insect: 8,
  aquatic: 12,
  giant: 5,
  void: 12,
};

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
      atb: 0,
      defending: false,
      isAlive: true,
    },
    enemy: {
      id: monster.id,
      name: monster.name,
      sprites: monster.sprites,
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
        speed: MONSTER_SPEED_BY_FAMILY[monster.family],
        criticalChance: monster.stats.criticalChance,
        criticalDamage: monster.stats.criticalDamage,
      },
      atb: 0,
      defending: false,
      isAlive: true,
    },
    rewards: {
      xp: monster.xpReward,
      gold: monster.goldReward,
      drops: rollMonsterDrops(monster.id),
    },
    turnOwnerId: null,
    finished: false,
  };
}
