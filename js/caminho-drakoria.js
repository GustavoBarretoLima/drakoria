// 🏆 Cena de vitória – Goblin derrotado
function cenaVitoriaGoblin() {
  mensagem("🏆 O Goblin cai ao chão, derrotado. O herói observa em silêncio.");

  document.querySelector("#batalha").innerHTML = `
    <div class="goblin-derrotado">
      <img src="../img/monstros/goblin-dead.png" alt="Goblin derrotado" class="goblin-dead">
      <p class="texto-final">O inimigo jaz no chão, sem forças.<br>O caminho está livre...</p>
    </div>
  `;

  const texto = document.querySelector(".texto-final");
  const conteudo = texto.innerHTML;
  texto.innerHTML = "";
  let i = 0;

  const intervalo = setInterval(() => {
    if (conteudo.substring(i, i + 4) === "<br>") {
      texto.innerHTML += "<br>";
      i += 4;
    } else {
      texto.innerHTML += conteudo.charAt(i);
      i++;
    }
    if (i >= conteudo.length) clearInterval(intervalo);
  }, 25);

  setTimeout(() => {
    anime({
      targets: ".goblin-derrotado",
      opacity: [1, 0],
      duration: 1000,
      easing: "easeOutQuad",
      complete: () => transicaoParaDrakoria(),
    });
  }, 4000);
}

// 🚪 Transição para o portão de Drakoria
function transicaoParaDrakoria() {
  document.querySelector("#batalha").innerHTML = `
    <div class="drakoria-cena">
      <div class="texto-cena">
        <p>Com o Goblin derrotado, o herói segue em direção ao reino de Drakoria.</p>
        <p>O portão colossal se ergue diante dele, guardado por estátuas de dragões e tochas flamejantes.</p>
        <p>Seu destino o aguarda além dessas muralhas...</p>
        <button class="btn-continuar" onclick="iniciarCenaDrakoria()">➡ Continuar</button>
      </div>
    </div>
  `;

  anime({
    targets: ".drakoria-cena",
    opacity: [0, 1],
    duration: 1800,
    easing: "easeOutQuad",
  });
}

// 🌄 Início da próxima cena com guardas
function iniciarCenaDrakoria() {
  const falas = [
    "Guarda 1:<br>Pare aí, viajante! Poucos ousam atravessar este portão sem permissão.",
    "Herói:<br>O caminho estava bloqueado por um Goblin. Ele não é mais ameaça.",
    "Guarda 2:<br>Impressionante... poucos derrotariam aquela criatura sozinhos.",
    "Guarda 1:<br>Se veio em paz, seja bem-vindo a Drakoria.<br>Mas saiba: dentro destas muralhas, desafios maiores o aguardam.",
    "Herói:<br>Estou pronto. Meu destino está além destas muralhas.",
  ];

  document.querySelector("#batalha").innerHTML = `
    <div class="entrada-drakoria"></div>
    <div class="dialogo-guardas"></div>
  `;

  const container = document.querySelector(".dialogo-guardas");

  let idx = 0;
  function mostrarFala() {
    if (idx >= falas.length) {
      container.innerHTML += `<button class="btn-continuar" onclick="entrarDrakoria()">➡ Entrar no Reino</button>`;
      return;
    }

    const fala = document.createElement("p");
    fala.classList.add("fala");
    container.appendChild(fala);

    const conteudo = falas[idx];
    let i = 0;
    const intervalo = setInterval(() => {
      if (conteudo.substring(i, i + 4) === "<br>") {
        fala.innerHTML += "<br>";
        i += 4;
      } else {
        fala.innerHTML += conteudo.charAt(i);
        i++;
      }
      if (i >= conteudo.length) {
        clearInterval(intervalo);
        idx++;
        setTimeout(mostrarFala, 1200); // espera antes da próxima fala
      }
    }, 25);
  }

  mostrarFala();
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

  // efeito typewriter automático
  const falasCidade = document.querySelectorAll(".drakoria-cidade p");
  falasCidade.forEach((fala, idx) => {
    const conteudo = fala.innerHTML;
    fala.innerHTML = "";
    let i = 0;
    setTimeout(() => {
      const intervalo = setInterval(() => {
        if (conteudo.substring(i, i + 4) === "<br>") {
          fala.innerHTML += "<br>";
          i += 4;
        } else {
          fala.innerHTML += conteudo.charAt(i);
          i++;
        }
        if (i >= conteudo.length) clearInterval(intervalo);
      }, 25);
    }, idx * 1500);
  });

  // fade-out e redirecionamento para praca.html
  setTimeout(() => {
    anime({
      targets: ".drakoria-cidade",
      opacity: [1, 0],
      duration: 1500,
      easing: "easeOutQuad",
      complete: () => {
        window.location.href = "praca.html"; // 🔹 redireciona para a praça
      },
    });
  }, 6000);
}

function cenaPrincipalDrakoria() {
  document.querySelector("#praca").innerHTML = `
    <div class="drakoria-praca">
      <div class="hotspot taberna" 
           onclick="window.location.href='estabelecimentos.html#taberna'" 
           data-tooltip="🍺 Entrar na Taberna"></div>
      <div class="hotspot ferreiro" 
           onclick="window.location.href='estabelecimentos.html#ferreiro'" 
           data-tooltip="⚒️ Ir ao Ferreiro"></div>
      <div class="hotspot guilda" 
           onclick="window.location.href='estabelecimentos.html#guilda'" 
           data-tooltip="🛡️ Guilda dos Aventureiros"></div>
    </div>
  `;
}
