export type BattleAction =
  | { type: "ATTACK" }
  | { type: "DEFEND" }
  | { type: "CAST_MAGIC" };
