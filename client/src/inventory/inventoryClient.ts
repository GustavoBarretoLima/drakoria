import { canEquipItem, canonicalEquipment } from "../../../shared/src/equipment/equipmentRules.js";
import { loadProgress } from "../progression/progressionClient.js";
import type { HeroClass } from "../../../shared/src/types/equipment.js";
import type { EquipmentDrop, EquipmentItem, EquipmentSlot } from "../../../shared/src/types/equipment.js";

import { createAssassinDaggers } from "../../../shared/src/equipment/assassinWeapons.js";
import { createDungeonEquipment } from "../../../shared/src/loot/dungeonLoot.js";
import { SUBCLASS_DEFINITIONS, type SubclassId } from "../../../shared/src/classes/subclasses.js";

function inventorySubclass(): SubclassId | undefined {
  try { const id = JSON.parse(localStorage.getItem("drakoriaSubclassProgress") || "{}").activeSubclass as SubclassId;
    return SUBCLASS_DEFINITIONS[id]?.baseClass === inventoryHeroClass() ? id : undefined;
  } catch { return undefined; }
}
import { createBerserkAxe } from "../../../shared/src/equipment/berserkWeapons.js";
function reconcileBerserk(inventory: InventoryState, grantStarter = false): boolean {
  if (inventorySubclass() !== "berserker") return false;
  let changed = false;
  if (inventory.equipped.shield) { delete inventory.equipped.shield; changed = true; }
  const weapon = inventory.items.find(entry => entry.item.id === inventory.equipped.weapon)?.item;
  if (weapon?.weaponType === "two-handed-axe" || (!weapon && !grantStarter)) return changed;
  if (weapon && !weapon.allowedClasses.includes("guerreiro")) return changed;
  const axe = createBerserkAxe(weapon ?? createDungeonEquipment("guerreiro", "weapon", 1, "common"));
  if (!inventory.items.some(entry => entry.item.id === axe.id)) inventory.items.push({ item: axe, quantity: 1 });
  inventory.equipped.weapon = axe.id;
  return true;
}
export function ensureBerserkEquipment(grantStarter = false): void {
  const inventory = loadInventory();
  if (reconcileBerserk(inventory, grantStarter)) saveInventory(inventory);
}

function reconcileAssassin(inventory: InventoryState, grantStarter = false): boolean {
  if (inventorySubclass() !== "assassin") return false;
  const weapon = inventory.items.find(entry => entry.item.id === inventory.equipped.weapon)?.item;
  if (weapon?.requiredSubclass === "assassin") return false;
  if (!weapon && !grantStarter) return false;
  if (weapon && (weapon.slot !== "weapon" || !weapon.allowedClasses.includes("arqueiro"))) return false;
  const daggers = createAssassinDaggers(weapon ?? createDungeonEquipment("arqueiro", "weapon", 1, "common"));
  if (!inventory.items.some(entry => entry.item.id === daggers.id)) inventory.items.push({ item: daggers, quantity: 1 });
  inventory.equipped.weapon = daggers.id;
  return true;
}
export function ensureAssassinEquipment(grantStarter = false): void {
  const inventory = loadInventory();
  if (reconcileAssassin(inventory, grantStarter)) saveInventory(inventory);
}

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
    const inventory = {
      items: Array.isArray(parsed.items) ? parsed.items.map(entry => ({ ...entry, item: canonicalEquipment(entry.item) })) : [],
      equipped: parsed.equipped ?? {},
    };
    const assassinChanged = reconcileAssassin(inventory);
    const berserkChanged = reconcileBerserk(inventory);
    if (assassinChanged || berserkChanged) saveInventory(inventory);
    return inventory;
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
  if (!entry || !canEquipItem(entry.item, inventoryHeroClass(), loadProgress().nivel, inventorySubclass())) return inventory;

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
    .filter((entry) => equippedIds.has(entry.item.id) && canEquipItem(entry.item, inventoryHeroClass(), loadProgress().nivel, inventorySubclass()))
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

function inventoryHeroClass(): HeroClass {
  const heroClass = (localStorage.getItem("classeHeroi") || "guerreiro").toLowerCase();
  return heroClass === "mago" || heroClass === "arqueiro" ? heroClass : "guerreiro";
}
