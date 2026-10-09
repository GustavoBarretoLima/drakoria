import {
  SUBCLASS_DEFINITIONS,
  type SubclassId,
} from "../../../shared/src/classes/subclasses.js";
import type { SubclassBookDrop } from "../../../shared/src/loot/subclassBooks.js";
import type { HeroClass } from "../../../shared/src/types/combat.js";
import { normalizeTreeRanks, normalizeBerserkLoadout, type TreeRanks } from "../../../shared/src/classes/skillTrees.js";
import { loadProgress } from "./progressionClient.js";

import { isTestCharacter } from "../../../shared/src/testing/testCharacter.js";
import { syncCharacterVitals } from "./heroStats.js";
import { ensureAssassinEquipment, ensureBerserkEquipment, reconcileEquippedItems } from "../inventory/inventoryClient.js";

const SUBCLASS_STORAGE_KEY = "drakoriaSubclassProgress";

export interface SubclassProgressState {
  books: Partial<Record<SubclassId, number>>;
  activeSubclass?: SubclassId;
  treeRanks?: TreeRanks;
  equippedSkills?: string[];
  berserkTreeVersion?: number;
}

export interface UseSubclassBookResult {
  used: boolean;
  message: string;
  state: SubclassProgressState;
}

function cloneState(state: SubclassProgressState): SubclassProgressState {
  return {
    books: { ...state.books },
    treeRanks: { ...state.treeRanks },
    ...(state.equippedSkills ? { equippedSkills: [...state.equippedSkills] } : {}),
    ...(state.berserkTreeVersion ? { berserkTreeVersion: state.berserkTreeVersion } : {}),
    ...(state.activeSubclass ? { activeSubclass: state.activeSubclass } : {}),
  };
}

export function loadSubclassProgress(): SubclassProgressState {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUBCLASS_STORAGE_KEY) || "{}") as Partial<SubclassProgressState>;
    if (parsed.activeSubclass === "berserker" && parsed.berserkTreeVersion !== 2) {
      // Old node IDs do not map to the new paths: return every point, retain the book/subclass.
      parsed.treeRanks = {}; parsed.equippedSkills = []; parsed.berserkTreeVersion = 2;
      saveSubclassProgress({ ...parsed, books: parsed.books ?? {} });
    }
    return {
      ...(parsed.activeSubclass === "berserker" ? { berserkTreeVersion: 2, equippedSkills: normalizeBerserkLoadout(loadProgress().nivel, parsed.treeRanks, parsed.equippedSkills) } : {}),
      books: parsed.books && typeof parsed.books === "object" ? { ...parsed.books } : {},
      treeRanks: normalizeTreeRanks(parsed.activeSubclass, loadProgress().nivel, parsed.treeRanks),
      ...(parsed.activeSubclass && SUBCLASS_DEFINITIONS[parsed.activeSubclass]
        ? { activeSubclass: parsed.activeSubclass }
        : {}),
    };
  } catch {
    return { books: {}, treeRanks: {} };
  }
}

export function saveSubclassProgress(state: SubclassProgressState): void {
  localStorage.setItem(SUBCLASS_STORAGE_KEY, JSON.stringify(state));
}

export function addSubclassBookDrops(drops: SubclassBookDrop[]): SubclassProgressState {
  const state = loadSubclassProgress();
  for (const drop of drops) {
    state.books[drop.subclassId] = Math.max(0, Math.floor(state.books[drop.subclassId] ?? 0)) + Math.max(1, Math.floor(drop.quantity));
  }
  saveSubclassProgress(state);
  return cloneState(state);
}

export function useSubclassBook(
  subclassId: SubclassId,
  heroClass: HeroClass,
): UseSubclassBookResult {
  const state = loadSubclassProgress();
  const definition = SUBCLASS_DEFINITIONS[subclassId];
  const count = Math.max(0, Math.floor(state.books[subclassId] ?? 0));

  if (!definition || count <= 0) {
    return { used: false, message: "Você não possui esse livro.", state };
  }
  if (definition.baseClass !== heroClass && !isTestCharacter(localStorage.getItem("nomeHeroi"))) {
    return { used: false, message: `Esse livro pertence à classe ${definition.baseClass}.`, state };
  }
  if (state.activeSubclass) {
    const active = SUBCLASS_DEFINITIONS[state.activeSubclass];
    return {
      used: false,
      message: `Sua especialização já está definida como ${active.name}.`,
      state,
    };
  }

  if (isTestCharacter(localStorage.getItem("nomeHeroi"))) {
    const target = definition.baseClass;
    const female = (localStorage.getItem("generoHeroi") ?? "").toLowerCase().includes("fem");
    localStorage.setItem("classeHeroi", target);
    localStorage.setItem("classeHeroiTexto", target === "guerreiro" ? female ? "Guerreira" : "Guerreiro" : target === "mago" ? female ? "Maga" : "Mago" : female ? "Arqueira" : "Arqueiro");
    const folder = target === "guerreiro" ? female ? "guerreira_anime" : "heroi_anime" : target === "mago" ? female ? "maga_anime" : "mago_anime" : female ? "elfa_anime" : "elfo_anime";
    localStorage.setItem("imagemHeroi", `../img/personagens/${folder}/idle.gif`);
  }
  state.books[subclassId] = count - 1;
  state.activeSubclass = subclassId;
  if (subclassId === "berserker") { state.berserkTreeVersion = 2; state.treeRanks = {}; state.equippedSkills = []; }
  saveSubclassProgress(state);
  if (isTestCharacter(localStorage.getItem("nomeHeroi"))) reconcileEquippedItems();
  if (subclassId === "assassin") ensureAssassinEquipment(true);
  if (subclassId === "berserker") ensureBerserkEquipment(true);
  if (isTestCharacter(localStorage.getItem("nomeHeroi"))) syncCharacterVitals();
  return {
    used: true,
    message: `Especialização desbloqueada: ${definition.name}.`,
    state: cloneState(state),
  };
}

export function getActiveSubclass(heroClass?: HeroClass): SubclassId | undefined {
  const activeSubclass = loadSubclassProgress().activeSubclass;
  if (!activeSubclass) return undefined;
  if (heroClass && SUBCLASS_DEFINITIONS[activeSubclass].baseClass !== heroClass) return undefined;
  return activeSubclass;
}

/** Test character only: consume no books, return all tree points, keep item ownership. */
export function resetTestCharacterSubclass(): string | null {
  if (!isTestCharacter(localStorage.getItem("nomeHeroi"))) return "Somente Taichou pode resetar a subclasse.";
  const state = loadSubclassProgress();
  if (!state.activeSubclass) return "Nenhuma subclasse ativa.";
  saveSubclassProgress({ books: { ...state.books }, treeRanks: {}, equippedSkills: [] });
  reconcileEquippedItems();
  syncCharacterVitals();
  return null;
}
