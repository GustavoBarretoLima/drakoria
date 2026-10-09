import { loadConsumables } from "../battle/heroVitals.js";
import { isPagesDemoMode,useDemoConsumable } from "../demo/demoBattle.js";
import { POTIONS,type PotionId } from "../../../shared/src/items/potions.js";
import socket from "../network/socket.js";

function numericWidth(id: string): number {
  const element = document.getElementById(id) as HTMLElement | null;
  if (!element) return 0;
  const parsed = Number.parseFloat(element.style.width || "0");
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function heroTurnReady(): boolean {
  const attack = document.getElementById("btnAtacar") as HTMLButtonElement | null;
  return Boolean(attack && !attack.disabled);
}

function updateTimeline(): void {
  const heroMarker = document.getElementById("timelineHero");
  const enemyMarker = document.getElementById("timelineEnemy");
  const heroName = document.getElementById("nomeHeroi")?.textContent?.trim() || "Herói";
  const enemyName = document.getElementById("nomeInimigo")?.textContent?.trim() || "Inimigo";
  if (!heroMarker || !enemyMarker) return;

  const heroAtb = numericWidth("atbHeroiBar");
  const enemyAtb = numericWidth("atbInimigoBar");
  heroMarker.style.left = `${heroAtb}%`;
  enemyMarker.style.left = `${enemyAtb}%`;
  heroMarker.setAttribute("aria-label", `${heroName}: ATB ${Math.round(heroAtb)}%`);
  enemyMarker.setAttribute("aria-label", `${enemyName}: ATB ${Math.round(enemyAtb)}%`);
  heroMarker.classList.toggle("is-ready", heroAtb >= 99);
  enemyMarker.classList.toggle("is-ready", enemyAtb >= 99);

  const enemyFrame = document.querySelector("#batalha .inimigo .sprite-frame");
  enemyMarker.classList.toggle("is-boss", enemyFrame?.getAttribute("data-size") === "boss");
}

function closeItemPanel(restoreFocus = false): void {
  const commands = document.getElementById("comandosBatalha");
  const panel = document.getElementById("painelItens");
  const launcher = document.getElementById("btnItens") as HTMLButtonElement | null;
  if (!commands || !panel || !launcher) return;
  panel.hidden = true;
  commands.hidden = false;
  launcher.setAttribute("aria-expanded", "false");
  if (restoreFocus && !launcher.hidden && !launcher.disabled) launcher.focus();
}

function usePotion(itemId:PotionId):void {
 if(!heroTurnReady())return;
 if(isPagesDemoMode()){if(useDemoConsumable(itemId)){closeItemPanel();updateItemMenu();}}
 else socket.emit("battle:item",itemId,(accepted:boolean)=>{if(accepted){closeItemPanel();updateItemMenu();}});
}

function updateItemMenu(): void {
  const launcher = document.getElementById("btnItens") as HTMLButtonElement | null;
  const list = document.getElementById("itensBatalha");
  if (!launcher || !list) return;

  const consumables = loadConsumables();
  const available=(Object.keys(POTIONS) as PotionId[]).map(id=>[id,consumables[id]??0] as const).filter(([,count])=>count>0);
  launcher.hidden=available.length===0;
  launcher.disabled = !heroTurnReady() || launcher.hidden;
  launcher.setAttribute("aria-label", available.length > 0 ? `Itens, ${available.length} tipo(s) disponível(is)` : "Sem itens utilizáveis");

  list.replaceChildren();
  for (const [itemId, count] of available) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "battle-item-row";
    button.disabled = !heroTurnReady();
    button.innerHTML = `<strong>${POTIONS[itemId].name}</strong><span>${POTIONS[itemId].detail}</span><b>×${count}</b>`;
    button.addEventListener("click", () => usePotion(itemId));
    list.append(button);
  }

  if (available.length === 0) closeItemPanel(false);
}

function bindItemMenu(): void {
  const launcher = document.getElementById("btnItens") as HTMLButtonElement | null;
  const commands = document.getElementById("comandosBatalha");
  const panel = document.getElementById("painelItens");
  const back = document.getElementById("btnVoltarItens");
  if (!launcher || !commands || !panel || !back || launcher.dataset.bound) return;

  launcher.dataset.bound = "true";
  launcher.addEventListener("click", () => {
    if (launcher.disabled) return;
    commands.hidden = true;
    const skillsPanel = document.getElementById("painelHabilidades");
    if (skillsPanel) skillsPanel.hidden = true;
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    panel.querySelector<HTMLButtonElement>(".battle-item-row:not(:disabled)")?.focus();
  });
  back.addEventListener("click", () => closeItemPanel(true));
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeItemPanel(true);
    }
  });
}

function refresh(): void {
  updateTimeline();
  updateItemMenu();
}

export function setupJrpgBattleHud(): void {
  bindItemMenu();
  refresh();

  const watched = ["atbHeroiBar", "atbInimigoBar", "btnAtacar", "nomeHeroi", "nomeInimigo"]
    .map(id => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);
  const observer = new MutationObserver(refresh);
  for (const element of watched) {
    observer.observe(element, { attributes: true, childList: true, subtree: true, attributeFilter: ["style", "disabled"] });
  }

  window.addEventListener("storage", refresh);
  window.setInterval(refresh, 500);
}

setupJrpgBattleHud();
