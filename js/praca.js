window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("abrirMenuBtn");
  const menu = document.getElementById("menuPraca");

  if (!btn) {
    console.error("Botão do menu não encontrado: #abrirMenuBtn");
    return;
  }

  if (!menu) {
    console.error("Menu da praça não encontrado: #menuPraca");
    return;
  }

  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
});

function getPainelPraca() {
  return document.getElementById("painelPraca");
}

function abrirInventario() {
  const inventarioDiv = document.getElementById("inventario");

  if (!inventarioDiv) {
    console.error("Inventário não encontrado: #inventario");
    return;
  }

  inventarioDiv.classList.toggle("hidden");

  if (!inventarioDiv.classList.contains("hidden") && window.inventario) {
    window.inventario.renderInventario();
  }
}

function abrirDungeon() {
  const painel = getPainelPraca();

  if (!painel) {
    console.error("Painel da praça não encontrado: #painelPraca");
    return;
  }

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Portão das Dungeons</h2>

    <p>
      Ao norte da Praça de Drakoria, um portal antigo pulsa com energia sombria.
      Heróis entram ali em busca de tesouros, glória e perigos.
    </p>

    <div class="painel-acoes">
      <button type="button" onclick="entrarDungeonGoblin()">
        Entrar na Dungeon dos Goblins
      </button>

      <button type="button" onclick="fecharPainelPraca()">
        Voltar
      </button>
    </div>
  `;
}
function entrarDungeonGoblin() {
  localStorage.setItem("tipoBatalhaAtual", "dungeon-goblin");
  localStorage.setItem("monsterIdAtual", "goblin-normal-lvl-1");
  window.location.href = "batalha.html";
}
function entrarDungeonOrc() {
  localStorage.setItem("tipoBatalhaAtual", "dungeon-orc");
  localStorage.setItem("monsterIdAtual", "orc-normal-lvl-10");
  window.location.href = "batalha.html";
}

function abrirStatus() {
  const painel = getPainelPraca();

  if (!painel) return;

  const nome = localStorage.getItem("nomeHeroi") || "Herói";
  const classe =
    localStorage.getItem("classeHeroiTexto") ||
    localStorage.getItem("classeHeroi") ||
    "guerreiro";
  const genero = localStorage.getItem("generoHeroi") || "Masculino";
  const progresso = window.progressoDrakoria?.carregarProgresso?.();

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Status do Herói</h2>

    <p><strong>Nome:</strong> ${nome}</p>
    <p><strong>Classe:</strong> ${classe}</p>
    <p><strong>Gênero:</strong> ${genero}</p>
    <p><strong>Nível:</strong> ${progresso?.nivel ?? 1}</p>
    <p><strong>XP:</strong> ${progresso?.xp ?? 0}/${progresso?.xpParaProximoNivel ?? 100}</p>
    <p><strong>Ouro:</strong> ${progresso?.ouro ?? 0}</p>
    <p><strong>Goblin inicial:</strong> ${
      progresso?.goblinInicialDerrotado ? "Derrotado" : "Pendente"
    }</p>
    <p><strong>Entrada em Drakoria:</strong> ${
      progresso?.entrouEmDrakoria ? "Liberada" : "Pendente"
    }</p>

    <div class="painel-acoes">
      <button type="button" onclick="fecharPainelPraca()">
        Fechar
      </button>
    </div>
  `;
}

function abrirLoja() {
  const painel = getPainelPraca();

  if (!painel) {
    console.error("Painel da praça não encontrado: #painelPraca");
    return;
  }

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Loja da Praça</h2>

    <p>
      Um mercador observa seus equipamentos e sorri.
      "Ainda estou organizando minhas mercadorias, herói."
    </p>

    <div class="painel-acoes">
      <button type="button" onclick="fecharPainelPraca()">
        Fechar
      </button>
    </div>
  `;
}

function abrirMissoes() {
  const painel = getPainelPraca();

  if (!painel) {
    console.error("Painel da praça não encontrado: #painelPraca");
    return;
  }

  const progresso = window.progressoDrakoria?.carregarProgresso?.();

  const goblinConcluido = progresso?.missoesConcluidas?.includes(
    "derrotar-goblin-inicial",
  );

  painel.classList.remove("hidden");
  painel.innerHTML = `
    <h2>Quadro de Missões</h2>

    <div class="missao-card">
      <h3>O caminho para Drakoria</h3>
      <p>
        Derrote o Goblin que bloqueia a estrada e prove seu valor diante dos guardas.
      </p>
      <strong>Status:</strong> ${goblinConcluido ? "Concluída" : "Em andamento"}
    </div>

    <div class="missao-card">
      <h3>Sussurros nas Dungeons</h3>
      <p>
        Criaturas continuam surgindo além das muralhas. Investigue a Dungeon dos Goblins.
      </p>
      <strong>Status:</strong> Disponível
    </div>

    <div class="painel-acoes">
      <button type="button" onclick="fecharPainelPraca()">
        Fechar
      </button>
    </div>
  `;
}

function fecharPainelPraca() {
  const painel = getPainelPraca();

  if (!painel) {
    console.error("Painel da praça não encontrado: #painelPraca");
    return;
  }

  painel.classList.add("hidden");
  painel.innerHTML = "";
}

window.abrirInventario = abrirInventario;
window.abrirDungeon = abrirDungeon;
window.entrarDungeonGoblin = entrarDungeonGoblin;
window.abrirStatus = abrirStatus;
window.abrirLoja = abrirLoja;
window.abrirMissoes = abrirMissoes;
window.fecharPainelPraca = fecharPainelPraca;
