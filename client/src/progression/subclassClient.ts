import {
  SUBCLASS_DEFINITIONS,
  type SubclassId,
} from "../../../shared/src/classes/subclasses.js";
import type { SubclassBookDrop } from "../../../shared/src/loot/subclassBooks.js";
import type { HeroClass } from "../../../shared/src/types/combat.js";

const SUBCLASS_STORAGE_KEY = "drakoriaSubclassProgress";

export interface SubclassProgressState {
  books: Partial<Record<SubclassId, number>>;
  activeSubclass?: SubclassId;
}

export interface UseSubclassBookResult {
  used: boolean;
  message: string;
  state: SubclassProgressState;
}

function cloneState(state: SubclassProgressState): SubclassProgressState {
  return {
    books: { ...state.books },
    ...(state.activeSubclass ? { activeSubclass: state.activeSubclass } : {}),
  };
}

export function loadSubclassProgress(): SubclassProgressState {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUBCLASS_STORAGE_KEY) || "{}") as Partial<SubclassProgressState>;
    return {
      books: parsed.books && typeof parsed.books === "object" ? { ...parsed.books } : {},
      ...(parsed.activeSubclass && SUBCLASS_DEFINITIONS[parsed.activeSubclass]
        ? { activeSubclass: parsed.activeSubclass }
        : {}),
    };
  } catch {
    return { books: {} };
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
  if (definition.baseClass !== heroClass) {
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

  state.books[subclassId] = count - 1;
  state.activeSubclass = subclassId;
  saveSubclassProgress(state);
  return {
    used: true,
    message: `Especialização desbloqueada: ${definition.name}.`,
    state: cloneState(state),
  };
}

export function getActiveSubclass(): SubclassId | undefined {
  return loadSubclassProgress().activeSubclass;
}
