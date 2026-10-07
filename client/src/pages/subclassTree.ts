import { SUBCLASS_DEFINITIONS } from "../../../shared/src/classes/subclasses.js";
import { SUBCLASS_TREES, earnedTreePoints, spentTreePoints, treeBlockReason } from "../../../shared/src/classes/skillTrees.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import { getTreeRanks, investTreePoint, resetTreePoints } from "../progression/skillTreeClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import type { HeroClass } from "../../../shared/src/types/combat.js";

declare global { interface Window { abrirArvoreSubclasse: () => void; abrirStatus?: () => void; } }
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

export function openSubclassTree(message = "", focusId?: string): void {
  const raw = localStorage.getItem("classeHeroi");
  const heroClass: HeroClass = raw === "mago" || raw === "arqueiro" ? raw : "guerreiro";
  const id = getActiveSubclass(heroClass);
  const panel = document.getElementById("painelPraca");
  if (!id || !panel) return;
  const definition = SUBCLASS_DEFINITIONS[id];
  const ranks = getTreeRanks();
  const level = loadProgress().nivel;
  const available = earnedTreePoints(level) - spentTreePoints(ranks);
  const nodes = SUBCLASS_TREES[id];
  const previousScroll = panel.scrollTop;
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="panel-header"><div><span class="panel-kicker">Árvore de subclasse</span><h2>${definition.name}</h2><p>${definition.role}</p></div><div class="level-badge"><span>Pontos livres</span><strong>${available}</strong></div></div>
    <p class="inventory-help">1 ponto por nível após o primeiro, incluindo níveis anteriores ao livro. Cada rank custa 1 ponto. Invista nos talentos de sua preferência e siga os pré-requisitos para liberar novas habilidades.</p>
    <p class="tree-message" role="status" aria-live="polite">${escape(message)}</p>
    <div class="subclass-tree" aria-label="Árvore de ${definition.name}">${nodes.map((node, index) => {
      const rank = ranks[node.id] ?? 0;
      const reason = treeBlockReason(id, level, ranks, node);
      const requirement = node.requires.map(req => `${nodes.find(parent => parent.id === req.id)?.name}: ${req.rank}`).join(" • ");
      return `<article class="talent-node ${rank > 0 ? "learned" : ""} ${index === 0 || index === 5 ? "tree-wide" : ""}">
        <span class="talent-kind">${node.skill ? "Habilidade ativa" : "Talento passivo"} • Nível ${node.level}</span><h3>${node.name}</h3><p>${node.description}</p>
        ${node.skill ? `<p>${node.skill.manaCost} mana • Recuperação: ${node.skill.cooldown} outras ações</p>` : ""}
        <p class="talent-requires">${requirement ? `Requer ${requirement}` : "Raiz da árvore"}</p>
        <div class="talent-footer"><strong>Rank ${rank}/${node.maxRank}</strong><button id="invest-${node.id}" data-invest="${node.id}" type="button" ${reason ? "disabled" : ""}>+1 ponto</button></div>
        <small>${reason ?? "Disponível para aprender ou melhorar"}</small></article>`;
    }).join("")}</div><div class="painel-acoes"><button id="tree-reset" type="button">Redistribuir pontos</button><button id="tree-back" type="button">Voltar ao status</button></div>
    <p class="inventory-help">Redistribuir devolve todos os pontos gratuitamente. O livro e a subclasse permanecem ativos. Mudanças valem para a próxima batalha; habilidades aprendidas aparecem em Habilidades.</p>`;
  panel.querySelectorAll<HTMLButtonElement>("[data-invest]").forEach(button => button.addEventListener("click", () => {
    const nodeId = button.dataset.invest!;
    const result = investTreePoint(nodeId);
    openSubclassTree(result ?? "Ponto investido.", nodeId);
  }));
  panel.querySelector("#tree-reset")?.addEventListener("click", () => { resetTreePoints(); openSubclassTree("Todos os pontos foram devolvidos."); });
  panel.querySelector("#tree-back")?.addEventListener("click", () => window.abrirStatus?.());
  panel.scrollTop = focusId ? previousScroll : 0;
  if (focusId) {
    const button = document.getElementById(`invest-${focusId}`) as HTMLButtonElement | null;
    if (button && !button.disabled) button.focus();
    else (panel.querySelector("#tree-back") as HTMLButtonElement | null)?.focus();
  }
}
if (typeof window !== "undefined") window.abrirArvoreSubclasse = () => openSubclassTree();
