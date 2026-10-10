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
      <span class="talent-kind">${node.final ? "Habilidade final" : node.skill ? "Habilidade ativa" : "Talento passivo"}${id === "berserker" && !node.attributeBranch ? ` • Patamar ${node.tier} • Nível ${node.level}` : ` • Nível ${node.level}`}</span><h3>${node.name}</h3><p>${node.description}</p>
      ${node.skill ? `<p>${node.skill.furyCost ?? node.skill.manaCost} ${id === "berserker" ? "Fúria" : "mana"} • Recuperação: ${node.skill.cooldown} outras ações</p>` : ""}
      <p class="talent-requires">${requirement ? `Requer ${requirement}` : id === "berserker" ? "Despertar Berserk" : "Raiz da árvore"}${node.requiredPoints ? ` • ${node.requiredPoints} pontos totais, incluindo Despertar` : ""}</p>
      <div class="talent-footer"><strong>${id === "berserker" && !node.attributeBranch ? rank ? "Aprendida" : "1 ponto" : `Rank ${rank}/${node.maxRank}`}</strong><button id="invest-${node.id}" data-invest="${node.id}" type="button" ${reason ? "disabled" : ""}>+1 ponto</button></div>
      <small>${reason ?? "Disponível para aprender ou melhorar"}</small></article>`;
  };
  const state = loadSubclassProgress();
  const learnedSkills = nodes.filter(node => node.skill && ranks[node.id]);
  const loadout = id === "berserker" ? `<section class="berserk-loadout"><h3>Habilidades equipadas</h3><p>Escolha até quatro. Passivas aprendidas permanecem aplicadas. A seleção vale para a próxima batalha.</p><div>${Array.from({ length: 4 }, (_, slot) => `<label>Espaço ${slot + 1}<select data-berserk-slot="${slot}" aria-label="Habilidade do espaço ${slot + 1}"><option value="">Vazio</option>${learnedSkills.map(node => `<option value="${node.id}" ${state.equippedSkills?.[slot] === node.id ? "selected" : ""}>${node.name}</option>`).join("")}</select></label>`).join("")}</div></section>` : "";
  const selected = nodes.find(node => node.id === focusId) ?? nodes[0]!;
  const positions = nodes.map((node, index) => node.attributeBranch
    ? { x: 120 + (id === "berserker" ? BERSERK_PATHS.indexOf(node.path as typeof BERSERK_PATHS[number]) : (index - 6) % 3) * 220, y: (id === "berserker" ? 820 : 650) + Math.floor((index - (id === "berserker" ? 18 : 6)) / 3) * 130 }
    : id === "berserker"
    ? { x: 120 + BERSERK_PATHS.indexOf(node.path as typeof BERSERK_PATHS[number]) * 220, y: 115 + ((node.tier ?? 1) - 1) * 112 }
    : [{ x: 340, y: 115 }, { x: 200, y: 245 }, { x: 480, y: 245 }, { x: 200, y: 375 }, { x: 480, y: 375 }, { x: 340, y: 505 }][index]!);
  const height = id === "berserker" ? 1060 : 890;
  const icons = ["⚔", "✦", "⬡", "✧", "❖", "♜"];
  const lines = nodes.flatMap((node, index) => node.requires.map(req => {
    const parent = nodes.findIndex(candidate => candidate.id === req.id);
    if (parent < 0) return "";
    const from = positions[parent]!, to = positions[index]!;
    return `<path class="${(ranks[req.id] ?? 0) >= req.rank ? "lit" : ""}" d="M ${from.x} ${from.y} V ${(from.y + to.y) / 2} H ${to.x} V ${to.y}" />`;
  })).join("");
  const graph = `<div class="skill-map-scroll"><div class="skill-map" style="height:${height}px">
    <span class="attribute-map-title" style="top:${id === "berserker" ? 748 : 578}px">${id === "berserker" ? "Força e dano crítico • Velocidade e crítico • Vida e defesa" : "Atributos • três ranks por talento"}</span>
    <svg viewBox="0 0 680 ${height}" aria-hidden="true" class="skill-links">${lines}</svg>
    ${id === "berserker" ? BERSERK_PATHS.map((path, index) => `<h3 class="skill-path-title" style="left:${120 + index * 220}px">${path}</h3>`).join("") : ""}
    ${nodes.map((node, index) => {
      const rank = ranks[node.id] ?? 0, reason = treeBlockReason(id, level, ranks, node);
      return `<button type="button" class="skill-orb ${rank ? "learned" : reason ? "locked" : "available"} ${selected.id === node.id ? "selected" : ""} ${node.final || (id !== "berserker" && index === 5) ? "final" : ""}" data-select-node="${node.id}" aria-pressed="${selected.id === node.id}" aria-label="${escape(node.name)} — ${rank}/${node.maxRank}${reason ? ` — ${escape(reason)}` : " — disponível"}" style="left:${positions[index]!.x}px;top:${positions[index]!.y}px"><span class="skill-orb-icon" aria-hidden="true">${icons[(node.tier ?? index + 1) % icons.length]}</span><span class="skill-orb-rank">${rank}/${node.maxRank}</span><span class="skill-orb-name">${node.name}</span></button>`;
    }).join("")}</div></div>`;
  const treeHtml = `${id === "berserker" ? `<details class="berserk-root"><summary>Despertar Berserk • Concedido</summary><p>Três caminhos independentes. Patamares nos níveis 1, 3, 5, 8, 12 e 15, exigindo o talento anterior do mesmo caminho. Escolher uma final não exige investir nos outros caminhos. Fúria: 0–100, reinicia por batalha. Acerto básico gera 8; dano direto recebido gera 4. Exige machado de duas mãos. Escolha somente uma final. Atributos são opcionais: primeira linha no nível 5; segunda no nível 20, com rank 2 no atributo anterior.</p></details>` : ""}
    ${id === "berserker" ? `<p class="inventory-help">Carnificina: golpes e sangramento. Fúria Primal: geração de Fúria, ritmo e Avatar. Sangue de Ferro: cura, resistência e Titã. Cada caminho custa 6 pontos até sua final; é permitido misturar caminhos, mantendo uma única final.</p>` : ""}
    <p class="skill-map-legend">Selecione um nó para ver seus efeitos. ◇ Bloqueado • ◇ Disponível • ◆ Aprendido</p>
    <div class="visual-skill-tree">${graph}<aside class="skill-inspector" aria-label="Detalhes do talento">${nodeHtml(selected, nodes.indexOf(selected))}</aside></div>${loadout}`;
  const previousScroll = panel.scrollTop;
  const previousMapScroll = panel.querySelector(".skill-map-scroll")?.scrollLeft ?? 0;
  panel.classList.remove("hidden");
  panel.innerHTML = `<section class="skill-tree-panel" aria-label="Árvore de habilidades de ${definition.name}"><div class="panel-header"><div><span class="panel-kicker">Árvore de subclasse</span><h2>${definition.name}</h2><p>${definition.role}</p></div><div class="level-badge"><span>Pontos livres</span><strong>${available}</strong></div></div>
    <p class="inventory-help">1 ponto por nível após o primeiro, incluindo níveis anteriores ao livro. Cada aprendizado ou rank custa 1 ponto. Invista nos talentos de sua preferência e siga os pré-requisitos para liberar novas habilidades.</p>
    <p class="tree-message" role="status" aria-live="polite">${escape(message)}</p>
    ${treeHtml}<div class="painel-acoes"><button id="tree-reset" type="button">Redistribuir pontos</button><button id="tree-back" type="button">Voltar ao status</button></div>
    <p class="inventory-help">Redistribuir devolve todos os pontos gratuitamente. O livro e a subclasse permanecem ativos. Mudanças valem para a próxima batalha; habilidades aprendidas aparecem em Habilidades.</p></section>`;
  panel.querySelectorAll<HTMLButtonElement>("[data-select-node]").forEach(button => button.addEventListener("click", () => {
    const scroll = panel.querySelector(".skill-map-scroll")?.scrollLeft ?? 0;
    openSubclassTree("", button.dataset.selectNode);
    const map = panel.querySelector(".skill-map-scroll"); if (map) map.scrollLeft = scroll;
    panel.querySelector<HTMLButtonElement>(`[data-select-node="${button.dataset.selectNode}"]`)?.focus();
  }));
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
  const mapScroll = panel.querySelector(".skill-map-scroll");
  if (focusId && mapScroll) mapScroll.scrollLeft = previousMapScroll;
  if (focusId) {
    const button = document.getElementById(`invest-${focusId}`) as HTMLButtonElement | null;
    if (button && !button.disabled) button.focus();
    else (panel.querySelector("#tree-back") as HTMLButtonElement | null)?.focus();
  }
}
if (typeof window !== "undefined") window.abrirArvoreSubclasse = () => openSubclassTree();
