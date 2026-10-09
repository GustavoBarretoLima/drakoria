import type { PotionId } from "../../../shared/src/items/potions.js";

// Static URLs let Vite publish every icon with the GitHub Pages base path.
export const POTION_ICONS: Record<PotionId, string> = {
  healthPotion: new URL("../../../img/itens/pocoes/icones_128/hp.png", import.meta.url).href,
  greaterHealthPotion: new URL("../../../img/itens/pocoes/icones_128/hp_media.png", import.meta.url).href,
  superiorHealthPotion: new URL("../../../img/itens/pocoes/icones_128/hp_grande.png", import.meta.url).href,
  manaPotion: new URL("../../../img/itens/pocoes/icones_128/mana.png", import.meta.url).href,
  greaterManaPotion: new URL("../../../img/itens/pocoes/icones_128/mana_media.png", import.meta.url).href,
  superiorManaPotion: new URL("../../../img/itens/pocoes/icones_128/mana_grande.png", import.meta.url).href,
  restorativePotion: new URL("../../../img/itens/pocoes/icones_128/restauradora.png", import.meta.url).href,
  greaterRestorativePotion: new URL("../../../img/itens/pocoes/icones_128/restauradora_superior.png", import.meta.url).href,
  elixir: new URL("../../../img/itens/pocoes/icones_128/elixir.png", import.meta.url).href,
  antidote: new URL("../../../img/itens/pocoes/icones_128/antidoto.png", import.meta.url).href,
  bandage: new URL("../../../img/itens/pocoes/icones_128/hemostatica.png", import.meta.url).href,
  purifyingPotion: new URL("../../../img/itens/pocoes/icones_128/purificadora.png", import.meta.url).href,
  strengthPotion: new URL("../../../img/itens/pocoes/icones_128/forca.png", import.meta.url).href,
  defensePotion: new URL("../../../img/itens/pocoes/icones_128/defesa.png", import.meta.url).href,
  magicPotion: new URL("../../../img/itens/pocoes/icones_128/arcana.png", import.meta.url).href,
  speedPotion: new URL("../../../img/itens/pocoes/icones_128/agilidade.png", import.meta.url).href,
};
