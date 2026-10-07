import { prepareNextMonster, clearBattleStorage } from "./battle/victoryNavigation.js";
import { registerDungeonVictory } from "./battle/dungeonRunClient.js";
import {
  loadConsumables,
  loadHeroVitals,
  saveHeroVitals,
  useRestorativePotion,
} from "./battle/heroVitals.js";
import socket from "./network/socket.js";
import { renderBattle } from "./battle/battleRenderer.js";
import { setEnemyGifs } from "./assets/gifs.js";
import { setupBattlePage } from "./pages/battlePage.js";
import {
  isPagesDemoMode,
  startDemoBattle,
  subscribeDemoBattle,
} from "./demo/demoBattle.js";
import {
  addDropsToInventory,
  getEquippedItems,
} from "./inventory/inventoryClient.js";
import {
  applyDefeatPenalty,
  awardBattleRewards,
} from "./progression/progressionClient.js";
import {
  renderDefeatOverlay,
  renderVictoryRewardOverlay,
} from "./ui/rewardOverlay.js";
import { createStatsForLevel } from "../../shared/src/combat/classStats.js";
import { applyEquipmentStats } from "../../shared/src/equipment/equipmentStats.js";
import type {
  BattleState,
  HeroClass,
} from "../../shared/src/types/combat.js";

const demoMode = isPagesDemoMode();
let defeatRedirectScheduled = false;
let rewardedBattleId: string | null = null;
let penalizedBattleId: string | null = null;

function normalizeHeroClass(className: string): HeroClass {
  if (className === "mago" || className === "arqueiro") return className;
  return "guerreiro";
}

function getSelectedHeroClass(): HeroClass {
  return normalizeHeroClass(
    (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase(),
  );
}

function getSelectedMonsterId(): string {
  return localStorage.getItem("monsterIdAtual") || "goblin-normal-lvl-1";
}

function getHeroLevel(): number {
  const saved = localStorage.getItem("drakoriaProgresso");
  if (!saved) return 1;

  try {
    const level = Number((JSON.parse(saved) as { nivel?: number }).nivel ?? 1);
    if (!Number.isFinite(level)) return 1;
    return Math.min(100, Math.max(1, Math.floor(level)));
  } catch {
    return 1;
  }
}

function getCurrentHeroVitals() {
  const heroClass = getSelectedHeroClass();
  const heroLevel = getHeroLevel();
  const stats = applyEquipmentStats(
    createStatsForLevel(heroClass, heroLevel),
    getEquippedItems(),
  );
  return loadHeroVitals(stats.maxHp, stats.maxMana);
}

function persistBattleVitals(state: BattleState): void {
  saveHeroVitals({
    hp: state.hero.stats.hp,
    mana: state.hero.stats.mana,
    maxHp: state.hero.stats.maxHp,
    maxMana: state.hero.stats.maxMana,
  });
}

function renderAtbPhase(state: BattleState): void {
  const indicator = document.getElementById("indicadorTurno");
  if (!indicator || state.finished) return;

  if (state.turnOwnerId === null) {
    indicator.textContent = "ATB carregando...";
    return;
  }

  indicator.textContent =
    state.turnOwnerId === state.hero.id ? "Ação pronta!" : "Inimigo agindo...";
}

function applyVictoryRewards(state: BattleState): void {
  if (!state.finished || state.winnerId !== state.hero.id) return;
  if (!state.rewards) return;
  if (rewardedBattleId === state.id) return;

  rewardedBattleId = state.id;
  const result = awardBattleRewards(state.rewards);
  const drops = state.rewards.drops ?? [];
  addDropsToInventory(drops);
  const run = registerDungeonVictory(state.enemy.id);
  const vitals = loadHeroVitals(state.hero.stats.maxHp, state.hero.stats.maxMana);
  const consumables = loadConsumables();

  renderVictoryRewardOverlay(
    state.rewards,
    result,
    drops.map((drop) => ({
      name: drop.item.name,
      quantity: drop.quantity,
      rarity: drop.item.rarity,
      level: drop.item.level,
      allowedClasses: drop.item.allowedClasses,
    })),
    {
      onNextMonster: () => {
        prepareNextMonster(localStorage);
        window.location.href = `${import.meta.env.BASE_URL}pages/batalha.html`;
      },
      onReturnToCity: () => {
        clearBattleStorage(localStorage);
        window.location.href = `${import.meta.env.BASE_URL}pages/praca.html`;
      },
      onUsePotion: useRestorativePotion,
      potionCount: consumables.restorativePotion,
      ...(run ? { depth: run.depth } : {}),
      danger: Boolean(run?.bossPending),
      bossDefeated: Boolean(run?.bossDefeated),
      vitals,
    },
  );
}

function applyBattleDefeat(state: BattleState): void {
  if (!state.finished || state.winnerId === state.hero.id) return;
  if (penalizedBattleId === state.id) return;

  penalizedBattleId = state.id;
  const result = applyDefeatPenalty();
  renderDefeatOverlay(result);
}

function scheduleDefeatRedirect(): void {
  if (defeatRedirectScheduled) return;
  defeatRedirectScheduled = true;

  window.setTimeout(() => {
    clearBattleStorage(localStorage);
    window.location.href = `${import.meta.env.BASE_URL}pages/praca.html`;
  }, 4200);
}

function renderState(state: BattleState): void {
  console.log("Novo estado da batalha:", state);
  persistBattleVitals(state);
  setEnemyGifs(state.enemy.sprites);
  renderBattle(state);
  renderAtbPhase(state);
  applyVictoryRewards(state);
  applyBattleDefeat(state);

  if (state.finished && state.winnerId !== state.hero.id) {
    scheduleDefeatRedirect();
  }
}

if (demoMode) {
  subscribeDemoBattle(renderState);
} else {
  socket.on("connect", () => {
    console.log("Cliente conectado ao servidor:", socket.id);
    const vitals = getCurrentHeroVitals();

    socket.emit("player:setup", {
      className: getSelectedHeroClass(),
      monsterId: getSelectedMonsterId(),
      heroLevel: getHeroLevel(),
      equippedItemIds: getEquippedItems().map((item) => item.id),
      currentHp: vitals.hp,
      currentMana: vitals.mana,
    });
  });

  socket.on("battle:update", renderState);
}

window.addEventListener("DOMContentLoaded", () => {
  setupBattlePage();

  if (demoMode) {
    const banner = document.getElementById("demoModeBanner");
    if (banner) banner.hidden = false;
    startDemoBattle(
      getSelectedHeroClass(),
      getSelectedMonsterId(),
      getHeroLevel(),
    );
  }
});
