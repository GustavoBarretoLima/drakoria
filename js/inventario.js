// Obtém a classe do herói do localStorage ou define como "guerreiro" por padrão
let classeHeroi = (
  localStorage.getItem("classeHeroi") || "guerreiro"
).toLowerCase();

function abrirInventario() {
  const inventarioDiv = document.getElementById("inventario");
  const heroiImagem = document.getElementById("heroiImagem");

  // Alterna visibilidade
  if (inventarioDiv.classList.contains("hidden")) {
    inventarioDiv.classList.remove("hidden");
    inventarioDiv.classList.add("show");

    atualizarImagemInventario(classeHeroi);

    setTimeout(() => {
      heroiImagem.classList.add("show");
    }, 100);

    inventario.renderInventario();
  } else {
    inventarioDiv.classList.remove("show");
    inventarioDiv.classList.add("hidden");
    heroiImagem.classList.remove("show");
  }
}

function atualizarImagemInventario(classeHeroi) {
  const heroiImagem = document.getElementById("heroiImagem");

  switch (classeHeroi) {
    case "guerreiro":
      heroiImagem.src = "../img/personagens/guerreiro.png";
      break;
    case "guerreira":
      heroiImagem.src = "../img/personagens/guerreira.png";
      break;
    case "mago":
      heroiImagem.src = "../img/personagens/mago.png";
      break;
    case "maga":
      heroiImagem.src = "../img/personagens/maga.png";
      break;
    case "arqueiro":
      heroiImagem.src = "../img/personagens/arqueiro.png";
      break;
    case "arqueira":
      heroiImagem.src = "../img/personagens/arqueira.png";
      break;
    default:
      heroiImagem.src = "../img/personagens/guerreiro.png";
      break;
  }
}

// Estrutura base do inventário
const inventario = {
  itens: [],

  adicionarItem(item) {
    this.itens.push(item);
    this.renderInventario();
  },

  removerItem(nomeItem) {
    this.itens = this.itens.filter((item) => item.nome !== nomeItem);
    this.renderInventario();
  },

  usarItem(nomeItem) {
    const item = this.itens.find((i) => i.nome === nomeItem);
    if (item) {
      alert(`Você usou ${item.nome}.`);
      if (item.consumivel) {
        this.removerItem(nomeItem);
      }
    } else {
      alert(`${nomeItem} não está no inventário.`);
    }
  },

  renderInventario() {
    const slotsContainer = document.querySelector("#inventario .slots");
    if (!slotsContainer) return;

    slotsContainer.innerHTML = "";
    const totalSlots = 20;

    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement("div");

      if (this.itens[i]) {
        slot.classList.add("ocupado");

        if (this.itens[i].icone) {
          const img = document.createElement("img");
          img.src = this.itens[i].icone;
          img.alt = this.itens[i].nome;
          slot.appendChild(img);
        } else {
          slot.textContent = this.itens[i].nome;
        }

        slot.addEventListener("click", () => this.usarItem(this.itens[i].nome));
      }

      slotsContainer.appendChild(slot);
    }
  },
};
