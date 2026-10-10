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

function isNumberRecord(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(
    entry => typeof entry === "number" && Number.isFinite(entry),
  );
}

export function isPlayerSetupPayload(value: unknown): value is PlayerSetupPayload {
  if (!isRecord(value)) return false;
  for (const key of ["className", "subclassId", "heroName"]) {
    if (value[key] !== undefined && typeof value[key] !== "string") return false;
  }
  if (value.monsterId !== undefined && !isResourceId(value.monsterId)) return false;
  for (const key of ["heroLevel", "currentHp", "currentMana"]) {
    const number = value[key];
    if (number !== undefined && (typeof number !== "number" || !Number.isFinite(number))) return false;
  }
  if (value.equippedItemIds !== undefined && (
    !Array.isArray(value.equippedItemIds) || value.equippedItemIds.length > 9 ||
    !value.equippedItemIds.every(isResourceId)
  )) return false;
  if (value.equippedSkills !== undefined && (
    !Array.isArray(value.equippedSkills) || !value.equippedSkills.every(isResourceId)
  )) return false;
  return ["treeRanks", "potions"].every(
    key => value[key] === undefined || isNumberRecord(value[key]),
  );
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
