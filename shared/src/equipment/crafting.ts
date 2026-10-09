import { BLACKSMITH_ITEMS } from "./artEquipmentCatalog.js";
import { EQUIPMENT_RARITY_META } from "../types/equipmentRarity.js";
import type { EquipmentItem,EquipmentStats,EquipmentRarity } from "../types/equipment.js";
export const FORGE_TIERS=[
 {rarity:"rare",level:10,fragments:10,gold:60,inputs:["common","uncommon"]},
 {rarity:"epic",level:25,fragments:30,gold:250,inputs:["rare"]},
 {rarity:"legendary",level:40,fragments:80,gold:700,inputs:["epic"]},
 {rarity:"mythic",level:55,fragments:180,gold:1800,inputs:["legendary"]},
] as const;
export interface ForgeRecipe { item:EquipmentItem; fragments:number; gold:number; inputs:readonly EquipmentRarity[]; }
export const FORGE_RECIPES:ForgeRecipe[]=FORGE_TIERS.flatMap(tier=>BLACKSMITH_ITEMS.map(base=>{
 const scale=(1+(tier.level-1)*.08)/(1+(base.level-1)*.08)*EQUIPMENT_RARITY_META[tier.rarity].powerMultiplier/EQUIPMENT_RARITY_META[base.rarity].powerMultiplier;
 const stats:EquipmentStats={};
 for(const [key,value] of Object.entries(base.stats))stats[key as keyof EquipmentStats]=Math.max(1,Math.round(value*scale));
 const bonus=base.allowedClasses.includes("mago")?"magicPower":"attack";
 if(tier.rarity==="mythic")stats[bonus]=(stats[bonus]??0)+5;
 const label=EQUIPMENT_RARITY_META[tier.rarity].label;
 return {fragments:tier.fragments,gold:tier.gold,inputs:tier.inputs,item:{...base,id:`forge-${base.allowedClasses[0]}-${base.slot}-${tier.rarity}-lvl-${tier.level}`,name:`${base.name} · ${label} Nv.${tier.level}`,rarity:tier.rarity,level:tier.level,stats,allowedClasses:[...base.allowedClasses],description:`Forjado com uma peça inferior, fragmentos e ouro. Requer nível ${tier.level}.${tier.rarity==="mythic"?` Bônus mítico: +5 ${bonus==="magicPower"?"poder mágico":"força"}, já incluído nos atributos.`:""}`,sellPrice:Math.max(1,Math.floor(base.sellPrice*scale))}};
}));
export function salvageYield(item:EquipmentItem):number {
 const base={common:2,uncommon:3,rare:6,epic:12,legendary:24,mythic:48}[item.rarity];
 return base+Math.floor(Math.min(100,Math.max(1,item.level))/10);
}
export function fitsForgeRecipe(item:EquipmentItem,recipe:ForgeRecipe):boolean {
 return item.slot===recipe.item.slot&&recipe.inputs.includes(item.rarity)&&item.level<=recipe.item.level&&item.allowedClasses.some(cls=>recipe.item.allowedClasses.includes(cls)||cls==="universal");
}
