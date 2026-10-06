import socket from "./network/socket.js";
import { renderBattle } from "./battle/battleRenderer.js";
import { setEnemyGifs } from "./assets/gifs.js";
import { setupBattlePage } from "./pages/battlePage.js";
import {
  isPagesDemoMode,
  startDemoBattle,
  subscribeDemoBattle,
} from "./demo/demoBattle.js";
import { awardBattleRewards } from "./progression/progressionClient.js";
import { renderVictoryRewardOverlay } from "./ui/rewardOverlay.js";
import type {
  BattleState,
  HeroClass,
} from "../../shared/src/types/combat.js";

const demoMode = isPagesDemoMode();
let demoVictoryRedirectScheduled = false;
let rewardedBattleId: string | null = null;

function normalizeHeroClass(className: string): HeroClass {
  if (className === "mago" || className === "arqueiro") {
    return className;
  }

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
  renderVictoryRewardOverlay(state.rewards, result);
}

function scheduleDemoVictoryRedirect(): void {
  if (demoVictoryRedirectScheduled) return;
  demoVictoryRedirectScheduled = true;

  const battleType =
    localStorage.getItem("tipoBatalhaAtual") || "historia-goblin-inicial";
  const isDungeon = battleType.startsWith("dungeon-");
  const targetPage = isDungeon ? "praca.html" : "caminho-drakoria.html";

  window.setTimeout(() => {
    localStorage.removeItem("tipoBatalhaAtual");
    localStorage.removeItem("monsterIdAtual");
    window.location.href = `${import.meta.env.BASE_URL}pages/${targetPage}`;
  }, 4200);
}

function renderState(state: BattleState): void {
  console.log("Novo estado da batalha:", state);
  setEnemyGifs(state.enemy.sprites);
  renderBattle(state);
  renderAtbPhase(state);
  applyVictoryRewards(state);

  if (demoMode && state.finished && state.winnerId === state.hero.id) {
    scheduleDemoVictoryRedirect();
  }
}

if (demoMode) {
  subscribeDemoBattle(renderState);
} else {
  socket.on("connect", () => {
    console.log("Cliente conectado ao servidor:", socket.id);

    socket.emit("player:setup", {
      className: getSelectedHeroClass(),
      monsterId: getSelectedMonsterId(),
    });
  });

  socket.on("battle:update", renderState);
}

window.addEventListener("DOMContentLoaded", () => {
  setupBattlePage();

  if (demoMode) {
    const banner = document.getElementById("demoModeBanner");
    if (banner) banner.hidden = false;

    startDemoBattle(getSelectedHeroClass(), getSelectedMonsterId());
  }
});
