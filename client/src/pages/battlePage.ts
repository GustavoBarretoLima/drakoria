import { sendAttack, sendDefend, sendMagic } from "../battle/battleClient.js";

export function setupBattlePage() {
  const btnAtacar = document.getElementById("btnAtacar");
  const btnDefender = document.getElementById("btnDefender");
  const btnMagia = document.getElementById("btnMagia");
  const btnFugir = document.getElementById("btnFugir");

  btnAtacar?.addEventListener("click", () => {
    sendAttack();
  });

  btnDefender?.addEventListener("click", () => {
    sendDefend();
  });

  btnMagia?.addEventListener("click", () => {
    sendMagic();
  });

  btnFugir?.addEventListener("click", () => {
    console.log("Fuga ainda nao implementada.");
  });
}
