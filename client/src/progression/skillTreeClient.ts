import { SUBCLASS_TREES, normalizeBerserkLoadout, treeBlockReason, type TreeRanks } from "../../../shared/src/classes/skillTrees.js";
import { getActiveSubclass, loadSubclassProgress, saveSubclassProgress } from "./subclassClient.js";
import { loadProgress } from "./progressionClient.js";
import type { HeroClass } from "../../../shared/src/types/combat.js";
import { syncCharacterVitals } from "./heroStats.js";

function heroClass(): HeroClass {
  const value = localStorage.getItem("classeHeroi");
  return value === "mago" || value === "arqueiro" ? value : "guerreiro";
}
export function getTreeRanks(): TreeRanks {
  return getActiveSubclass(heroClass()) ? loadSubclassProgress().treeRanks ?? {} : {};
}
export function investTreePoint(nodeId: string): string | null {
  const id = getActiveSubclass(heroClass());
  if (!id) return "Use um livro compatível para liberar uma subclasse.";
  const node = SUBCLASS_TREES[id].find(candidate => candidate.id === nodeId);
  if (!node) return "Talento de outra subclasse";
  const state = loadSubclassProgress();
  const ranks = state.treeRanks ?? {};
  const reason = treeBlockReason(id, loadProgress().nivel, ranks, node);
  if (reason) return reason;
  const nextRanks = { ...ranks, [node.id]: (ranks[node.id] ?? 0) + 1 };
  const equippedSkills = id === "berserker" ? normalizeBerserkLoadout(loadProgress().nivel, nextRanks, [...(state.equippedSkills ?? []), ...(node.skill ? [node.id] : [])]) : state.equippedSkills;
  saveSubclassProgress({ ...state, treeRanks: nextRanks, ...(id === "berserker" ? { equippedSkills } : {}) });
  syncCharacterVitals();
  return null;
}
export function resetTreePoints(): void {
  const state = loadSubclassProgress();
  if (getActiveSubclass(heroClass())) {
    saveSubclassProgress({ ...state, treeRanks: {}, ...(state.activeSubclass === "berserker" ? { equippedSkills: [] } : {}) });
    syncCharacterVitals();
  }
}

export function setBerserkSkillSlot(slot: number, skillId: string): string | null {
  const state = loadSubclassProgress();
  if (getActiveSubclass(heroClass()) !== "berserker" || !Number.isInteger(slot) || slot < 0 || slot > 3) return "Espaço inválido";
  const learned = normalizeBerserkLoadout(loadProgress().nivel, state.treeRanks, [skillId]);
  if (skillId && !learned.includes(skillId)) return "Habilidade não aprendida";
  const slots = [...(state.equippedSkills ?? [])];
  if (skillId && slots.some((id, index) => id === skillId && index !== slot)) return "Habilidade já equipada";
  slots[slot] = skillId;
  saveSubclassProgress({ ...state, equippedSkills: slots });
  return null;
}
