import { loadProgress, saveProgress, awardBattleRewards } from "../client/src/progression/progressionClient.ts";
import { normalizeProgress } from "../shared/src/progression/playerProgress.ts";

function adicionarRecompensa({ ouro = 0, xp = 0 } = {}) {
  return awardBattleRewards({ gold: ouro, xp }).progress;
}

function marcarGoblinInicialDerrotado() {
  const progresso = loadProgress();
  const jaConcluiu = progresso.missoesConcluidas.includes("derrotar-goblin-inicial");
  progresso.goblinInicialDerrotado = true;
  if (!jaConcluiu) progresso.missoesConcluidas.push("derrotar-goblin-inicial");
  saveProgress(progresso);
  return jaConcluiu ? progresso : adicionarRecompensa({ ouro: 25, xp: 30 });
}

function marcarEntradaDrakoria() {
  const progresso = loadProgress();
  progresso.entrouEmDrakoria = true;
  saveProgress(progresso);
}

function resetarProgresso() {
  saveProgress(normalizeProgress(undefined));
}

window.progressoDrakoria = {
  carregarProgresso: loadProgress,
  salvarProgresso: saveProgress,
  adicionarRecompensa,
  marcarGoblinInicialDerrotado,
  marcarEntradaDrakoria,
  resetarProgresso,
};
