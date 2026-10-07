import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderBattleMessage(state: BattleState) {
  const mensagens = document.getElementById("mensagens");

  if (!mensagens) return;

  const message = state.lastEvent?.message ?? "";
  // ATB ticks repeat the last event; announce it only when its text changes.
  if (mensagens.textContent !== message) mensagens.textContent = message;
}
