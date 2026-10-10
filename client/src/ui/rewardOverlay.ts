import type { BattleRewards, HeroClass } from "../../../shared/src/types/combat.js";
import type { ExpeditionRewards } from "../../../shared/src/dungeons/expedition.js";
import type { EquipmentItem, EquipmentRarity } from "../../../shared/src/types/equipment.js";
import { getClassSkills } from "../../../shared/src/combat/classSkills.js";
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
  expedition?: ExpeditionRewards | undefined;
  victories?: number;
  bossAfterVictories?: number | undefined;
  onReturnToSquare?: () => void;
  preparationPotions?: { label: string; count: number; use: () => PotionActionResult }[];
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

export interface ExpeditionProgressView {
  percent: number;
  label: string;
  detail: string;
}

function normalizeRewardHeroClass(value: string | null): HeroClass {
  if (value === "mago" || value === "arqueiro") return value;
  return "guerreiro";
}

export function getVictoryUnlocks(result: RewardResult, heroClass: HeroClass): string[] {
  if (result.levelsGained <= 0) return [];
  const previousLevel = Math.max(1, result.progress.nivel - result.levelsGained);
  return getClassSkills(heroClass)
    .filter(skill => skill.unlockLevel > previousLevel && skill.unlockLevel <= result.progress.nivel)
    .map(skill => `${skill.name} • Habilidade de nível ${skill.unlockLevel}`);
}

