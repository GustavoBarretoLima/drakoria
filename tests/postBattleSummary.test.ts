import assert from "node:assert/strict";
import { getVictoryUnlocks } from "../client/src/ui/rewardOverlay.js";
import type { RewardResult } from "../client/src/progression/progressionClient.js";

function rewardResult(level: number, levelsGained: number): RewardResult {
  return {
    levelsGained,
    progress: {
      goblinInicialDerrotado: true,
      entrouEmDrakoria: true,
      dungeonsLiberadas: ["goblin"],
      missoesConcluidas: [],
      nivel: level,
      xp: 20,
      xpParaProximoNivel: 150,
      ouro: 100,
    },
  };
}

assert.deepEqual(getVictoryUnlocks(rewardResult(4, 1), "guerreiro"), []);
assert.deepEqual(getVictoryUnlocks(rewardResult(5, 1), "guerreiro"), [
  "Golpe do Guardião • Habilidade de nível 5",
]);
assert.deepEqual(getVictoryUnlocks(rewardResult(10, 1), "mago"), [
  "Explosão Arcana • Habilidade de nível 10",
]);
assert.deepEqual(getVictoryUnlocks(rewardResult(10, 6), "arqueiro"), [
  "Flecha Perfurante • Habilidade de nível 5",
  "Disparo Duplo • Habilidade de nível 10",
]);
assert.deepEqual(getVictoryUnlocks(rewardResult(10, 0), "arqueiro"), []);

console.log("Passed: post-battle class-skill unlock summary across single and multi-level rewards.");
