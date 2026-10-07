import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { getEquippedItems } from "../inventory/inventoryClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { loadHeroVitals } from "../battle/heroVitals.js";
import { recoverAfterDefeat } from "../battle/defeatRecovery.js";

// Also unblock saves left at zero HP by the previous defeat behavior.
const selectedClass = (localStorage.getItem("classeHeroi") ?? "guerreiro").toLowerCase();
const heroClass = selectedClass === "mago" || selectedClass === "arqueiro" ? selectedClass : "guerreiro";
const stats = applyEquipmentStats(createStatsForLevel(heroClass, loadProgress().nivel), getEquippedItems());
const vitals = loadHeroVitals(stats.maxHp, stats.maxMana);
if (vitals.hp === 0) recoverAfterDefeat(vitals);
