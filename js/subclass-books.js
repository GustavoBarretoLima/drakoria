import {
  SUBCLASS_DEFINITIONS,
  SUBCLASS_IDS,
} from "../shared/src/classes/subclasses.js";
import { syncCharacterVitals } from "../client/src/progression/heroStats.ts";

const STORAGE_KEY = "drakoriaSubclassProgress";
const CLASS_LABELS = {
  guerreiro: "Guerreiro",
  mago: "Mago",
  arqueiro: "Arqueiro / Elfo",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function heroClass() {
  const value = (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase();
  return value === "mago" || value === "arqueiro" ? value : "guerreiro";
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      books: parsed.books && typeof parsed.books === "object" ? parsed.books : {},
      activeSubclass: SUBCLASS_DEFINITIONS[parsed.activeSubclass] ? parsed.activeSubclass : undefined,
      treeRanks: parsed.treeRanks || {},
    };
  } catch {
    return { books: {}, activeSubclass: undefined };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function useBook(subclassId) {
  const state = loadState();
  const definition = SUBCLASS_DEFINITIONS[subclassId];
  const count = Math.max(0, Math.floor(Number(state.books[subclassId] || 0)));
  if (!definition || count <= 0) return;

  if (definition.baseClass !== heroClass()) {
    window.alert(`Este livro pertence à classe ${CLASS_LABELS[definition.baseClass]}.`);
    return;
  }

  if (state.activeSubclass) {
    window.alert(`Sua especialização já está definida como ${SUBCLASS_DEFINITIONS[state.activeSubclass].name}.`);
    return;
  }

  const confirmed = window.confirm(
    `Usar ${definition.bookName} e tornar-se ${definition.name}?\n\nA especialização é permanente para este personagem.`,
  );
  if (!confirmed) return;

  state.books[subclassId] = count - 1;
  state.activeSubclass = subclassId;
  saveState(state);
  syncCharacterVitals();
  openSubclassBooks();
}

function bookCard(subclassId, state) {
  const definition = SUBCLASS_DEFINITIONS[subclassId];
  const count = Math.max(0, Math.floor(Number(state.books[subclassId] || 0)));
  if (count <= 0) return "";

  const matchesClass = definition.baseClass === heroClass();
  const active = state.activeSubclass === subclassId;
  const alreadySpecialized = Boolean(state.activeSubclass && !active);
  const disabled = !matchesClass || alreadySpecialized || active;
  const buttonLabel = active
    ? "Especialização ativa"
    : !matchesClass
      ? `Exclusivo de ${CLASS_LABELS[definition.baseClass]}`
      : alreadySpecialized
        ? "Especialização já escolhida"
        : `Estudar e tornar-se ${definition.name}`;

  return `
    <article class="subclass-book-card${active ? " active" : ""}">
      <div class="subclass-book-rarity">DROP MÍTICO • BOSS</div>
      <h3>📖 ${escapeHtml(definition.bookName)}</h3>
      <p class="subclass-book-count">Quantidade: ${count}</p>
      <p><strong>${escapeHtml(definition.name)}</strong> — ${escapeHtml(definition.role)}</p>
      <p>${escapeHtml(definition.description)}</p>
      <p><strong>Passiva:</strong> ${escapeHtml(definition.passiveSummary)}</p>
      <div class="subclass-book-tags">${definition.mechanics.map((mechanic) => `<span>${escapeHtml(mechanic)}</span>`).join("")}</div>
      <button type="button" ${disabled ? "disabled" : ""} data-subclass-book="${subclassId}">${escapeHtml(buttonLabel)}</button>
    </article>
  `;
}

function openSubclassBooks() {
  const panel = document.getElementById("painelPraca");
  if (!panel) return;

  const state = loadState();
  const active = state.activeSubclass ? SUBCLASS_DEFINITIONS[state.activeSubclass] : null;
  const ownedCards = SUBCLASS_IDS.map((id) => bookCard(id, state)).filter(Boolean).join("");

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="panel-header">
      <div>
        <span class="panel-kicker">Conhecimento proibido</span>
        <h2>Livros de Subclasse</h2>
      </div>
      <span class="subclass-drop-rate">0,5% por boss</span>
    </div>
    <p class="subclass-book-intro">
      Somente bosses podem derrubar estes livros. O livro sorteado pode pertencer a qualquer uma das nove subclasses.
    </p>
    <div class="subclass-current">
      <strong>Classe base:</strong> ${CLASS_LABELS[heroClass()]}
      <span>•</span>
      <strong>Especialização:</strong> ${active ? escapeHtml(active.name) : "Nenhuma"}
    </div>
    ${ownedCards
      ? `<div class="subclass-books-grid">${ownedCards}</div>`
      : '<div class="subclass-empty">Você ainda não encontrou nenhum livro de subclasse.</div>'}
    <div class="subclass-future-note">
      <strong>Identidades de árvore:</strong> Paladino (tank/cura/proteção), Berserk (dano puro), Espadachim (velocidade/crítico), Necromante (espíritos e invocação), Bruxo (efeitos negativos), Elemental (elementos), Assassino (sangramento/crítico), Caçador (falcão/controle) e Elfo Negro (dano/crítico/debuffs).
    </div>
    <div class="painel-acoes"><button type="button" onclick="fecharPainelPraca()">Fechar</button></div>
  `;

  panel.querySelectorAll("[data-subclass-book]").forEach((button) => {
    button.addEventListener("click", () => useBook(button.dataset.subclassBook));
  });
}

window.abrirLivrosClasse = openSubclassBooks;
