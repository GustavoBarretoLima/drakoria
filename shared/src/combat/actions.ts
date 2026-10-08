import { getSkill, type SkillId } from "./classSkills.js";

export type BattleItemId = "healthPotion" | "manaPotion" | "restorativePotion";

export type BattleAction =
  | { type: "ATTACK" }
  | { type: "DEFEND" }
  | { type: "CAST_MAGIC" }
  | { type: "USE_SKILL"; skillId: SkillId }
  | { type: "USE_ITEM"; itemId: BattleItemId };

export function isBattleAction(value: unknown): value is BattleAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const action = value as Record<string, unknown>;
  return action.type === "ATTACK" || action.type === "DEFEND" || action.type === "CAST_MAGIC"
    || (action.type === "USE_SKILL" && typeof action.skillId === "string" && getSkill(action.skillId) !== undefined)
    || (action.type === "USE_ITEM" && (action.itemId === "healthPotion" || action.itemId === "manaPotion" || action.itemId === "restorativePotion"));
}
