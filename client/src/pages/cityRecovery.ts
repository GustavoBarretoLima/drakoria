import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { loadHeroVitals } from "../battle/heroVitals.js";
import { recoverAfterDefeat } from "../battle/defeatRecovery.js";
import { applySubclassStats } from "../../../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../../../shared/src/classes/skillTrees.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import { getTreeRanks } from "../progression/skillTreeClient.js";

// Also unblock saves left at zero HP by the previous defeat behavior.
const selectedClass = (localStorage.getItem("classeHeroi") ?? "guerreiro").toLowerCase();
const heroClass = selectedClass === "mago" || selectedClass === "arqueiro" ? selectedClass : "guerreiro";
const subclassId = getActiveSubclass(heroClass);
const stats = applyTreeStats(applySubclassStats(applyEquipmentStats(createStatsForLevel(heroClass, loadProgress().nivel), getEquippedItems()), subclassId), subclassId, loadProgress().nivel, getTreeRanks());
const vitals = loadHeroVitals(stats.maxHp, stats.maxMana);
if (vitals.hp === 0) recoverAfterDefeat(vitals);
