import type { MonsterFamily, MonsterRank } from "../types/monster.js";

export const MONSTER_RANK_META: Record<
  MonsterRank,
  {
    label: string;
    powerMultiplier: number;
    rewardMultiplier: number;
  }
> = {
  minion: {
    label: "Lacaio",
    powerMultiplier: 0.75,
    rewardMultiplier: 0.7,
  },
  normal: {
    label: "Normal",
    powerMultiplier: 1,
    rewardMultiplier: 1,
  },
  elite: {
    label: "Elite",
    powerMultiplier: 1.45,
    rewardMultiplier: 1.7,
  },
  champion: {
    label: "Campeão",
    powerMultiplier: 2,
    rewardMultiplier: 2.5,
  },
  boss: {
    label: "Chefe",
    powerMultiplier: 3.2,
    rewardMultiplier: 5,
  },
  "world-boss": {
    label: "Boss Mundial",
    powerMultiplier: 12,
    rewardMultiplier: 25,
  },
};

export const MONSTER_FAMILY_LABELS: Record<MonsterFamily, string> = {
  goblin: "Goblin",
  orc: "Orc",
  undead: "Morto-vivo",
  beast: "Fera",
  demon: "Demônio",
  dragon: "Dragão",
  elemental: "Elemental",
  slime: "Slime",
  spider: "Aranha",
  troll: "Troll",
  construct: "Construto",
  cultist: "Cultista",
  reptile: "Réptil",
  plant: "Planta",
  spirit: "Espírito",
  insect: "Inseto",
  aquatic: "Aquático",
  giant: "Gigante",
  void: "Vazio",
};
