import { recordQuestVictory } from "./progression/questClient.js";
import { prepareNextMonster, clearBattleStorage, completeIntroVictory } from "./battle/victoryNavigation.js";
import { getBattleExitPage } from "./battle/worldMapNavigation.js";
import { setupBattleArena } from "./assets/battleArena.js";
import { getDungeonConfig } from "../../shared/src/dungeons/dungeonEncounters.js";
import { applySubclassStats } from "../../shared/src/classes/subclasses.js";
import { applyTreeStats } from "../../shared/src/classes/skillTrees.js";
import { recoverAfterDefeat } from "./battle/defeatRecovery.js";
import { registerDungeonVictory } from "./battle/dungeonRunClient.js";
import {
  loadConsumables,
  loadHeroVitals,
  saveHeroVitals,
  savePotionInventory,
  useHealthPotion,
  useManaPotion,
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
  addSubclassBookDrops,
  getActiveSubclass,
  loadSubclassProgress,
} from "./progression/subclassClient.js";
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
  const stats = applyTreeStats(applySubclassStats(
    applyEquipmentStats(
      createStatsForLevel(heroClass, heroLevel),
      getEquippedItems(),
    ),
    getActiveSubclass(getSelectedHeroClass()),
  ), getActiveSubclass(getSelectedHeroClass()), getHeroLevel(), loadSubclassProgress().treeRanks);
  return loadHeroVitals(stats.maxHp, stats.maxMana);
}

function persistBattleVitals(state: BattleState): void {
  if (penalizedBattleId === state.id) return;
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

function syncPotionButtonsWithStorage(): void {
  const overlay = document.getElementById("battleRewardOverlay");
  if (!overlay) return;

  const consumables = loadConsumables();
  const buttons = Array.from(
    overlay.querySelectorAll<HTMLButtonElement>(".reward-actions button"),
  );

  const syncButton = (prefix: string, count: number) => {
    const button = buttons.find((candidate) =>
      candidate.textContent?.startsWith(prefix),
    );
    if (!button) return;
    button.textContent = `${prefix} (${count})`;
    button.disabled = count <= 0;
  };

  syncButton("Usar Poção de HP", consumables.healthPotion);
  syncButton("Usar Poção de Mana", consumables.manaPotion);
  syncButton("Usar Poção Restauradora", consumables.restorativePotion);
}

function applyVictoryRewards(state: BattleState): void {
  if (!state.finished || state.winnerId !== state.hero.id) return;
  if (!state.rewards) return;
  if (rewardedBattleId === state.id) return;

  rewardedBattleId = state.id;
  const result = awardBattleRewards(state.rewards);
  recordQuestVictory(state);
  const drops = state.rewards.drops ?? [];
  const classBooks = state.rewards.classBooks ?? [];
  addDropsToInventory(drops);
  addSubclassBookDrops(classBooks);
  const introDestination = completeIntroVictory(localStorage, state);
  if (introDestination) {
    window.location.href = `${import.meta.env.BASE_URL}pages/${introDestination}`;
    return;
  }
  const run = registerDungeonVictory(state.enemy.id);
  const regionConfig = run ? getDungeonConfig(run.dungeonId) : undefined;
  const vitals = loadHeroVitals(state.hero.stats.maxHp, state.hero.stats.maxMana);
  const consumables = loadConsumables();

  renderVictoryRewardOverlay(
    state.rewards,
    result,
    [
      ...drops.map((drop) => ({
        name: drop.item.name,
        quantity: drop.quantity,
        rarity: drop.item.rarity,
        level: drop.item.level,
        allowedClasses: drop.item.allowedClasses,
      })),
      ...classBooks.map((book) => ({
        name: `📖 ${book.name}`,
        quantity: book.quantity,
        rarity: "mythic" as const,
      })),
    ],
    {
      onNextMonster: () => {
        prepareNextMonster(localStorage);
        window.location.href = `${import.meta.env.BASE_URL}pages/batalha.html`;
      },
      onReturnToCity: () => {
        const destination = getBattleExitPage(localStorage);
        clearBattleStorage(localStorage);
        window.location.href = `${import.meta.env.BASE_URL}pages/${destination}`;
      },
      exitLabel: getBattleExitPage(localStorage) === "mapa.html" ? "Voltar ao mapa" : "Retornar à praça",
      onUseHealthPotion: () => {
        const potion = useHealthPotion();
        window.setTimeout(syncPotionButtonsWithStorage, 0);
        return potion;
      },
      healthPotionCount: consumables.healthPotion,
      onUseManaPotion: () => {
        const potion = useManaPotion();
        window.setTimeout(syncPotionButtonsWithStorage, 0);
        return potion;
      },
      manaPotionCount: consumables.manaPotion,
      onUsePotion: () => {
        const potion = useRestorativePotion();
        window.setTimeout(syncPotionButtonsWithStorage, 0);
        return potion;
      },
      potionCount: consumables.restorativePotion,
      ...(run ? { depth: run.depth } : {}),
      danger: Boolean(run?.bossPending),
      bossDefeated: Boolean(run?.bossDefeated),
      ...(regionConfig?.bossName ? { bossName: regionConfig.bossName, regionName: regionConfig.label } : {}),
      vitals,
    },
  );

  window.setTimeout(syncPotionButtonsWithStorage, 0);
}

function applyBattleDefeat(state: BattleState): void {
  if (!state.finished || state.winnerId === state.hero.id) return;
  if (penalizedBattleId === state.id) return;

  penalizedBattleId = state.id;
  const result = applyDefeatPenalty();
  recoverAfterDefeat({ hp: state.hero.stats.hp, mana: state.hero.stats.mana, maxHp: state.hero.stats.maxHp, maxMana: state.hero.stats.maxMana });
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

let lastPotionSnapshot="";
function renderState(state: BattleState): void {
  console.log("Novo estado da batalha:", state);
  persistBattleVitals(state);
  if(state.potions){const snapshot=state.id+JSON.stringify(state.potions);if(snapshot!==lastPotionSnapshot){savePotionInventory(state.potions);lastPotionSnapshot=snapshot;}}
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
      potions:loadConsumables(),
      heroName: localStorage.getItem("nomeHeroi") || "Heroi",
      treeRanks: loadSubclassProgress().treeRanks,
      equippedSkills: loadSubclassProgress().equippedSkills,
      className: getSelectedHeroClass(),
      subclassId: getActiveSubclass(),
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
  setupBattleArena();
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
