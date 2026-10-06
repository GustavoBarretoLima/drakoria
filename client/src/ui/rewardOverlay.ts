import type { BattleRewards } from "../../../shared/src/types/combat.js";
import type { EquipmentItem, EquipmentRarity } from "../../../shared/src/types/equipment.js";
import type {
  DefeatPenaltyResult,
  RewardResult,
} from "../progression/progressionClient.js";

export interface RewardDrop {
  name: string;
  quantity?: number;
  rarity?: EquipmentRarity;
  level?: number;
  allowedClasses?: EquipmentItem["allowedClasses"];
}

const RARITY_LABELS: Record<EquipmentRarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

export interface VictoryActions {
  onNextMonster: () => void;
  onReturnToCity: () => void;
}

export function renderVictoryRewardOverlay(
  rewards: BattleRewards,
  result: RewardResult,
  drops: RewardDrop[] = [],
  actions?: VictoryActions,
): void {
  removeBattleResultOverlays();

  const overlay = createBaseOverlay("battleRewardOverlay", "reward-overlay");
  const panel = document.createElement("div");
  panel.className = "reward-panel";

  const victory = document.createElement("div");
  victory.className = "reward-victory";
  victory.textContent = "VITÓRIA";

  const title = document.createElement("h2");
  title.className = "reward-title";
  title.textContent = "Recompensas obtidas";

  const rewardsGrid = document.createElement("div");
  rewardsGrid.className = "reward-grid";
  rewardsGrid.append(
    createRewardCard("XP", `+${rewards.xp}`, "reward-xp"),
    createRewardCard("Ouro", `+${rewards.gold}`, "reward-gold"),
  );

  panel.append(victory, title, rewardsGrid);

  if (result.levelsGained > 0) {
    const levelUp = document.createElement("div");
    levelUp.className = "reward-level-up";
    levelUp.textContent = `LEVEL UP! Nível ${result.progress.nivel}`;
    panel.appendChild(levelUp);
  }

  if (drops.length > 0) {
    const dropsSection = document.createElement("div");
    dropsSection.className = "reward-drops";

    const dropsTitle = document.createElement("h3");
    dropsTitle.textContent = "Drops";
    dropsSection.appendChild(dropsTitle);

    for (const drop of drops) {
      const dropLine = document.createElement("div");
      dropLine.className = `reward-drop-item${drop.rarity ? ` rarity-${drop.rarity}` : ""}`;
      const rarity = drop.rarity ? ` • ${RARITY_LABELS[drop.rarity]}` : "";
      dropLine.textContent = `${drop.name}${drop.quantity && drop.quantity > 1 ? ` x${drop.quantity}` : ""}${rarity}`;
      if (drop.level !== undefined && drop.allowedClasses) {
        const labels = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro", universal: "Todas as classes" };
        const classes = drop.allowedClasses.includes("universal")
          ? labels.universal
          : drop.allowedClasses.map(heroClass => labels[heroClass]).join(", ") || "Não informada";
        const requirements = document.createElement("small");
        requirements.className = "reward-drop-requirements";
        requirements.textContent = `Classe: ${classes} • Nível ${drop.level}`;
        dropLine.appendChild(requirements);
      }
      dropsSection.appendChild(dropLine);
    }

    panel.appendChild(dropsSection);
  }

  const progress = document.createElement("div");
  progress.className = "reward-progress";
  progress.textContent = `Nível ${result.progress.nivel} • XP ${result.progress.xp}/${result.progress.xpParaProximoNivel} • Ouro total ${result.progress.ouro}`;
  panel.appendChild(progress);

  if (actions) {
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    title.id = "battleVictoryTitle";
    overlay.setAttribute("aria-labelledby", title.id);
    const buttons = document.createElement("div");
    buttons.className = "reward-actions";
    let chosen = false;
    const createAction = (label: string, action: () => void) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        if (chosen) return;
        chosen = true;
        nextButton.disabled = true;
        cityButton.disabled = true;
        action();
      });
      return button;
    };
    const nextButton = createAction("Buscar próximo monstro", actions.onNextMonster);
    const cityButton = createAction("Voltar para a cidade", actions.onReturnToCity);
    cityButton.className = "reward-action-secondary";
    buttons.append(nextButton, cityButton);
    panel.appendChild(buttons);
    // Mantém a navegação por teclado dentro da escolha de vitória.
    overlay.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      (document.activeElement === nextButton ? cityButton : nextButton).focus();
    });
    requestAnimationFrame(() => nextButton.focus());
  }

  overlay.appendChild(panel);
  showOverlay(overlay);
}

export function renderDefeatOverlay(result: DefeatPenaltyResult): void {
  removeBattleResultOverlays();

  const overlay = createBaseOverlay(
    "battleDefeatOverlay",
    "reward-overlay defeat-overlay",
  );
  const panel = document.createElement("div");
  panel.className = "reward-panel defeat-panel";

  const defeat = document.createElement("div");
  defeat.className = "reward-victory defeat-heading";
  defeat.textContent = "DERROTA";

  const title = document.createElement("h2");
  title.className = "reward-title";
  title.textContent = "Penalidades da derrota";

  const penalties = document.createElement("div");
  penalties.className = "reward-grid";
  penalties.append(
    createRewardCard("XP perdido", `-${result.xpLost}`, "defeat-xp"),
    createRewardCard("Ouro perdido", `-${result.goldLost}`, "defeat-gold"),
  );

  const explanation = document.createElement("p");
  explanation.className = "defeat-explanation";
  explanation.textContent =
    "Você perdeu 5% da XP atual e até 200 de ouro. Retornando para a Praça...";

  const progress = document.createElement("div");
  progress.className = "reward-progress";
  progress.textContent = `Nível ${result.progress.nivel} • XP ${result.progress.xp}/${result.progress.xpParaProximoNivel} • Ouro restante ${result.progress.ouro}`;

  panel.append(defeat, title, penalties, explanation, progress);
  overlay.appendChild(panel);
  showOverlay(overlay);
}

function createBaseOverlay(id: string, className: string): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = className;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  return overlay;
}

function removeBattleResultOverlays(): void {
  document.getElementById("battleRewardOverlay")?.remove();
  document.getElementById("battleDefeatOverlay")?.remove();
}

function showOverlay(overlay: HTMLDivElement): void {
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("reward-overlay-visible");
  });
}

function createRewardCard(
  label: string,
  value: string,
  modifierClass: string,
): HTMLElement {
  const card = document.createElement("div");
  card.className = `reward-card ${modifierClass}`;

  const valueElement = document.createElement("strong");
  valueElement.className = "reward-value";
  valueElement.textContent = value;

  const labelElement = document.createElement("span");
  labelElement.className = "reward-label";
  labelElement.textContent = label;

  card.append(valueElement, labelElement);
  return card;
}
