import {
  SUBCLASS_DEFINITIONS,
  SUBCLASS_IDS,
} from "../shared/src/classes/subclasses.js";
import { applySubclassStats } from "../shared/src/classes/subclasses.js";
import { getHeroGifs } from "../client/src/assets/gifs.ts";
import { SPRITE_BOUNDS } from "../client/src/assets/spriteBounds.ts";
import { useSubclassBook } from "../client/src/progression/subclassClient.ts";
import { getCurrentHeroStats, getBerserkPreviewStats, syncCharacterVitals } from "../client/src/progression/heroStats.ts";

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

const PREVIEW_STATS = [
  ["maxHp", "Vida máxima"], ["maxMana", "Mana máxima"], ["attack", "Ataque físico"],
  ["magicPower", "Poder mágico"], ["defense", "Defesa física"], ["magicDefense", "Defesa mágica"],
  ["speed", "Velocidade"], ["criticalChance", "Chance crítica", true],
  ["criticalDamage", "Dano crítico", true], ["dodgeChance", "Esquiva", true],
];
function previewPortrait(label, path) {
  const key = path.slice(path.indexOf("img/"));
  const [width, height, center, top] = SPRITE_BOUNDS[key] || [1, 1, .5, 0];
  return `<article class="subclass-preview-portrait"><h3>${escapeHtml(label)}</h3>
    <div class="subclass-preview-sprite" style="--sprite-width:${width};--sprite-height:${height};--sprite-center:${center};--sprite-top:${top}">
      <img src="${escapeHtml(path)}" alt="${escapeHtml(label)} em repouso" />
    </div></article>`;
}
function useBook(subclassId) {
  const state = loadState();
  const definition = SUBCLASS_DEFINITIONS[subclassId];
  const panel = document.getElementById("painelPraca");
  if (!panel || !definition || !(state.books[subclassId] > 0) || state.activeSubclass || definition.baseClass !== heroClass()) return;
  document.getElementById("menuPraca")?.classList.add("hidden");
  const current = getCurrentHeroStats();
  const next = subclassId === "berserker" && typeof getBerserkPreviewStats === "function" ? getBerserkPreviewStats() : applySubclassStats(current, subclassId);
  const gender = (localStorage.getItem("generoHeroi") || "masculino").toLowerCase() === "feminino" ? "Feminino" : "Masculino";
  const rows = PREVIEW_STATS.map(([key, label, percent]) => {
    const delta = next[key] - current[key];
    const suffix = percent ? "%" : "";
    return `<tr><th scope="row">${label}</th><td>${current[key]}${suffix}</td><td>${next[key]}${suffix}
      <small class="${delta > 0 ? "stat-gain" : delta < 0 ? "stat-loss" : "stat-neutral"}">${delta ? `${delta > 0 ? "+" : ""}${delta}${percent ? " p.p." : ""}` : "—"}</small></td></tr>`;
  }).join("");
  panel.innerHTML = `<div class="panel-header"><div><span class="panel-kicker">Prévia da especialização</span>
    <h2 tabindex="-1">Tornar-se ${escapeHtml(definition.name)}</h2></div></div>
    <p>${escapeHtml(definition.description)}</p>
    <div class="subclass-preview-grid">
      ${previewPortrait(CLASS_LABELS[heroClass()], getHeroGifs(heroClass(), gender).padrao)}
      <div class="subclass-preview-comparison"><table><caption>Seus atributos com os equipamentos atuais</caption>
        <thead><tr><th>Atributo</th><th>Atual</th><th>Após escolher</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${previewPortrait(definition.name, getHeroGifs(heroClass(), gender, subclassId).padrao)}
    </div>
    <section class="subclass-preview-passives"><h3>Passivas ao escolher ${escapeHtml(definition.name)}</h3>
      <p>${escapeHtml(definition.passiveSummary)}</p>
      ${subclassId === "berserker" ? '<ul><li><strong>Força da fúria:</strong> aumenta o ataque físico em 20%.</li><li><strong>Despertar:</strong> libera Fúria e machados de duas mãos. Crítico, cura e resistência vêm da nova árvore.</li><li><strong>Guarda imprudente:</strong> reduz a defesa física em 10%.</li></ul>' : ""}
      <p>As passivas da árvore de habilidades são liberadas depois, ao distribuir pontos no botão Subclasse da tela de status.</p>
    </section>
    <p>A escolha é permanente e consome um livro. A escolha não restaura vida ou mana.</p>
    ${subclassId === "berserker" ? "<p>A arma atual e a mão secundária ficarão na mochila. Um machado de duas mãos com os bônus da arma atual será equipado; a mão secundária deixa de conceder bônus. Sem arma, você receberá um machado inicial.</p>" : ""}
    ${subclassId === "assassin" ? "<p>Seu arco ficará na mochila e adagas equivalentes serão equipadas, preservando nível, raridade e bônus. Sem arma equipada, você receberá adagas iniciais.</p>" : ""}
    <p class="subclass-preview-message" role="alert"></p>
    <div class="painel-acoes"><button type="button" data-preview-cancel>Voltar aos livros</button>
      <button type="button" data-preview-confirm>Usar livro e escolher ${escapeHtml(definition.name)}</button></div>`;
  panel.scrollTop = 0;
  panel.querySelector("h2").focus();
  panel.querySelector("[data-preview-cancel]").addEventListener("click", openSubclassBooks);
  panel.querySelector("[data-preview-confirm]").addEventListener("click", (event) => {
    event.currentTarget.disabled = true;
    const result = useSubclassBook(subclassId, heroClass());
    if (!result.used) {
      panel.querySelector(".subclass-preview-message").textContent = result.message;
      return;
    }
    syncCharacterVitals();
    openSubclassBooks();
  });
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
      <span class="subclass-drop-rate">0,5% a 0,9% por boss, conforme o nível</span>
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
