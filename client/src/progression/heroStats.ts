import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { applySubclassStats } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../../../shared/src/classes/skillTrees.js";
import { SUBCLASS_DEFINITIONS, type SubclassId } from "../../../shared/src/classes/subclasses.js";
import { createDungeonEquipment } from "../../../shared/src/loot/dungeonLoot.js";
import { createBerserkAxe } from "../../../shared/src/equipment/berserkWeapons.js";
import { createAssassinDaggers } from "../../../shared/src/equipment/assassinWeapons.js";
import { canEquipItem } from "../../../shared/src/equipment/equipmentRules.js";
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

export function getBerserkPreviewStats() {
  return applySubclassStats(applyEquipmentStats(createStatsForLevel("guerreiro", loadProgress().nivel), getEquippedItems().filter(item => item.slot !== "shield")), "berserker");
}

export function getSubclassPreviewStats(id: SubclassId) {
  const target = SUBCLASS_DEFINITIONS[id].baseClass;
  const level = loadProgress().nivel;
  const items = getEquippedItems().filter(item => canEquipItem(item, target, level, id));
  if (!items.some(item => item.slot === "weapon")) {
    if (id === "berserker") items.push(createBerserkAxe(createDungeonEquipment("guerreiro", "weapon", 1, "common")));
    if (id === "assassin") items.push(createAssassinDaggers(createDungeonEquipment("arqueiro", "weapon", 1, "common")));
  }
  return applySubclassStats(applyEquipmentStats(createStatsForLevel(target, level), items), id);
}
