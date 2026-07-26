export type HeroClass = "guerreiro" | "mago" | "arqueiro";

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
}

export interface CombatantState {
  id: string;
  name: string;
  className?: HeroClass;
  stats: Stats;
  defending: boolean;
  isAlive: boolean;
}

export interface BattleEvent {
  actorId: string;
  targetId: string;
  action: "ATTACK" | "DEFEND" | "CAST_MAGIC";
  damage?: number;
  critical?: boolean;
  message: string;
}

export interface BattleState {
  id: string;
  hero: CombatantState;
  enemy: CombatantState;
  turnOwnerId: string;
  finished: boolean;
  winnerId?: string;
  lastEvent?: BattleEvent;
}
