import assert from "node:assert/strict";
import { getExpeditionProgressView } from "../client/src/ui/rewardOverlay.js";

const baseActions = {
  expedition: { xp: 120, gold: 55, loot: [], battles: [] },
  onNextMonster: () => {},
  onReturnToCity: () => {},
};

assert.deepEqual(
  getExpeditionProgressView({ ...baseActions, victories: 3, bossAfterVictories: 6, depth: 4 }),
  { percent: 50, label: "Exploração em andamento", detail: "3/6 vitórias • 3 até o boss" },
);

assert.deepEqual(
  getExpeditionProgressView({ ...baseActions, victories: 6, bossAfterVictories: 6, danger: true, bossName: "Hidra" }),
  { percent: 100, label: "Boss disponível", detail: "Próximo encontro: Hidra" },
);

assert.deepEqual(
  getExpeditionProgressView({ ...baseActions, bossDefeated: true, bossName: "Hidra" }),
  { percent: 100, label: "Expedição concluída", detail: "Hidra derrotado" },
);

assert.equal(getExpeditionProgressView({ onNextMonster: () => {}, onReturnToCity: () => {} }), null);
console.log("Passed: expedition progress, boss-ready and completion states.");
