import socket from "./network/socket.js";
import { renderBattle } from "./battle/battleRenderer.js";
import { setupBattlePage } from "./pages/battlePage.js";
import {
  isPagesDemoMode,
  startDemoBattle,
  subscribeDemoBattle,
} from "./demo/demoBattle.js";
import type {
  BattleState,
  HeroClass,
} from "../../shared/src/types/combat.js";

const demoMode = isPagesDemoMode();
let demoVictoryRedirectScheduled = false;

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

function renderState(state: BattleState): void {
  console.log("Novo estado da batalha:", state);
  renderBattle(state);
  renderAtbPhase(state);

  if (
    demoMode &&
    state.finished &&
    state.winnerId === state.hero.id &&
    !demoVictoryRedirectScheduled
  ) {
    demoVictoryRedirectScheduled = true;
    window.setTimeout(() => {
      window.location.href = `${import.meta.env.BASE_URL}pages/caminho-drakoria.html`;
    }, 2000);
  }
}

if (demoMode) {
  subscribeDemoBattle(renderState);
} else {
  socket.on("connect", () => {
    console.log("Cliente conectado ao servidor:", socket.id);

    socket.emit("player:setup", {
      className: getSelectedHeroClass(),
      monsterId:
        localStorage.getItem("monsterIdAtual") || "goblin-normal-lvl-1",
    });
  });

  socket.on("battle:update", renderState);
}

window.addEventListener("DOMContentLoaded", () => {
  setupBattlePage();

  if (demoMode) {
    const banner = document.getElementById("demoModeBanner");
    if (banner) banner.hidden = false;

    startDemoBattle(getSelectedHeroClass());
  }
});
