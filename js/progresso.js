const PROGRESSO_KEY = "drakoriaProgresso";

const progressoPadrao = {
  goblinInicialDerrotado: false,
  entrouEmDrakoria: false,
  dungeonsLiberadas: ["goblin"],
  missoesConcluidas: [],
  nivel: 1,
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

function marcarGoblinInicialDerrotado() {
  const progresso = carregarProgresso();
  const jaConcluiu = progresso.missoesConcluidas.includes(
    "derrotar-goblin-inicial",
  );

  progresso.goblinInicialDerrotado = true;

  if (!jaConcluiu) {
    progresso.missoesConcluidas.push("derrotar-goblin-inicial");
    progresso.ouro += 25;
  }

  salvarProgresso(progresso);
}

function marcarEntradaDrakoria() {
  const progresso = carregarProgresso();

  progresso.entrouEmDrakoria = true;
  salvarProgresso(progresso);
}

function adicionarOuro(valor) {
  const progresso = carregarProgresso();

  progresso.ouro += valor;
  salvarProgresso(progresso);
}

function subirNivel() {
  const progresso = carregarProgresso();

  progresso.nivel += 1;
  salvarProgresso(progresso);
}

function resetarProgresso() {
  salvarProgresso(progressoPadrao);
}

window.progressoDrakoria = {
  carregarProgresso,
  salvarProgresso,
  marcarGoblinInicialDerrotado,
  marcarEntradaDrakoria,
  adicionarOuro,
  subirNivel,
  resetarProgresso,
};
