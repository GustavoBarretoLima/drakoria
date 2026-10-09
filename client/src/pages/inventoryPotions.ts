import { loadConsumables } from "../battle/heroVitals.js";
import { POTIONS, type PotionId, type PotionInventory } from "../../../shared/src/items/potions.js";
import { POTION_ICONS } from "../ui/potionIcons.js";

declare global {
  interface Window { criarPocoesInventario?: () => string; }
}

export function potionInventoryHtml(inventory: PotionInventory): string {
  const owned = (Object.keys(POTIONS) as PotionId[]).filter(id => (inventory[id] ?? 0) > 0);
  return `<section class="inventory-potions" aria-label="Poções da mochila">
    <h3 class="section-title">Poções e consumíveis</h3>
    <p class="inventory-help">Consumíveis ficam separados dos 20 espaços de equipamentos. Use no menu Itens da batalha; curas também podem ser usadas na loja.</p>
    ${owned.length ? `<div class="inventory-potion-list">${owned.map(id => `<article class="inventory-potion-row">
      <img src="${POTION_ICONS[id]}" alt="" width="56" height="56" />
      <div><strong>${POTIONS[id].name}</strong><p>${POTIONS[id].detail}</p></div>
      <span aria-label="Quantidade: ${inventory[id]}">×${inventory[id]}</span>
    </article>`).join("")}</div>` : '<p class="inventory-help">Nenhuma poção na mochila. Compre na loja da praça.</p>'}
  </section>`;
}

if (typeof window !== "undefined") {
  window.criarPocoesInventario = () => potionInventoryHtml(loadConsumables());
}
