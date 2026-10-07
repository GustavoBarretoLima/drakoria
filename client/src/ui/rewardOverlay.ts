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

export interface PotionActionResult {
  used: boolean;
  remaining: number;
  vitals: {
    hp: number;
    mana: number;
    maxHp: number;
    maxMana: number;
  };
}

export interface VictoryActions {
  onNextMonster: () => void;
  onReturnToCity: () => void;
  exitLabel?: string;
  onUsePotion?: () => PotionActionResult;
  potionCount?: number;
  onUseHealthPotion?: () => PotionActionResult;
  healthPotionCount?: number;
  onUseManaPotion?: () => PotionActionResult;
  manaPotionCount?: number;
  depth?: number;
  danger?: boolean;
  bossDefeated?: boolean;
  bossName?: string;
  regionName?: string;
  vitals?: PotionActionResult["vitals"];
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

    if (actions.danger) {
      const danger = document.createElement("div");
      danger.className = "reward-danger";
      danger.textContent = `⚠ DANGER — Uma presença esmagadora bloqueia o caminho: ${actions.bossName ?? "Orc Rei"}!`;
      panel.appendChild(danger);
    } else if (actions.bossDefeated) {
      const cleared = document.createElement("div");
      cleared.className = "reward-level-up";
      cleared.textContent = `${actions.regionName ?? "Fortaleza do Rei Orc"}: ${actions.bossName ?? "Orc Rei"} foi derrotado. Exploração concluída!`;
      panel.appendChild(cleared);
    } else if (actions.depth !== undefined) {
      const depth = document.createElement("div");
      depth.className = "reward-progress";
      depth.textContent = `Profundidade atual: ${actions.depth}. Quanto mais fundo, mais fortes serão os inimigos.`;
      panel.appendChild(depth);
    }

    const vitals = document.createElement("div");
    vitals.className = "reward-progress";
    const renderVitals = (hp: number, mana: number, maxHp: number, maxMana: number) => {
      vitals.textContent = `Recursos da expedição: HP ${hp}/${maxHp} • Mana ${mana}/${maxMana}`;
    };
    if (actions.vitals) {
      renderVitals(actions.vitals.hp, actions.vitals.mana, actions.vitals.maxHp, actions.vitals.maxMana);
      panel.appendChild(vitals);
    }

    const buttons = document.createElement("div");
    buttons.className = "reward-actions";
    let chosen = false;

    const addPotionButton = (
      label: string,
      initialCount: number,
      action: (() => PotionActionResult) | undefined,
    ) => {
      if (!action) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reward-action-secondary";
      const setLabel = (remaining: number) => {
        button.textContent = `${label} (${remaining})`;
        button.disabled = remaining <= 0;
      };
      setLabel(initialCount);
      button.addEventListener("click", () => {
        if (chosen) return;
        const potionResult = action();
        setLabel(potionResult.remaining);
        renderVitals(
          potionResult.vitals.hp,
          potionResult.vitals.mana,
          potionResult.vitals.maxHp,
          potionResult.vitals.maxMana,
        );
      });
      buttons.appendChild(button);
    };

    addPotionButton(
      "Usar Poção de HP",
      actions.healthPotionCount ?? 0,
      actions.onUseHealthPotion,
    );
    addPotionButton(
      "Usar Poção de Mana",
      actions.manaPotionCount ?? 0,
      actions.onUseManaPotion,
    );
    addPotionButton(
      "Usar Poção Restauradora",
      actions.potionCount ?? 0,
      actions.onUsePotion,
    );

    const cityButton = document.createElement("button");
    cityButton.type = "button";
    cityButton.className = "reward-action-secondary";
    cityButton.textContent = actions.exitLabel ?? "Sair da dungeon";
    cityButton.addEventListener("click", () => {
      if (chosen) return;
      chosen = true;
      cityButton.disabled = true;
      nextButton?.setAttribute("disabled", "true");
      actions.onReturnToCity();
    });

    let nextButton: HTMLButtonElement | null = null;
    if (!actions.bossDefeated) {
      nextButton = document.createElement("button");
      nextButton.type = "button";
      nextButton.textContent = actions.danger
        ? `Enfrentar ${actions.bossName ?? "Orc Rei"}`
        : "Continuar explorando";
      nextButton.addEventListener("click", () => {
        if (chosen) return;
        chosen = true;
        nextButton!.disabled = true;
        cityButton.disabled = true;
        actions.onNextMonster();
      });
      buttons.appendChild(nextButton);
    }

    buttons.appendChild(cityButton);
    panel.appendChild(buttons);
    requestAnimationFrame(() => (nextButton ?? cityButton).focus());
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
    "Você perdeu 5% da XP atual e até 200 de ouro. Você retornará à cidade com 30% da vida máxima (perda de 70%). A mana restante é mantida. Você pode continuar explorando ou descansar na Taberna.";

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
