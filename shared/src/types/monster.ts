export type MonsterFamily =
  | "goblin"
  | "orc"
  | "undead"
  | "beast"
  | "demon"
  | "dragon"
  | "elemental"
  | "slime"
  | "spider"
  | "troll"
  | "construct"
  | "cultist"
  | "reptile"
  | "plant"
  | "spirit"
  | "insect"
  | "aquatic"
  | "giant"
  | "void";

export type MonsterRank =
  | "minion"
  | "normal"
  | "elite"
  | "champion"
  | "boss"
  | "world-boss";

export type MonsterElement =
  | "physical"
  | "fire"
  | "ice"
  | "lightning"
  | "poison"
  | "shadow"
  | "holy"
  | "earth"
  | "water"
  | "wind"
  | "arcane"
  | "void";

export type MonsterSkillType = "physical" | "magic" | "special";

export interface MonsterStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magicPower: number;
  criticalChance: number;
  criticalDamage: number;
}

export interface MonsterSkill {
  id: string;
  name: string;
  description: string;
  type: MonsterSkillType;
  element: MonsterElement;
  power: number;
  cooldown: number;
}

export interface MonsterSpriteSet {
  idle: string;
  attack: string;
  damage: string;
  death?: string;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  description: string;
  family: MonsterFamily;
  rank: MonsterRank;
  element: MonsterElement;
  level: number;
  stats: MonsterStats;
  xpReward: number;
  goldReward: number;
  sprites: MonsterSpriteSet;
  skills: MonsterSkill[];
}
