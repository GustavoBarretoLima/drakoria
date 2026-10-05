import type { BattleState, HeroClass } from "../../../../shared/src/types/combat.js";
import { createInitialBattleState } from "./battleRoom.js";

export class BattleManager {
  private readonly battles = new Map<string, BattleState>();

  create(
    playerId: string,
    heroClass: HeroClass = "guerreiro",
    monsterId = "goblin-normal-lvl-1",
  ): BattleState {
    const battle = createInitialBattleState(heroClass, monsterId);
    this.battles.set(playerId, battle);
    return battle;
  }

  get(playerId: string): BattleState | undefined {
    return this.battles.get(playerId);
  }

  set(playerId: string, battle: BattleState): BattleState {
    this.battles.set(playerId, battle);
    return battle;
  }

  remove(playerId: string): boolean {
    return this.battles.delete(playerId);
  }

  has(playerId: string): boolean {
    return this.battles.has(playerId);
  }

  get activeBattleCount(): number {
    return this.battles.size;
  }
}
