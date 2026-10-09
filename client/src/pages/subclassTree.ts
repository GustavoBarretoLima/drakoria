import { SUBCLASS_DEFINITIONS } from "../../../shared/src/classes/subclasses.js";
import { SUBCLASS_TREES, earnedTreePoints, spentTreePoints, treeBlockReason } from "../../../shared/src/classes/skillTrees.js";
import { BERSERK_PATHS } from "../../../shared/src/classes/berserkTree.js";
import { loadSubclassProgress, getActiveSubclass } from "../progression/subclassClient.js";
import { getTreeRanks, investTreePoint, resetTreePoints, setBerserkSkillSlot } from "../progression/skillTreeClient.js";
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
  const nodeHtml = (node: typeof nodes[number], index: number) => {
    const rank = ranks[node.id] ?? 0;
    const reason = treeBlockReason(id, level, ranks, node);
    const requirement = node.requires.map(req => `${nodes.find(parent => parent.id === req.id)?.name}: ${req.rank}`).join(" • ");
    return `<article class="talent-node ${rank > 0 ? "learned" : ""} ${node.final ? "berserk-final" : ""} ${id !== "berserker" && (index === 0 || index === 5) ? "tree-wide" : ""}">
      <span class="talent-kind">${node.final ? "Habilidade final" : node.skill ? "Habilidade ativa" : "Talento passivo"}${id === "berserker" ? ` • Patamar ${node.tier}` : ` • Nível ${node.level}`}</span><h3>${node.name}</h3><p>${node.description}</p>
      ${node.skill ? `<p>${node.skill.furyCost ?? node.skill.manaCost} ${id === "berserker" ? "Fúria" : "mana"} • Recuperação: ${node.skill.cooldown} outras ações</p>` : ""}
      <p class="talent-requires">${requirement ? `Requer ${requirement}` : id === "berserker" ? "Despertar Berserk" : "Raiz da árvore"}${node.requiredPoints ? ` • ${node.requiredPoints} pontos totais, incluindo Despertar` : ""}</p>
      <div class="talent-footer"><strong>${id === "berserker" ? rank ? "Aprendida" : "1 ponto" : `Rank ${rank}/${node.maxRank}`}</strong><button id="invest-${node.id}" data-invest="${node.id}" type="button" ${reason ? "disabled" : ""}>+1 ponto</button></div>
      <small>${reason ?? "Disponível para aprender ou melhorar"}</small></article>`;
  };
  const state = loadSubclassProgress();
  const learnedSkills = nodes.filter(node => node.skill && ranks[node.id]);
  const loadout = id === "berserker" ? `<section class="berserk-loadout"><h3>Habilidades equipadas</h3><p>Escolha até quatro. Passivas aprendidas permanecem aplicadas. A seleção vale para a próxima batalha.</p><div>${Array.from({ length: 4 }, (_, slot) => `<label>Espaço ${slot + 1}<select data-berserk-slot="${slot}" aria-label="Habilidade do espaço ${slot + 1}"><option value="">Vazio</option>${learnedSkills.map(node => `<option value="${node.id}" ${state.equippedSkills?.[slot] === node.id ? "selected" : ""}>${node.name}</option>`).join("")}</select></label>`).join("")}</div></section>` : "";
  const treeHtml = id === "berserker" ? `<div class="berserk-root"><strong>Despertar Berserk • Concedido</strong><p>1 ponto gratuito contado nos requisitos. Fúria: 0–100, reinicia por batalha. Acerto básico gera 8; dano direto recebido gera 4. Habilidades exigem machado de duas mãos; mão secundária indisponível. Escolha somente uma final.</p></div>${loadout}
    <details class="berserk-concept"><summary>Ver arte da árvore</summary><img src="${import.meta.env?.BASE_URL ?? "/"}img/subclass/arvore_berserk/arvore_berserk.png" alt="Conceito da árvore Berserk com três caminhos" loading="lazy" /></details>
    <div class="subclass-tree berserk-tree">${BERSERK_PATHS.map((path, index) => `<section class="berserk-path berserk-path-${index}"><h3>${path}</h3>${nodes.filter(node => node.path === path).map(nodeHtml).join("")}</section>`).join("")}</div>` : `<div class="subclass-tree" aria-label="Árvore de ${definition.name}">${nodes.map(nodeHtml).join("")}</div>`;
  const previousScroll = panel.scrollTop;
  panel.classList.remove("hidden");
  panel.innerHTML = `<div class="panel-header"><div><span class="panel-kicker">Árvore de subclasse</span><h2>${definition.name}</h2><p>${definition.role}</p></div><div class="level-badge"><span>Pontos livres</span><strong>${available}</strong></div></div>
    <p class="inventory-help">1 ponto por nível após o primeiro, incluindo níveis anteriores ao livro. Cada aprendizado ou rank custa 1 ponto. Invista nos talentos de sua preferência e siga os pré-requisitos para liberar novas habilidades.</p>
    <p class="tree-message" role="status" aria-live="polite">${escape(message)}</p>
    ${treeHtml}<div class="painel-acoes"><button id="tree-reset" type="button">Redistribuir pontos</button><button id="tree-back" type="button">Voltar ao status</button></div>
    <p class="inventory-help">Redistribuir devolve todos os pontos gratuitamente. O livro e a subclasse permanecem ativos. Mudanças valem para a próxima batalha; habilidades aprendidas aparecem em Habilidades.</p>`;
  panel.querySelectorAll<HTMLButtonElement>("[data-invest]").forEach(button => button.addEventListener("click", () => {
    const nodeId = button.dataset.invest!;
    const result = investTreePoint(nodeId);
    openSubclassTree(result ?? "Ponto investido.", nodeId);
  }));
  panel.querySelectorAll<HTMLSelectElement>("[data-berserk-slot]").forEach(select => select.addEventListener("change", () => {
    const result = setBerserkSkillSlot(Number(select.dataset.berserkSlot), select.value);
    const scroll = panel.scrollTop;
    openSubclassTree(result ?? "Habilidades equipadas atualizadas."); panel.scrollTop = scroll;
    panel.querySelector<HTMLSelectElement>(`[data-berserk-slot="${select.dataset.berserkSlot}"]`)?.focus();
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