export function getExpeditionProgressView(actions: VictoryActions): ExpeditionProgressView | null {
  if (!actions.expedition) return null;

  if (actions.bossDefeated) {
    return {
      percent: 100,
      label: "Expedição concluída",
      detail: `${actions.bossName ?? "Boss"} derrotado`,
    };
  }

  if (actions.danger) {
    return {
      percent: 100,
      label: "Boss disponível",
      detail: `Próximo encontro: ${actions.bossName ?? "Boss"}`,
    };
  }

  const victories = Math.max(0, actions.victories ?? 0);
  const target = Math.max(1, actions.bossAfterVictories ?? victories + 1);
  const percent = actions.bossAfterVictories
    ? Math.min(100, Math.round(victories / target * 100))
    : Math.min(95, victories * 10);
  const remaining = actions.bossAfterVictories
    ? Math.max(0, target - victories)
    : null;

  return {
    percent,
    label: "Exploração em andamento",
    detail: remaining === null
      ? `Profundidade ${actions.depth ?? 1}`
      : `${victories}/${target} vitórias • ${remaining} até o boss`,
  };
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
  title.textContent = "Resumo da batalha";

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
    levelUp.textContent = result.levelsGained > 1
      ? `LEVEL UP! +${result.levelsGained} níveis • Nível ${result.progress.nivel}`
      : `LEVEL UP! Nível ${result.progress.nivel}`;
    panel.appendChild(levelUp);

    const heroClass = normalizeRewardHeroClass(
      typeof localStorage === "undefined" ? null : localStorage.getItem("classeHeroi"),
    );
    const unlocks = getVictoryUnlocks(result, heroClass);
    if (unlocks.length > 0) {
      const unlockSection = document.createElement("div");
      unlockSection.className = "reward-drops reward-unlocks";
      const unlockTitle = document.createElement("h3");
      unlockTitle.textContent = "Novos desbloqueios";
      unlockSection.appendChild(unlockTitle);
      for (const unlock of unlocks) {
        const row = document.createElement("div");
        row.className = "reward-drop-item rarity-uncommon";
        row.textContent = `✦ ${unlock}`;
        unlockSection.appendChild(row);
      }
      panel.appendChild(unlockSection);
    }
  }

  const dropsSection = document.createElement("div");
  dropsSection.className = "reward-drops";

  const dropsTitle = document.createElement("h3");
  dropsTitle.textContent = "Loot desta batalha";
  dropsSection.appendChild(dropsTitle);

  if (drops.length > 0) {
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
  } else {
    const emptyLoot = document.createElement("div");
    emptyLoot.className = "reward-drop-item reward-drop-empty";
    emptyLoot.textContent = "Nenhum item obtido nesta batalha.";
    dropsSection.appendChild(emptyLoot);
  }

  panel.appendChild(dropsSection);

  const progress = document.createElement("div");
  progress.className = "reward-progress";
  const xpPercent = result.progress.xpParaProximoNivel > 0
    ? Math.min(100, Math.max(0, Math.round(result.progress.xp / result.progress.xpParaProximoNivel * 100)))
    : 0;
  progress.textContent = `Nível ${result.progress.nivel} • XP ${result.progress.xp}/${result.progress.xpParaProximoNivel} (${xpPercent}%) • Ouro total ${result.progress.ouro}`;
  panel.appendChild(progress);

  if (actions) {
    const expeditionProgress = getExpeditionProgressView(actions);
    if (actions.expedition && expeditionProgress) {
      const progressCard = document.createElement("section");
      progressCard.className = `reward-expedition-progress${actions.danger ? " is-boss-ready" : ""}${actions.bossDefeated ? " is-complete" : ""}`;

      const heading = document.createElement("div");
      heading.className = "reward-expedition-progress-heading";
      const state = document.createElement("strong");
      state.textContent = expeditionProgress.label;
      const percent = document.createElement("span");
      percent.textContent = `${expeditionProgress.percent}%`;
      heading.append(state, percent);

      const track = document.createElement("div");
      track.className = "reward-expedition-progress-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", String(expeditionProgress.percent));
      const fill = document.createElement("div");
      fill.className = "reward-expedition-progress-fill";
      fill.setAttribute("style", `width:${expeditionProgress.percent}%`);
      track.appendChild(fill);

      const detail = document.createElement("p");
      detail.textContent = expeditionProgress.detail;
      progressCard.append(heading, track, detail);
      panel.appendChild(progressCard);

      const summary = document.createElement("details");
      summary.className = "reward-expedition";
      const summaryHeading = document.createElement("summary");
      summaryHeading.textContent = `Expedição acumulada • ${actions.expedition.xp} XP • ${actions.expedition.gold} ouro`;
      const regionDetail = document.createElement("p");
      regionDetail.textContent = `${actions.regionName ?? "Dungeon"} • ${actions.victories ?? 0} vitórias • Profundidade ${actions.depth ?? 1}`;
      const lootHeading = document.createElement("strong");
      lootHeading.className = "reward-expedition-loot-title";
      lootHeading.textContent = "Loot acumulado da expedição";
      summary.append(summaryHeading, regionDetail, lootHeading);
      for (const loot of actions.expedition.loot) {
        const row = document.createElement("p");
        row.textContent = `${loot.quantity}× ${loot.name}`;
        summary.append(row);
      }
      if (!actions.expedition.loot.length) {
        const row = document.createElement("p");
        row.textContent = "Nenhum equipamento ou livro obtido nesta expedição.";
        summary.append(row);
      }
      summary.open = Boolean(actions.bossDefeated);
      panel.appendChild(summary);
    }

    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    title.id = "battleVictoryTitle";
    overlay.setAttribute("aria-labelledby", title.id);

    if (actions.danger) {
      const danger = document.createElement("div");
      danger.className = "reward-danger";
      danger.textContent = `⚠ ${actions.bossName ?? "Boss"} está à frente. Recupere seus recursos antes de iniciar o confronto.`;
      panel.appendChild(danger);
    } else if (actions.bossDefeated) {
      const cleared = document.createElement("div");
      cleared.className = "reward-level-up";
      cleared.textContent = `${actions.regionName ?? "Dungeon"}: ${actions.bossName ?? "Boss"} foi derrotado. Expedição concluída!`;
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
      parent: HTMLElement = buttons,
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
      parent.appendChild(button);
    };

    if (actions.preparationPotions) {
      buttons.classList.add("boss-preparation-actions");
      const preparation = document.createElement("details");
      preparation.className = "reward-preparation";
      const heading = document.createElement("summary");
      heading.textContent = "Preparação para o boss • Poções da mochila";
      const potions = document.createElement("div");
      potions.className = "reward-actions reward-preparation-potions";
      preparation.append(heading, potions);
      panel.appendChild(preparation);
      for (const potion of actions.preparationPotions) {
        addPotionButton(`Usar ${potion.label}`, potion.count, potion.use, potions);
      }
    } else {
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
    }

    if (actions.onReturnToSquare) {
      const square = document.createElement("button");
      square.type = "button";
      square.className = "reward-action-secondary";
      square.textContent = "Retornar à cidade";
      square.addEventListener("click", () => {
        if (chosen) return;
        chosen = true;
        actions.onReturnToSquare!();
      });
      buttons.appendChild(square);
    }

    const cityButton = document.createElement("button");
    cityButton.type = "button";
    cityButton.className = "reward-action-secondary";
    cityButton.textContent = actions.bossDefeated
      ? "Concluir expedição"
      : actions.exitLabel ?? "Sair da dungeon";
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
        ? `Preparar e enfrentar ${actions.bossName ?? "Boss"}`
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
