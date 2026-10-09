import { emptyBerserkState } from "../../../../shared/src/combat/berserkCombat.js";
import { hasBerserkAxe } from "../../../../shared/src/equipment/berserkWeapons.js";
import { canEquipItem } from "../../../../shared/src/equipment/equipmentRules.js";
import { hasMonsterInsight } from "../../../../shared/src/equipment/monsterInsight.js";
import { createStatsForLevel, normalizeHeroLevel } from "../../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../../shared/src/equipment/equipmentStats.js";
import { applySubclassStats, type SubclassId } from "../../../../shared/src/classes/subclasses.js";
import { applyTreeStats, normalizeTreeRanks, normalizeBerserkLoadout } from "../../../../shared/src/classes/skillTrees.js";
import { adaptSubclassWeaponDrops } from "../../../../shared/src/equipment/assassinWeapons.js";
import { rollMonsterDrops } from "../../../../shared/src/loot/lootTables.js";
import { rollSubclassBookDrops } from "../../../../shared/src/loot/subclassBooks.js";
import type {
  BattleState,
  HeroClass,
} from "../../../../shared/src/types/combat.js";
import type { EquipmentItem } from "../../../../shared/src/types/equipment.js";
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

export interface InitialHeroResources {
  hp?: number;
  mana?: number;
}

export function createInitialBattleState(
  heroClass: HeroClass = "guerreiro",
  monsterId = "goblin-normal-lvl-1",
  equippedItems: EquipmentItem[] = [],
  heroLevel = 1,
  initialResources: InitialHeroResources = {},
  subclassId?: SubclassId,
  heroName = "Heroi",
  rawTreeRanks?: unknown,
  rawEquippedSkills?: unknown,
): BattleState {
  const monster = getMonsterById(monsterId);

  if (!monster) throw new Error(`Monstro nao encontrado: ${monsterId}`);

  equippedItems = equippedItems.filter(item => canEquipItem(item, heroClass, heroLevel, subclassId));
  const treeRanks = normalizeTreeRanks(subclassId, heroLevel, rawTreeRanks);
  const heroStats = applyTreeStats(applySubclassStats(
    applyEquipmentStats(
      createStatsForLevel(heroClass, heroLevel),
      equippedItems,
    ),
    subclassId,
  ), subclassId, heroLevel, treeRanks);
  heroStats.hp = Math.min(
    heroStats.maxHp,
    Math.max(0, Math.floor(initialResources.hp ?? heroStats.maxHp)),
  );
  heroStats.mana = Math.min(
    heroStats.maxMana,
    Math.max(0, Math.floor(initialResources.mana ?? heroStats.maxMana)),
  );

  return {
    id: `battle-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    hero: {
      id: "player-1",
      name: heroName,
      className: heroClass,
      level: normalizeHeroLevel(heroLevel),
      ...(subclassId ? { subclassId } : {}), treeRanks,
      ...(subclassId === "berserker" ? { fury: 0, berserk: emptyBerserkState(), hasTwoHandedAxe: hasBerserkAxe(equippedItems), equippedSkills: normalizeBerserkLoadout(heroLevel, treeRanks, rawEquippedSkills) } : {}),
      stats: heroStats,
      atb: 0,
      defending: false,
      isAlive: heroStats.hp > 0,
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
        magicPower: monster.stats.magicPower,
        dodgeChance: 0,
        defense: monster.stats.defense,
        magicDefense:
          monster.stats.magicDefense ??
          getMonsterMagicDefense(monster.stats.defense, monster.stats.magicPower),
        speed: MONSTER_SPEED_BY_FAMILY[monster.family],
        criticalChance: monster.stats.criticalChance,
        criticalDamage: monster.stats.criticalDamage,
      },
      atb: 0,
      defending: false,
      isAlive: true,
      ...(monster.id.startsWith("orc-king-boss-lvl-") ? { phase: 1 } : {}),
    },
    rewards: {
      xp: monster.xpReward,
      gold: monster.goldReward,
      drops: adaptSubclassWeaponDrops(rollMonsterDrops(monster.id), subclassId),
      classBooks: rollSubclassBookDrops(monster.id, Math.random, heroName),
    },
    revealEnemyStats: hasMonsterInsight(equippedItems, heroLevel),
    turnOwnerId: null,
    finished: false,
  };
}
