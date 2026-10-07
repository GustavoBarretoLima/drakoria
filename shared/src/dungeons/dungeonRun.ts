import type { DungeonConfig } from "./dungeonEncounters.js";

export interface DungeonRunState {
  dungeonId: string;
  depth: number;
  victories: number;
  bossPending: boolean;
  bossDefeated: boolean;
}

export interface DungeonRunEncounter {
  monsterId: string;
  type: string;
  level: number;
  rank: "normal" | "elite" | "boss";
  danger: boolean;
}

export function createDungeonRun(dungeonId: string): DungeonRunState {
  return {
    dungeonId,
    depth: 1,
    victories: 0,
    bossPending: false,
    bossDefeated: false,
  };
}

export function recordDungeonVictory(
  config: DungeonConfig,
  run: DungeonRunState,
  defeatedMonsterId: string,
): DungeonRunState {
  const defeatedBoss = defeatedMonsterId.startsWith("orc-king-boss-lvl-");
  const victories = run.victories + 1;
  const bossPending = Boolean(
    !defeatedBoss &&
      !run.bossDefeated &&
      config.bossAfterVictories !== undefined &&
      victories >= config.bossAfterVictories,
  );

  return {
    ...run,
    depth: run.depth + 1,
    victories,
    bossPending,
    bossDefeated: run.bossDefeated || defeatedBoss,
  };
}

export function pickDungeonRunEncounter(
  config: DungeonConfig,
  run: DungeonRunState,
  random: () => number = Math.random,
): DungeonRunEncounter {
  if (run.bossPending && config.bossMonster) {
    const level = config.bossLevel ?? Math.max(config.maxLevel, config.minLevel);
    return {
      monsterId: `${config.bossMonster}-boss-lvl-${level}`,
      type: config.bossMonster,
      level,
      rank: "boss",
      danger: true,
    };
  }

  const introMonsters =
    config.introMonsters && run.depth <= (config.introDepths ?? 0)
      ? config.introMonsters
      : config.monsters;
  const type = introMonsters[Math.floor(random() * introMonsters.length)]!;
  const depthBonus = Math.max(0, run.depth - 1);
  const lower = Math.min(config.maxLevel, config.minLevel + depthBonus);
  const upper = Math.min(config.maxLevel, lower + 2);
  const level = Math.floor(random() * (upper - lower + 1)) + lower;
  const rank = config.rank ??
    (config.eliteChance && random() < config.eliteChance ? "elite" : "normal");

  return {
    monsterId: `${type}-${rank}-lvl-${level}`,
    type,
    level,
    rank,
    danger: false,
  };
}
