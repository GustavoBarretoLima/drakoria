import { sendAttack, sendDefend } from "../battle/battleClient.js";

export function setupBattlePage() {
  const btnAtacar = document.getElementById("btnAtacar");
  const btnDefender = document.getElementById("btnDefender");
  const btnFugir = document.getElementById("btnFugir");

  btnAtacar?.addEventListener("click", () => {
    sendAttack();
  });

  btnDefender?.addEventListener("click", () => {
    sendDefend();
  });

  btnFugir?.addEventListener("click", () => {
    console.log("Fuga ainda nao implementada.");
  });
}
