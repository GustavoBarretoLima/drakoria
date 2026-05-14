// 🏆 Cena de vitória – Goblin derrotado
function cenaVitoriaGoblin() {
  mensagem("🏆 O Goblin cai ao chão, derrotado. O herói observa em silêncio.");

  // Mostra o goblin derrotado dentro da seção #batalha
  document.querySelector("#batalha").innerHTML = `
    <div class="goblin-derrotado">
      <img src="../img/monstros/goblin-dead.png" alt="Goblin derrotado" class="goblin-dead">
      <p>O inimigo jaz no chão, sem forças. O caminho está livre...</p>
    </div>
  `;

  // Fade-out da imagem após alguns segundos
  setTimeout(() => {
    anime({
      targets: ".goblin-derrotado",
      opacity: [1, 0],
      duration: 1200,
      easing: "easeOutQuad",
      complete: () => transicaoParaDrakoria(),
    });
  }, 2000);
}

// 🚪 Transição para o portão de Drakoria
function transicaoParaDrakoria() {
  document.querySelector("#batalha").innerHTML = `
    <div class="drakoria-cena" style="opacity:0">
      <img src="../img/stages/portao-drakoria.png" class="portao-img" alt="Portão colossal de Drakoria guardado por dragões">
      <div class="texto-cena">
        <p>Com o Goblin derrotado, o herói segue em direção ao reino de Drakoria.</p>
        <p>O portão colossal se ergue diante dele, guardado por estátuas de dragões e tochas flamejantes.</p>
        <p>Seu destino o aguarda além dessas muralhas...</p>
      </div>
      <button class="btn-continuar" onclick="iniciarCenaDrakoria()">➡ Continuar</button>
    </div>
  `;

  anime({
    targets: ".drakoria-cena",
    opacity: [0, 1],
    duration: 1500,
    easing: "easeOutQuad",
  });
}

// 🌄 Início da próxima cena com guardas
function iniciarCenaDrakoria() {
  document.querySelector("#batalha").innerHTML = `
    <div class="entrada-drakoria">
      <img src="../img/stages/portao-drakoria.png" class="portao-img" alt="Portão colossal de Drakoria guardado por dragões">
      <div class="dialogo">
        <p><strong>Guarda 1:</strong> Pare aí, viajante! Poucos ousam atravessar este portão sem permissão.</p>
        <p><strong>Herói:</strong> O caminho estava bloqueado por um Goblin. Ele não é mais ameaça.</p>
        <p><strong>Guarda 2:</strong> Impressionante… poucos derrotariam aquela criatura sozinhos.</p>
        <p><strong>Guarda 1:</strong> Se veio em paz, seja bem-vindo a Drakoria. Mas saiba: dentro destas muralhas, desafios maiores o aguardam.</p>
        <p><strong>Herói:</strong> Estou pronto. Meu destino está além destas muralhas.</p>
      </div>
      <button class="btn-continuar" onclick="entrarDrakoria()">➡ Entrar no Reino</button>
    </div>
  `;
}

// 🌆 Cena dentro de Drakoria
function entrarDrakoria() {
  document.querySelector("#batalha").innerHTML = `
    <div class="drakoria-cidade">
      <p>🌄 O portão se abre lentamente e o herói entra em Drakoria.</p>
      <p>Guardas se afastam, e o povo observa curioso enquanto tambores ecoam pelas ruas.</p>
      <p>Seu destino começa aqui, no coração do reino dos dragões...</p>
    </div>
  `;
}
