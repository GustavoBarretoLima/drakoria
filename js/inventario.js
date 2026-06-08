function carregarInventarioInicial(classeHeroi) {
  inventario.itens = []; // limpa inventário

  switch (classeHeroi) {
    case "guerreiro":
    case "guerreira":
      inventario.adicionarItem({
        nome: "Poção de Vida",
        consumivel: true,
        icone: "../img/itens/pocao_vida.png",
        descricao: "Recupera HP",
        quantidade: 10,
      });
      inventario.adicionarItem({
        nome: "Poção de Mana",
        consumivel: true,
        icone: "../img/itens/pocao_mana.png",
        descricao: "Recupera MP",
        quantidade: 5,
      });
      inventario.adicionarItem({
        nome: "Espada de Ferro",
        tipo: "arma",
        classePermitida: ["guerreiro", "guerreira"],
        icone: "../img/itens/espada_ferro.png",
        descricao: "Espada básica",
        stats: { ataque: 10, durabilidade: 100 },
      });
      inventario.adicionarItem({
        nome: "Escudo de Madeira",
        tipo: "escudo",
        classePermitida: ["guerreiro", "guerreira"],
        icone: "../img/itens/escudo_madeira.png",
        descricao: "Escudo simples",
        stats: { defesa: 5, durabilidade: 80 },
      });
      break;

    case "mago":
    case "maga":
      inventario.adicionarItem({
        nome: "Poção de Vida",
        consumivel: true,
        icone: "../img/itens/pocao_vida.png",
        descricao: "Recupera HP",
        quantidade: 10,
      });
      inventario.adicionarItem({
        nome: "Poção de Mana",
        consumivel: true,
        icone: "../img/itens/pocao_mana.png",
        descricao: "Recupera MP",
        quantidade: 10,
      });
      inventario.adicionarItem({
        nome: "Cajado de Madeira",
        tipo: "arma",
        classePermitida: ["mago", "maga"],
        icone: "../img/itens/cajado_madeira.png",
        descricao: "Cajado básico",
        stats: { ataque: 8, durabilidade: 60 },
      });
      break;

    case "arqueiro":
    case "arqueira":
      inventario.adicionarItem({
        nome: "Poção de Vida",
        consumivel: true,
        icone: "../img/itens/pocao_vida.png",
        descricao: "Recupera HP",
        quantidade: 10,
      });
      inventario.adicionarItem({
        nome: "Poção de Mana",
        consumivel: true,
        icone: "../img/itens/pocao_mana.png",
        descricao: "Recupera MP",
        quantidade: 5,
      });
      inventario.adicionarItem({
        nome: "Arco de Madeira",
        tipo: "arma",
        classePermitida: ["arqueiro", "arqueira"],
        icone: "../img/itens/arco_madeira.png",
        descricao: "Arco básico",
        stats: { ataque: 10, durabilidade: 80 },
      });
      break;
  }

  inventario.renderInventario();
}

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
  const generoHeroi = (
    localStorage.getItem("generoHeroi") || "masculino"
  ).toLowerCase();

  switch (classeHeroi) {
    case "guerreiro":
      heroiImagem.src =
        generoHeroi === "feminino"
          ? "../img/personagens/guerreira.png"
          : "../img/personagens/guerreiro.png";
      break;
    case "mago":
      heroiImagem.src =
        generoHeroi === "feminino"
          ? "../img/personagens/maga.png"
          : "../img/personagens/mago.png";
      break;
    case "arqueiro":
      heroiImagem.src =
        generoHeroi === "feminino"
          ? "../img/personagens/arqueira.png"
          : "../img/personagens/arqueiro.png";
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
    if (!item) {
      alert(`${nomeItem} não está no inventário.`);
      return;
    }

    if (item.consumivel) {
      alert(`Você usou 1 ${item.nome}.`);

      // 🔹 reduz apenas uma unidade
      item.quantidade -= 1;

      // 🔹 se acabou, remove o item
      if (item.quantidade <= 0) {
        this.removerItem(nomeItem);
      }

      // 🔹 atualiza o inventário visualmente
      this.renderInventario();
    } else {
      alert(`${item.nome} não é consumível.`);
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
          slot.setAttribute("data-descricao", this.itens[i].descricao);

          // contador de quantidade
          if (this.itens[i].quantidade) {
            const qtd = document.createElement("span");
            qtd.classList.add("quantidade");
            qtd.textContent = "x" + this.itens[i].quantidade;
            slot.appendChild(qtd);
          }

          slot.appendChild(img);
        } else {
          slot.textContent = this.itens[i].nome;
        }

        // clique para usar/equipar
        slot.addEventListener("click", () => {
          const item = this.itens[i];
          if (item.consumivel) {
            this.usarItem(item.nome);
          } else {
            const antes =
              equipamentos.slots[
                equipamentos.getSlotTipo(item.tipo.toLowerCase())
              ];
            equipamentos.equiparItem(item);
            const depois =
              equipamentos.slots[
                equipamentos.getSlotTipo(item.tipo.toLowerCase())
              ];

            if (depois === item && antes !== item) {
              this.removerItem(item.nome);
            } else {
              slot.classList.add("bloqueado");
              setTimeout(() => slot.classList.remove("bloqueado"), 3000);
            }
          }
        });
      } else {
        // mostra slot vazio
        slot.classList.add("vazio");
      }

      slotsContainer.appendChild(slot);
    }
  },
};

// Obtém a classe do herói do localStorage ou define como "guerreiro" por padrão
let classeHeroi = (
  localStorage.getItem("classeHeroi") || "guerreiro"
).toLowerCase();
carregarInventarioInicial(classeHeroi);
