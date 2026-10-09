import { openQuestBoard } from "./townBoard.js";

declare global { interface Window { carregarGuilda: () => void; } }

function openGuild(): void {
  const guild = document.getElementById("guilda");
  if (!guild) return;
  guild.style.display = "block";
  guild.innerHTML = `<section class="guilda-interior">
    <header class="guild-welcome"><h1>Guilda dos Aventureiros</h1>
      <p>Entre, aventureiro. Consulte os contratos e entregue suas conquistas à guilda.</p></header>
    <section id="painelGuilda" aria-label="Missões da Guilda"></section>
  </section>`;
  window.fecharPainelPraca = () => { window.location.href = `${import.meta.env.BASE_URL}pages/praca.html`; };
  openQuestBoard();
}

window.addEventListener("DOMContentLoaded", () => {
  window.carregarGuilda = openGuild;
  if (window.location.hash === "#guilda") openGuild();
});
