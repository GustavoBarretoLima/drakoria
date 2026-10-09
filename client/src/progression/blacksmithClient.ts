import { FORGE_RECIPES,fitsForgeRecipe,salvageYield,type ForgeRecipe } from "../../../shared/src/equipment/crafting.js";
import { canonicalEquipment } from "../../../shared/src/equipment/equipmentRules.js";
import { adaptSubclassWeaponDrops } from "../../../shared/src/equipment/assassinWeapons.js";
import { loadInventory,saveInventory,type InventoryState } from "../inventory/inventoryClient.js";
import { loadProgress,saveProgress } from "./progressionClient.js";
import { getActiveSubclass } from "./subclassClient.js";
import type { EquipmentItem } from "../../../shared/src/types/equipment.js";
const KEY="drakoriaForgeMaterials";
function heroClass(){const raw=(localStorage.getItem("classeHeroi")??"guerreiro").toLowerCase();return raw==="mago"||raw==="arqueiro"?raw:"guerreiro";}

export function loadForgeFragments():number {
 try {const raw=JSON.parse(localStorage.getItem(KEY)??"0");return typeof raw==="number"&&Number.isSafeInteger(raw)?Math.max(0,raw):0;}catch{return 0;}
}
export function spareQuantity(inventory:InventoryState,id:string):number {
 const entry=inventory.items.find(entry=>entry.item.id===id);
 return entry&&Number.isSafeInteger(entry.quantity)?Math.max(0,entry.quantity-(inventory.equipped[entry.item.slot]===id?1:0)):0;
}
export function forgeResult(recipe:ForgeRecipe):EquipmentItem {
 const cls=heroClass();
 return adaptSubclassWeaponDrops([{item:recipe.item,quantity:1}],getActiveSubclass(cls))[0]!.item;
}
export function forgeBlockReason(recipe:ForgeRecipe,baseId:string):string|null {
 const inventory=loadInventory(),progress=loadProgress();
 if(!Number.isFinite(progress.nivel)||progress.nivel<recipe.item.level)return `Requer nível ${recipe.item.level}.`;
 const cls=heroClass();
 if(!recipe.item.allowedClasses.includes(cls))return "Receita de outra classe.";
 if(recipe.item.slot==="shield"&&getActiveSubclass(cls)==="berserker")return "Berserk usa arma de duas mãos, sem escudo.";
 const base=inventory.items.find(entry=>entry.item.id===baseId);
 if(!base||spareQuantity(inventory,baseId)<1||!fitsForgeRecipe(base.item,recipe))return "Escolha uma peça inferior compatível na mochila.";
 if(loadForgeFragments()<recipe.fragments)return "Fragmentos de forja insuficientes.";
 if(!Number.isFinite(progress.ouro)||progress.ouro<recipe.gold)return "Ouro insuficiente.";
 return null;
}
export function craftEquipment(recipeId:string,baseId:string):string|null {
 const recipe=FORGE_RECIPES.find(recipe=>recipe.item.id===recipeId);if(!recipe)return "Receita desconhecida.";
 const reason=forgeBlockReason(recipe,baseId);if(reason)return reason;
 const inventory=loadInventory(),progress=loadProgress(),result=forgeResult(recipe);
 const base=inventory.items.find(entry=>entry.item.id===baseId)!;base.quantity--;
 inventory.items=inventory.items.filter(entry=>entry.quantity>0);
 const existing=inventory.items.find(entry=>entry.item.id===result.id);
 const occupied=inventory.items.filter(entry=>spareQuantity(inventory,entry.item.id)>0).length;
 if(occupied>=20&&(!existing||spareQuantity(inventory,result.id)===0))return "Mochila cheia. Libere espaço antes de forjar.";
 if(existing)existing.quantity++;else inventory.items.push({item:result,quantity:1});
 progress.ouro-=recipe.gold;
 saveInventory(inventory);saveProgress(progress);localStorage.setItem(KEY,JSON.stringify(loadForgeFragments()-recipe.fragments));return null;
}
export function dismantleEquipment(id:string):string|null {
 const inventory=loadInventory();const entry=inventory.items.find(entry=>entry.item.id===id);
 if(!entry||spareQuantity(inventory,id)<1)return "A peça equipada está protegida. Escolha uma cópia da mochila.";
 const item=canonicalEquipment(entry.item),fragments=salvageYield(item);
 if(!Number.isSafeInteger(fragments)||!Number.isFinite(entry.quantity))return "Equipamento inválido.";
 entry.quantity--;inventory.items=inventory.items.filter(entry=>entry.quantity>0);
 saveInventory(inventory);localStorage.setItem(KEY,JSON.stringify(Math.min(Number.MAX_SAFE_INTEGER,loadForgeFragments()+fragments)));return null;
}
