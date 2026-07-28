const PROGRESSO_KEY = "drakoriaProgresso";

const progressoPadrao = {
  goblinInicialDerrotado: false,
  entrouEmDrakoria: false,
  dungeonsLiberadas: ["goblin"],
  missoesConcluidas: [],
  nivel: 1,
  xp: 0,
  xpParaProximoNivel: 100,
  ouro: 0,
};

function carregarProgresso() {
  const salvo = localStorage.getItem(PROGRESSO_KEY);

  if (!salvo) {
    salvarProgresso(progressoPadrao);
    return { ...progressoPadrao };
  }

  try {
    return {
      ...progressoPadrao,
      ...JSON.parse(salvo),
    };
  } catch {
    salvarProgresso(progressoPadrao);
    return { ...progressoPadrao };
  }
}

function salvarProgresso(progresso) {
  localStorage.setItem(PROGRESSO_KEY, JSON.stringify(progresso));
}

function adicionarRecompensa({ ouro = 0, xp = 0 }) {
  const progresso = carregarProgresso();

  progresso.ouro += ouro;
  progresso.xp += xp;

  while (progresso.xp >= progresso.xpParaProximoNivel) {
    progresso.xp -= progresso.xpParaProximoNivel;
    progresso.nivel += 1;
    progresso.xpParaProximoNivel = Math.floor(
      progresso.xpParaProximoNivel * 1.25,
    );
  }

  salvarProgresso(progresso);
  return progresso;
}

function marcarGoblinInicialDerrotado() {
  const progresso = carregarProgresso();

  const jaConcluiu = progresso.missoesConcluidas.includes(
    "derrotar-goblin-inicial",
  );

  progresso.goblinInicialDerrotado = true;

  if (!jaConcluiu) {
    progresso.missoesConcluidas.push("derrotar-goblin-inicial");
    progresso.ouro += 25;
    progresso.xp += 30;
  }

  while (progresso.xp >= progresso.xpParaProximoNivel) {
    progresso.xp -= progresso.xpParaProximoNivel;
    progresso.nivel += 1;
    progresso.xpParaProximoNivel = Math.floor(
      progresso.xpParaProximoNivel * 1.25,
    );
  }

  salvarProgresso(progresso);
  return progresso;
}

function marcarEntradaDrakoria() {
  const progresso = carregarProgresso();
  progresso.entrouEmDrakoria = true;
  salvarProgresso(progresso);
}

function resetarProgresso() {
  salvarProgresso(progressoPadrao);
}

window.progressoDrakoria = {
  carregarProgresso,
  salvarProgresso,
  adicionarRecompensa,
  marcarGoblinInicialDerrotado,
  marcarEntradaDrakoria,
  resetarProgresso,
};
