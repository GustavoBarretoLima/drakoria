import { SUBCLASS_TREES, treeBlockReason, type TreeRanks } from "../../../shared/src/classes/skillTrees.js";
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
  saveSubclassProgress({ ...state, treeRanks: { ...ranks, [node.id]: (ranks[node.id] ?? 0) + 1 } });
  syncCharacterVitals();
  return null;
}
export function resetTreePoints(): void {
  const state = loadSubclassProgress();
  if (getActiveSubclass(heroClass())) {
    saveSubclassProgress({ ...state, treeRanks: {} });
    syncCharacterVitals();
  }
}
