import { FORGE_RECIPES } from "../equipment/crafting.js";
import { BLACKSMITH_ITEMS, MONSTER_DROP_SOURCES, MONSTER_EQUIPMENT_BASES } from "../equipment/artEquipmentCatalog.js";
import { EQUIPMENT_RARITY_META } from "../types/equipmentRarity.js";
import type { EquipmentDrop, EquipmentItem, EquipmentRarity, EquipmentStats } from "../types/equipment.js";

export const NAMED_RARITIES = ["common", "rare", "epic", "legendary", "mythic"] as const;
export const NAMED_RARITY_WEIGHTS = {
  normal: [70, 22, 6, 1.8, 0.2],
  elite: [35, 45, 17, 2.5, 0.5],
  boss: [15, 45, 30, 9, 1],
};

export function createNamedEquipment(base: EquipmentItem, level: number, rarity: EquipmentRarity): EquipmentItem {
  const scale = (1 + (level - 1) * 0.08) / (1 + (base.level - 1) * 0.08)
    * EQUIPMENT_RARITY_META[rarity].powerMultiplier / EQUIPMENT_RARITY_META[base.rarity].powerMultiplier;
  const stats: EquipmentStats = {};
  for (const [key, value] of Object.entries(base.stats)) stats[key as keyof EquipmentStats] = Math.max(1, Math.round(value * scale));
  const bonus = base.allowedClasses.includes("mago") ? "magicPower" : base.allowedClasses.includes("universal") ? "defense" : "attack";
  const label = bonus === "magicPower" ? "poder mágico" : bonus === "defense" ? "defesa física" : "força (ataque físico)";
  if (rarity === "mythic") stats[bonus] = (stats[bonus] ?? 0) + 5;
  return { ...base, id: `${base.id}-${rarity}-lvl-${level}`, name: `${base.name} · ${EQUIPMENT_RARITY_META[rarity].label} Nv.${level}`,
    level, rarity, stats, allowedClasses: [...base.allowedClasses],
    description: `${base.description} Requer nível ${level}.${rarity === "mythic" ? ` Bônus mítico: +5 ${label}, já incluído nos atributos.` : ""}`,
    sellPrice: Math.max(1, Math.floor(base.sellPrice * scale)) };
}

export const ART_EQUIPMENT_ITEMS: Record<string, EquipmentItem> = Object.fromEntries([
  ...BLACKSMITH_ITEMS.map(item => [item.id, item] as const),
  ...FORGE_RECIPES.map(recipe => [recipe.item.id, recipe.item] as const),
  ...MONSTER_EQUIPMENT_BASES.flatMap(base => Array.from({ length: 55 }, (_, i) => i + 1)
    .flatMap(level => NAMED_RARITIES.map(rarity => { const item = createNamedEquipment(base, level, rarity); return [item.id, item] as const; }))),
]);

// Each thematic entry rolls independently; generic equipment and books keep their own rolls.
export function rollNamedMonsterDrops(monsterId: string): EquipmentDrop[] {
  const match = /^(.+)-lvl-(\d+)$/.exec(monsterId);
  if (!match) return [];
  const level = Number(match[2]);
  if (level < 1 || level > 55) return [];
  const rank = match[1]!.endsWith("boss") ? "boss" : match[1]!.endsWith("elite") ? "elite" : "normal";
  const drops: EquipmentDrop[] = [];
  for (const source of MONSTER_DROP_SOURCES.filter(source => source.monsterBaseId === match[1])) {
    if (Math.random() >= source.chancePerKill) continue;
    let roll = Math.random() * 100;
    let rarity: typeof NAMED_RARITIES[number] = "mythic";
    for (let i = 0; i < NAMED_RARITIES.length; i++) {
      roll -= NAMED_RARITY_WEIGHTS[rank][i]!;
      if (roll < 0) { rarity = NAMED_RARITIES[i]!; break; }
    }
    const item = ART_EQUIPMENT_ITEMS[`${source.itemId}-${rarity}-lvl-${level}`]!;
    drops.push({ item: { ...item, stats: { ...item.stats }, allowedClasses: [...item.allowedClasses] }, quantity: 1 });
  }
  return drops;
}
