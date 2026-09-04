import socket from "./network/socket.js";
import { renderBattle } from "./battle/battleRenderer.js";
import { setupBattlePage } from "./pages/battlePage.js";
import type { BattleState } from "../../shared/src/types/combat.js";

socket.on("connect", () => {
  console.log("Cliente conectado ao servidor:", socket.id);

  const classeHeroi = (
    localStorage.getItem("classeHeroi") || "guerreiro"
  ).toLowerCase();

  socket.emit("player:setup", {
    className: classeHeroi,
    monsterId: localStorage.getItem("monsterIdAtual") || "goblin-normal-lvl-1",
  });
});

socket.on("battle:update", (state: BattleState) => {
  console.log("Novo estado da batalha:", state);
  renderBattle(state);
});

window.addEventListener("DOMContentLoaded", () => {
  setupBattlePage();
});
