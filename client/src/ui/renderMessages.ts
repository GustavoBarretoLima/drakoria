import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderBattleMessage(state: BattleState) {
  const mensagens = document.getElementById("mensagens");

  if (!mensagens) return;

  mensagens.textContent = state.lastEvent?.message ?? "";
}
