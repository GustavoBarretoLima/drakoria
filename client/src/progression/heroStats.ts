import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { applySubclassStats } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../../../shared/src/classes/skillTrees.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { getActiveSubclass, loadSubclassProgress } from "./subclassClient.js";
import { loadProgress } from "./progressionClient.js";
import { loadHeroVitals, saveHeroVitals } from "../battle/heroVitals.js";

export function getCurrentHeroStats() {
  const raw = localStorage.getItem("classeHeroi");
  const heroClass = raw === "mago" || raw === "arqueiro" ? raw : "guerreiro";
  const level = loadProgress().nivel;
  const id = getActiveSubclass(heroClass);
  return applyTreeStats(applySubclassStats(applyEquipmentStats(createStatsForLevel(heroClass, level), getEquippedItems()), id), id, level, loadSubclassProgress().treeRanks);
}
/** Changing a build updates resource limits without granting a free heal. */
export function syncCharacterVitals(): void {
  const stats = getCurrentHeroStats();
  saveHeroVitals(loadHeroVitals(stats.maxHp, stats.maxMana));
}
