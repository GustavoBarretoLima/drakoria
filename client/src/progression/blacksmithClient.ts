import { BLACKSMITH_ITEMS } from "../../../shared/src/equipment/artEquipmentCatalog.js";
import { adaptSubclassWeaponDrops } from "../../../shared/src/equipment/assassinWeapons.js";
import { loadInventory, addDropsToInventory } from "../inventory/inventoryClient.js";
import { loadProgress, saveProgress } from "./progressionClient.js";
import { getActiveSubclass } from "./subclassClient.js";

export const blacksmithPrice = (sellPrice: number): number => sellPrice * 4;
export function buyBlacksmithItem(id: string): string | null {
  const base = BLACKSMITH_ITEMS.find(item => item.id === id);
  if (!base) return "Equipamento desconhecido.";
  const progress = loadProgress(), price = blacksmithPrice(base.sellPrice);
  if (!Number.isFinite(progress.ouro) || progress.ouro < price) return "Ouro insuficiente.";
  const raw = localStorage.getItem("classeHeroi"), cls = raw === "mago" || raw === "arqueiro" ? raw : "guerreiro";
  const drops = adaptSubclassWeaponDrops([{ item: base, quantity: 1 }], getActiveSubclass(cls));
  const inventory = loadInventory();
  const spare = inventory.items.filter(entry => entry.quantity > (inventory.equipped[entry.item.slot] === entry.item.id ? 1 : 0));
  if (spare.length >= 20 && !spare.some(entry => entry.item.id === drops[0]!.item.id)) return "Mochila cheia. Libere um espaço de equipamento.";
  progress.ouro -= price;
  saveProgress(progress);
  addDropsToInventory(drops);
  return null;
}
