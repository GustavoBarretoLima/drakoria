import { BLACKSMITH_ITEMS } from "../../../shared/src/equipment/artEquipmentCatalog.js";
import { equipmentArt } from "../ui/equipmentArt.js";
import { blacksmithPrice, buyBlacksmithItem } from "../progression/blacksmithClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { adaptSubclassWeaponDrops } from "../../../shared/src/equipment/assassinWeapons.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import type { HeroClass } from "../../../shared/src/types/equipment.js";

const labels: Record<string, string> = { attack:"Força / ataque", defense:"Defesa", hp:"HP", mana:"Mana", magicPower:"Poder mágico", magicDefense:"Defesa mágica", speed:"Velocidade", criticalChance:"Crítico %", criticalDamage:"Dano crítico %", dodgeChance:"Esquiva %" };
let selected: HeroClass = "guerreiro";
function openBlacksmith(message = ""): void {
  const panel = document.getElementById("ferreiro");
  if (!panel) return;
  panel.style.display = "block";
  const gold = loadProgress().ouro;
  const raw = localStorage.getItem("classeHeroi"), cls = raw === "mago" || raw === "arqueiro" ? raw : "guerreiro";
  panel.innerHTML = `<section class="blacksmith-shop"><header><h2>Oficina do Ferreiro</h2><strong>${gold} ouro</strong></header>
    <p>Conjuntos raros de nível 20. A compra vai para a mochila; classe, subclasse e nível exigidos são conferidos ao equipar.</p>
    <nav aria-label="Conjuntos">${(["guerreiro","mago","arqueiro"] as const).map(id=>`<button data-class="${id}" aria-pressed="${id===selected}">${id === "guerreiro" ? "Leão Rubro · Guerreiro" : id === "mago" ? "Constelação Arcana · Mago" : "Falcão Verde · Arqueiro"}</button>`).join("")}</nav>
    <p role="status" aria-live="polite"></p><div class="blacksmith-grid">${BLACKSMITH_ITEMS.filter(item=>item.allowedClasses.includes(selected)).map(base=>{
      const item = adaptSubclassWeaponDrops([{item:base,quantity:1}],getActiveSubclass(cls))[0]!.item;
      const price = blacksmithPrice(base.sellPrice);
      return `<article class="blacksmith-card rarity-${item.rarity}">${equipmentArt(item)}<h3>${item.name}</h3><p>Raro · Nv.${item.level}${item.requiredSubclass ? ` · ${item.requiredSubclass === "berserker" ? "Berserk · duas mãos" : "Assassino"}` : ""}</p>
        <p>${Object.entries(item.stats).map(([key,value])=>`${labels[key] ?? key} +${value}`).join(" · ")}</p><button data-buy="${base.id}" ${gold<price?"disabled":""}>Comprar · ${price} ouro</button></article>`;
    }).join("")}</div><a class="blacksmith-back" href="praca.html">Voltar à praça</a></section>`;
  panel.querySelector('[role="status"]')!.textContent = message;
  panel.querySelectorAll<HTMLButtonElement>("[data-class]").forEach(button=>button.addEventListener("click",()=>{selected=button.dataset.class as HeroClass;openBlacksmith();}));
  panel.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach(button=>button.addEventListener("click",()=>openBlacksmith(buyBlacksmithItem(button.dataset.buy!) ?? "Equipamento adicionado à mochila.")));
}

declare global { interface Window { carregarFerreiro: () => void; } }
window.addEventListener("DOMContentLoaded",()=>{
  window.carregarFerreiro=()=>openBlacksmith();
  if(window.location.hash==="#ferreiro")openBlacksmith();
});
