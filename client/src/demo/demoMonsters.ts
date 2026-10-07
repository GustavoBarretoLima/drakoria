import { createDungeonMonster } from "../../../shared/src/constants/dungeonMonsters.js";
import { createHabitatMonster } from "../../../shared/src/constants/habitatMonsters.js";
import { rollSubclassBookDrops } from "../../../shared/src/loot/subclassBooks.js";
import type {
  BattleRewards,
  CombatantState,
} from "../../../shared/src/types/combat.js";

type DemoMonsterFactory = () => CombatantState;

const ORC_SPRITES = {
  idle: "/img/monstros/orc/idle.gif",
  attack: "/img/monstros/orc/attack.gif",
  damage: "/img/monstros/orc/damage.gif",
  death: "/img/monstros/orc/death.gif",
};

const GOBLIN_SPRITES = {
  idle: "/img/monstros/goblin.gif",
  attack: "/img/monstros/goblin-ataque.gif",
  damage: "/img/monstros/goblin-dano.gif",
  death: "/img/monstros/goblin-dano.gif",
};

function getEarlyDungeonMultiplier(level: number): number {
  return 1 + (Math.max(1, level) - 1) * 0.08;
}

function createScaledDemoMonster(
  family: "goblin" | "orc",
  level: number,
): CombatantState {
  const multiplier = getEarlyDungeonMultiplier(level);
  const isGoblin = family === "goblin";
  const baseHp = isGoblin ? 60 : 95;
  const baseAttack = isGoblin ? 8 : 14;
  const baseDefense = isGoblin ? 3 : 6;
  const baseMagicDefense = isGoblin ? 1 : 3;

  return {
    id: `${family}-normal-lvl-${level}`,
    name: `${isGoblin ? "Goblin" : "Orc"} Nv.${level}`,
    sprites: isGoblin ? GOBLIN_SPRITES : ORC_SPRITES,
    stats: {
      hp: Math.floor(baseHp * multiplier),
      maxHp: Math.floor(baseHp * multiplier),
      mana: 0,
      maxMana: 0,
      magicPower: 0,
      dodgeChance: 0,
      attack: Math.floor(baseAttack * multiplier),
      defense: Math.floor(baseDefense * multiplier),
      magicDefense: Math.floor(baseMagicDefense * multiplier),
      speed: isGoblin ? 12 : 8,
      criticalChance: isGoblin ? 5 : 6,
      criticalDamage: isGoblin ? 50 : 60,
    },
    atb: 0,
    defending: false,
    isAlive: true,
  };
}

function createScaledMiniBoss(level: number): CombatantState {
  const multiplier = getEarlyDungeonMultiplier(level);

  return {
    id: `orc-warlord-mini-boss-lvl-${level}`,
    name: `Senhor da Guerra Orc Nv.${level}`,
    sprites: ORC_SPRITES,
    stats: {
      hp: Math.floor(155 * multiplier),
      maxHp: Math.floor(155 * multiplier),
      mana: 0,
      maxMana: 0,
      magicPower: 0,
      dodgeChance: 0,
      attack: Math.floor(18 * multiplier),
      defense: Math.floor(9 * multiplier),
      magicDefense: Math.floor(5 * multiplier),
      speed: 8,
      criticalChance: 8,
      criticalDamage: 70,
    },
    atb: 0,
    defending: false,
    isAlive: true,
  };
}

const DEMO_MONSTERS: Record<string, DemoMonsterFactory> = {
  "goblin-normal-lvl-1": () => createScaledDemoMonster("goblin", 1),
  "orc-normal-lvl-1": () => createScaledDemoMonster("orc", 1),
  "orc-warlord-mini-boss-lvl-1": () => createScaledMiniBoss(1),
};

const DEMO_REWARDS: Record<string, BattleRewards> = {
  "goblin-normal-lvl-1": { xp: 15, gold: 8 },
  "orc-normal-lvl-1": { xp: 15, gold: 8 },
  "orc-warlord-mini-boss-lvl-1": { xp: 35, gold: 20 },
};

function parseDemoMonster(monsterId: string): CombatantState | null {
  const normalMatch = /^(goblin|orc)-normal-lvl-(\d+)$/.exec(monsterId);
  if (normalMatch) {
    const family = normalMatch[1] as "goblin" | "orc";
    const level = Number(normalMatch[2]);
    if (level >= 1 && level <= 15) {
      return createScaledDemoMonster(family, level);
    }
  }

  const miniBossMatch = /^orc-warlord-mini-boss-lvl-(\d+)$/.exec(monsterId);
  if (miniBossMatch) {
    const level = Number(miniBossMatch[1]);
    if (level === 1 || (level >= 5 && level <= 15)) {
      return createScaledMiniBoss(level);
    }
  }

  return null;
}

function createScaledRewards(monsterId: string): BattleRewards | null {
  const normalMatch = /^(goblin|orc)-normal-lvl-(\d+)$/.exec(monsterId);
  if (normalMatch) {
    const level = Number(normalMatch[2]);
    if (level >= 1 && level <= 15) {
      const multiplier = getEarlyDungeonMultiplier(level);
      return {
        xp: Math.max(1, Math.floor(15 * multiplier)),
        gold: Math.max(1, Math.floor(8 * multiplier)),
        classBooks: rollSubclassBookDrops(monsterId),
      };
    }
  }

  const miniBossMatch = /^orc-warlord-mini-boss-lvl-(\d+)$/.exec(monsterId);
  if (miniBossMatch) {
    const level = Number(miniBossMatch[1]);
    if (level === 1 || (level >= 5 && level <= 15)) {
      const multiplier = getEarlyDungeonMultiplier(level);
      return {
        xp: Math.max(1, Math.floor(35 * multiplier)),
        gold: Math.max(1, Math.floor(20 * multiplier)),
        classBooks: rollSubclassBookDrops(monsterId),
      };
    }
  }

  return null;
}

export function createDemoMonster(monsterId: string): CombatantState {
  const dungeon = createDungeonMonster(monsterId) ?? createHabitatMonster(monsterId);
  if (dungeon) {
    const stats = dungeon.stats;
    return {
      id: dungeon.id,
      name: dungeon.name,
      sprites: dungeon.sprites,
      stats: {
        ...stats,
        dodgeChance: 0,
        magicDefense: dungeon.stats.magicDefense ?? 0,
        speed: { goblin: 12, orc: 8, undead: 9, beast: 14, spider: 13, spirit: 13, plant: 7, reptile: 11 }[
          dungeon.family as "goblin" | "orc" | "undead" | "beast" | "spider" | "spirit" | "plant" | "reptile"
        ],
      },
      atb: 0,
      defending: false,
      isAlive: true,
      ...(dungeon.id.startsWith("orc-king-boss-lvl-") ? { phase: 1 } : {}),
    };
  }
  const parsed = parseDemoMonster(monsterId);
  if (parsed) return parsed;

  const fallbackFactory = DEMO_MONSTERS["goblin-normal-lvl-1"]!;
  const factory = DEMO_MONSTERS[monsterId] ?? fallbackFactory;
  return factory();
}

export function getDemoMonsterRewards(monsterId: string): BattleRewards {
  const dungeon = createDungeonMonster(monsterId) ?? createHabitatMonster(monsterId);
  if (dungeon) {
    return {
      xp: dungeon.xpReward,
      gold: dungeon.goldReward,
      classBooks: rollSubclassBookDrops(monsterId),
    };
  }
  return (
    createScaledRewards(monsterId) ??
    DEMO_REWARDS[monsterId] ??
    DEMO_REWARDS["goblin-normal-lvl-1"]!
  );
}
