const equipamentos = {
  slots: {
    arma: null,
    armadura: null,
    escudo: null,
    perna: null,
    bota: null,
    luva: null,
    brinco: null,
    colar: null,
    anel: null,
  },

  equiparItem(item) {
    if (!item || item.consumivel) {
      alert("Este item não pode ser equipado.");
      return;
    }

    // 🔹 Verifica se personagem existe
    if (!window.personagem || !window.personagem.classe) {
      alert("Nenhum personagem definido. Selecione seu herói primeiro!");
      return;
    }

    // 🔹 Verifica se a classe do personagem pode usar
    const classeHeroi = window.personagem.classe.toLowerCase();
    const permitido = Array.isArray(item.classePermitida)
      ? item.classePermitida.map((c) => c.toLowerCase())
      : [item.classePermitida.toLowerCase()];

    if (!permitido.includes(classeHeroi)) {
      // pega a(s) classe(s) permitida(s) do item
      const classesPermitidas = permitido.join(", ");

      alert(`O item ${item.nome} só pode ser usado por: ${classesPermitidas}.`);
      return;
    }

    // 🔹 Continua com o processo normal de equipar
    const tipoSlot = this.getSlotTipo(item.tipo.toLowerCase());
    if (!tipoSlot) {
      alert(`O item ${item.nome} não pode ser equipado neste slot.`);
      return;
    }

    let antigo = this.slots[tipoSlot] || null;
    if (antigo) inventario.adicionarItem(antigo);

    this.slots[tipoSlot] = item;
    this.renderEquipamento();

    if (antigo) this.showComparisonPanel(antigo, item);
  },
  getSlotTipo(tipo) {
    switch (tipo) {
      case "arma":
        return "arma";
      case "armadura":
        return "armadura";
      case "escudo":
        return "escudo";
      case "perna":
        return "perna";
      case "bota":
        return "bota";
      case "luva":
        return "luva";
      case "brinco":
        return "brinco";
      case "colar":
        return "colar";
      case "anel":
        return "anel";
      default:
        return null;
    }
  },

  removerEquipamento(slot) {
    if (this.slots[slot]) {
      alert(`${this.slots[slot].nome} foi removido do slot ${slot}.`);
      this.slots[slot] = null;
      this.renderEquipamento();
    }
  },

  renderEquipamento() {
    const slots = document.querySelectorAll(".equip-circle .slot");

    slots.forEach((slot) => {
      const tipo = slot.classList[1];
      const item = this.slots[tipo];

      if (item) {
        slot.innerHTML = `
          <div class="equipado-item">
            <img src="${item.icone}" alt="${item.nome}" />
          </div>
        `;
        slot.classList.add("equipado");

        slot.onclick = () => {
          inventario.adicionarItem(item);
          this.slots[tipo] = null;
          this.renderEquipamento();
          this.hideItemPanel();
        };

        slot.onmouseenter = () => this.showItemPanel(item);
        slot.onmouseleave = () => this.hideItemPanel();
      } else {
        slot.innerHTML = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        slot.classList.remove("equipado");
        slot.onclick = null;
        slot.onmouseenter = null;
        slot.onmouseleave = null;
      }
    });
  },

  showItemPanel(item) {
    const panel = document.getElementById("item-panel");
    if (!panel) return;

    panel.innerHTML = `
      <h3>${item.nome}</h3>
      <img src="${item.icone}" alt="${item.nome}" />
      <ul>
        ${Object.entries(item.stats || {})
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")}
      </ul>
    `;
    panel.style.display = "block";
  },

  hideItemPanel() {
    const panel = document.getElementById("item-panel");
    if (panel) panel.style.display = "none";
  },

  showComparisonPanel(antigo, novo) {
    const panel = document.getElementById("item-panel");
    if (!panel) return;

    panel.innerHTML = `
      <h3>Comparação de ${novo.tipo}</h3>
      <div class="comparison">
        <div class="item">
          <h4>Antigo: ${antigo.nome}</h4>
          <img src="${antigo.icone}" alt="${antigo.nome}" />
          <ul>
            ${Object.entries(antigo.stats || {})
              .map(
                ([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`,
              )
              .join("")}
          </ul>
        </div>
        <div class="item">
          <h4>Novo: ${novo.nome}</h4>
          <img src="${novo.icone}" alt="${novo.nome}" />
          <ul>
            ${Object.entries(novo.stats || {})
              .map(([key, value]) => {
                const antigoValor = antigo.stats?.[key] ?? 0;
                const diff = value - antigoValor;
                let classe = diff > 0 ? "melhora" : diff < 0 ? "piora" : "";
                return `<li><strong>${key}:</strong> ${value} <span class="${classe}">${diff > 0 ? "+" + diff : diff}</span></li>`;
              })
              .join("")}
          </ul>
        </div>
      </div>
    `;
    panel.style.display = "block";
  },
};
