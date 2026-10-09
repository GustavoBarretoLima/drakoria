import type { EquipmentDrop } from "./equipment.js";
import type { MonsterSpriteSet } from "./monster.js";
import type { SkillId } from "../combat/classSkills.js";
import type { SubclassBookDrop } from "../loot/subclassBooks.js";
import type { SubclassId } from "../classes/subclasses.js";
import type { TreeRanks } from "../classes/skillTrees.js";

export type HeroClass = "guerreiro" | "mago" | "arqueiro";

export interface Stats {
  forgeHpRegen?: number;
  forgeManaRegen?: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  magicPower: number;
  dodgeChance: number;
  defense: number;
  magicDefense: number;
  speed: number;
  criticalChance: number;
  criticalDamage: number;
}

export interface CombatantState {
  id: string;
  name: string;
  className?: HeroClass;
  level?: number;
  sprites?: MonsterSpriteSet;
  stats: Stats;
  atb: number;
  defending: boolean;
  isAlive: boolean;
  potionBuff?: {stat:"attack"|"defense"|"magicPower"|"speed";amount:number;turns:number};
  phase?: number;
  specialCooldown?: number;
  charging?: boolean;
  skillCooldowns?: Partial<Record<SkillId, number>>;
  subclassId?: SubclassId;
  treeRanks?: TreeRanks;
  equippedSkills?: string[];
  hasTwoHandedAxe?: boolean;
  fury?: number;
  berserk?: { warcry: number; avatar: number; blood: number; titan: number; stacks: number; stackTurns: number; retaliation: number; retaliationCooldown: number; deathWard: boolean; refusedDeath: boolean };
  berserkBleed?: { damage: number; turns: number };
  slowedTurns?: number;
  ongoingDamage?: { damage: number; turns: number; name: string };
  weakenedTurns?: number;
  skillLockedTurns?: number;
}

export interface BattleRewards {
  xp: number;
  gold: number;
  drops?: EquipmentDrop[];
  classBooks?: SubclassBookDrop[];
}

export interface BattleEvent {
  actorId: string;
  targetId: string;
  action: "ATTACK" | "DEFEND" | "CAST_MAGIC";
  damage?: number;
  critical?: boolean;
  dodged?: boolean;
  special?: string;
  skillId?: SkillId;
  hits?: number;
  message: string;
}

export interface BattleState {
  potions?: import("../items/potions.js").PotionInventory;
  id: string;
  hero: CombatantState;
  enemy: CombatantState;
  rewards?: BattleRewards;
  revealEnemyStats?: boolean;
  turnOwnerId: string | null;
  finished: boolean;
  winnerId?: string;
  lastEvent?: BattleEvent;
}
