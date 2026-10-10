import { SUBCLASS_DEFINITIONS } from "../../shared/src/classes/subclasses.js";
import { SUBCLASS_TREES } from "../../shared/src/classes/skillTrees.js";
import { POTIONS } from "../../shared/src/items/potions.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isResourceId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 160;
}

export interface PlayerSetupPayload {
  className?: string;
  subclassId?: string;
  heroName?: string;
  treeRanks?: Record<string, number>;
  equippedSkills?: string[];
  potions?: Record<string, number>;
  monsterId?: string;
  equippedItemIds?: string[];
  heroLevel?: number;
  currentHp?: number;
  currentMana?: number;
}

const maxTreeNodes = Math.max(...Object.values(SUBCLASS_TREES).map(nodes => nodes.length));
const maxTreeRank = Math.max(...Object.values(SUBCLASS_TREES).flatMap(nodes => nodes.map(node => node.maxRank)));

function isCountRecord(value: unknown, maxEntries: number, maxValue: number): value is Record<string, number> {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= maxEntries && entries.every(([key, entry]) =>
    isResourceId(key) && typeof entry === "number" && Number.isSafeInteger(entry) && entry >= 0 && entry <= maxValue,
  );
}

export function isPlayerSetupPayload(value: unknown): value is PlayerSetupPayload {
  if (!isRecord(value)) return false;
  const heroClass = value.className === undefined ? "guerreiro" : value.className;
  if (typeof heroClass !== "string" || !["guerreiro", "mago", "arqueiro"].includes(heroClass)) return false;
  if (value.subclassId !== undefined) {
    if (typeof value.subclassId !== "string" || !Object.hasOwn(SUBCLASS_DEFINITIONS, value.subclassId)) return false;
    if (SUBCLASS_DEFINITIONS[value.subclassId as keyof typeof SUBCLASS_DEFINITIONS].baseClass !== heroClass) return false;
  }
  if (value.heroName !== undefined && (typeof value.heroName !== "string" || value.heroName.length > 160)) return false;
  if (value.monsterId !== undefined && !isResourceId(value.monsterId)) return false;
  if (value.heroLevel !== undefined && (
    typeof value.heroLevel !== "number" || !Number.isInteger(value.heroLevel) || value.heroLevel < 1 || value.heroLevel > 100
  )) return false;
  for (const key of ["currentHp", "currentMana"]) {
    const number = value[key];
    if (number !== undefined && (typeof number !== "number" || !Number.isFinite(number) || number < 0 || number > Number.MAX_SAFE_INTEGER)) return false;
  }
  if (value.equippedItemIds !== undefined && (
    !Array.isArray(value.equippedItemIds) || value.equippedItemIds.length > 9 ||
    !value.equippedItemIds.every(isResourceId)
  )) return false;
  if (value.equippedSkills !== undefined && (
    !Array.isArray(value.equippedSkills) || value.equippedSkills.length > 4 ||
    !value.equippedSkills.every(id => id === "" || isResourceId(id))
  )) return false;
  if (value.treeRanks !== undefined && !isCountRecord(value.treeRanks, maxTreeNodes, maxTreeRank)) return false;
  if (value.potions !== undefined && (
    !isCountRecord(value.potions, Object.keys(POTIONS).length, 9999) ||
    !Object.keys(value.potions).every(id => Object.hasOwn(POTIONS, id))
  )) return false;
  return true;
}

// Only pass known, correctly typed fields to catalogue services. Missing filters
// keep the existing unfiltered query; malformed filters return no results.
export function parseFilters(
  value: unknown,
  numberKeys: readonly string[],
  stringKeys: readonly string[],
): Record<string, number | string> | null {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) return null;
  const result: Record<string, number | string> = {};
  for (const key of numberKeys) {
    const number = value[key];
    if (number === undefined) continue;
    if (typeof number !== "number" || !Number.isFinite(number)) return null;
    result[key] = number;
  }
  for (const key of stringKeys) {
    const string = value[key];
    if (string === undefined) continue;
    if (!isResourceId(string)) return null;
    result[key] = string;
  }
  return result;
}

export function reply(callback: unknown, value: unknown): void {
  if (typeof callback === "function") callback(value);
}
