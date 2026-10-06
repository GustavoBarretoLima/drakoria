import type { EquipmentDrop, EquipmentItem, EquipmentSlot } from "../../../shared/src/types/equipment.js";

const INVENTORY_KEY = "drakoriaInventario";

export interface InventoryEntry {
  item: EquipmentItem;
  quantity: number;
}

export interface InventoryState {
  items: InventoryEntry[];
  equipped: Partial<Record<EquipmentSlot, string>>;
}

const EMPTY_INVENTORY: InventoryState = {
  items: [],
  equipped: {},
};

export function loadInventory(): InventoryState {
  const saved = localStorage.getItem(INVENTORY_KEY);
  if (!saved) return cloneInventory(EMPTY_INVENTORY);

  try {
    const parsed = JSON.parse(saved) as Partial<InventoryState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      equipped: parsed.equipped ?? {},
    };
  } catch {
    return cloneInventory(EMPTY_INVENTORY);
  }
}

export function saveInventory(inventory: InventoryState): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

export function addDropsToInventory(drops: EquipmentDrop[] = []): InventoryState {
  const inventory = loadInventory();

  for (const drop of drops) {
    const quantity = Math.max(1, Math.floor(drop.quantity || 1));
    const existing = inventory.items.find((entry) => entry.item.id === drop.item.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.items.push({
        item: { ...drop.item, stats: { ...drop.item.stats } },
        quantity,
      });
    }
  }

  saveInventory(inventory);
  return inventory;
}

export function equipItem(itemId: string): InventoryState {
  const inventory = loadInventory();
  const entry = inventory.items.find((candidate) => candidate.item.id === itemId);
  if (!entry) return inventory;

  inventory.equipped[entry.item.slot] = itemId;
  saveInventory(inventory);
  return inventory;
}

export function unequipSlot(slot: EquipmentSlot): InventoryState {
  const inventory = loadInventory();
  delete inventory.equipped[slot];
  saveInventory(inventory);
  return inventory;
}

export function getEquippedItems(): EquipmentItem[] {
  const inventory = loadInventory();
  const equippedIds = new Set(Object.values(inventory.equipped));
  return inventory.items
    .filter((entry) => equippedIds.has(entry.item.id))
    .map((entry) => entry.item);
}

function cloneInventory(inventory: InventoryState): InventoryState {
  return {
    items: inventory.items.map((entry) => ({
      item: { ...entry.item, stats: { ...entry.item.stats } },
      quantity: entry.quantity,
    })),
    equipped: { ...inventory.equipped },
  };
}
