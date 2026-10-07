import { getTestCharacterEquipment, isTestCharacter, TEST_CHARACTER_LEVEL } from "../../../shared/src/testing/testCharacter.js";
import { loadInventory, saveInventory } from "../inventory/inventoryClient.js";
import { loadProgress, saveProgress } from "../progression/progressionClient.js";
import { createStatsForLevel } from "../../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../../shared/src/equipment/equipmentStats.js";
import { saveHeroVitals } from "../battle/heroVitals.js";
import type { HeroClass } from "../../../shared/src/types/equipment.js";

declare global { interface Window { testCharacterReady?: boolean; } }

export function initializeTestCharacter(name: string, heroClass: HeroClass): boolean {
  if (!isTestCharacter(name)) return false;
  const items = getTestCharacterEquipment(heroClass);
  const inventory = loadInventory();
  for (const item of items) {
    if (!inventory.items.some(entry => entry.item.id === item.id)) inventory.items.push({ item, quantity: 1 });
    inventory.equipped[item.slot] = item.id;
  }
  saveInventory(inventory);
  const progress = loadProgress();
  let xpParaProximoNivel = progress.xpParaProximoNivel;
  for (let level = progress.nivel; level < TEST_CHARACTER_LEVEL; level++) xpParaProximoNivel = Math.floor(xpParaProximoNivel * 1.25);
  saveProgress({ ...progress, nivel: Math.max(TEST_CHARACTER_LEVEL, progress.nivel), xpParaProximoNivel });
  const stats = applyEquipmentStats(createStatsForLevel(heroClass, Math.max(TEST_CHARACTER_LEVEL, progress.nivel)), items);
  saveHeroVitals({ hp: stats.maxHp, mana: stats.maxMana, maxHp: stats.maxHp, maxMana: stats.maxMana });
  return true;
}

if (typeof window !== "undefined") {
  window.addEventListener("drakoria:character-created", () => {
    initializeTestCharacter(localStorage.getItem("nomeHeroi") || "", localStorage.getItem("classeHeroi") as HeroClass);
  });
  window.testCharacterReady = true;
  window.dispatchEvent(new Event("drakoria:test-character-ready"));
}
