import assert from "node:assert/strict";
import { FORGE_RECIPES,FORGE_TIERS,salvageYield,fitsForgeRecipe } from "../shared/src/equipment/crafting.js";
import { craftEquipment,dismantleEquipment,loadForgeFragments,forgeResult } from "../client/src/progression/blacksmithClient.js";
import { loadInventory,saveInventory } from "../client/src/inventory/inventoryClient.js";
import { createDungeonEquipment } from "../shared/src/loot/dungeonLoot.js";
import { canonicalEquipment,canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { getEquipmentById } from "../server/src/modules/equipment/equipmentService.js";
import { BLACKSMITH_ITEMS } from "../shared/src/equipment/artEquipmentCatalog.js";
const data=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value)}});
function reset(cls="guerreiro",level=55){data.clear();data.set("classeHeroi",cls);data.set("drakoriaProgresso",JSON.stringify({nivel:level,ouro:10000,xp:17}));data.set("drakoriaForgeMaterials","10000");}
assert.equal(FORGE_RECIPES.length,108);
for(const cls of ["guerreiro","mago","arqueiro"] as const){
 reset(cls);let base=createDungeonEquipment(cls,"weapon",1,"common");
 for(const tier of FORGE_TIERS){
  const recipe=FORGE_RECIPES.find(recipe=>recipe.item.slot==="weapon"&&recipe.item.allowedClasses.includes(cls)&&recipe.item.rarity===tier.rarity)!;
  assert.ok(fitsForgeRecipe(base,recipe));saveInventory({items:[{item:base,quantity:1}],equipped:{}});
  const gold=JSON.parse(data.get("drakoriaProgresso")!).ouro,fragments=loadForgeFragments();
  assert.equal(craftEquipment(recipe.item.id,base.id),null);
  const result=loadInventory().items[0]!;assert.equal(result.quantity,1);assert.equal(result.item.rarity,tier.rarity);
  assert.equal(JSON.parse(data.get("drakoriaProgresso")!).ouro,gold-tier.gold);assert.equal(loadForgeFragments(),fragments-tier.fragments);
  assert.equal(JSON.parse(data.get("drakoriaProgresso")!).xp,17);
  assert.deepEqual(getEquipmentById(result.item.id)?.stats,result.item.stats);
  assert.deepEqual(canonicalEquipment({...result.item,stats:{attack:999999}}).stats,result.item.stats);
  assert.ok(canEquipItem(result.item,cls,55));
  const attr=cls==="mago"?"magicPower":"attack";assert.ok(result.item.stats[attr]!>base.stats[attr]!);
  const snapshot=JSON.stringify([...data]);assert.ok(craftEquipment(recipe.item.id,base.id));assert.equal(JSON.stringify([...data]),snapshot);
  base=result.item;
 }
}
reset();const recipe=FORGE_RECIPES[0]!,base=createDungeonEquipment("guerreiro","weapon",1,"common");
saveInventory({items:[{item:base,quantity:1}],equipped:{weapon:base.id}});
let snapshot=JSON.stringify([...data]);assert.ok(craftEquipment(recipe.item.id,base.id));assert.ok(dismantleEquipment(base.id));assert.equal(JSON.stringify([...data]),snapshot);
saveInventory({items:[{item:base,quantity:2}],equipped:{weapon:base.id}});
const fragments=loadForgeFragments();assert.equal(dismantleEquipment(base.id),null);assert.equal(loadInventory().items[0]!.quantity,1);assert.equal(loadInventory().equipped.weapon,base.id);assert.equal(loadForgeFragments(),fragments+salvageYield(base));
for(const [key,value] of [["drakoriaForgeMaterials","0"],["drakoriaProgresso",'{"nivel":1,"ouro":10000}'],["drakoriaProgresso",'{"nivel":55,"ouro":0}']] as const){
 reset();saveInventory({items:[{item:base,quantity:1}],equipped:{}});data.set(key,value);snapshot=JSON.stringify([...data]);assert.ok(craftEquipment(recipe.item.id,base.id));assert.equal(JSON.stringify([...data]),snapshot);
}
reset();saveInventory({items:[{item:base,quantity:1}],equipped:{}});snapshot=JSON.stringify([...data]);assert.ok(craftEquipment("fake",base.id));assert.equal(JSON.stringify([...data]),snapshot);
const extras=Array.from({length:19},(_,i)=>({item:createDungeonEquipment("guerreiro","ring",i+1,"common"),quantity:1}));
saveInventory({items:[...extras,{item:base,quantity:2}],equipped:{}});snapshot=JSON.stringify([...data]);assert.ok(craftEquipment(recipe.item.id,base.id)?.includes("cheia"));assert.equal(JSON.stringify([...data]),snapshot);
saveInventory({items:[...extras,{item:base,quantity:1}],equipped:{}});assert.equal(craftEquipment(recipe.item.id,base.id),null);assert.equal(loadInventory().items.length,20);
// An equipped result is not an existing backpack stack when all 20 slots are occupied.
reset();saveInventory({items:[...extras,{item:base,quantity:2},{item:recipe.item,quantity:1}],equipped:{weapon:recipe.item.id}});
snapshot=JSON.stringify([...data]);assert.ok(craftEquipment(recipe.item.id,base.id)?.includes("cheia"));assert.equal(JSON.stringify([...data]),snapshot);
for(const entry of FORGE_RECIPES){assert.deepEqual(getEquipmentById(entry.item.id)?.stats,entry.item.stats);assert.deepEqual(canonicalEquipment({...entry.item,stats:{defense:999999}}).stats,entry.item.stats);}
for(const [cls,subclass] of [["guerreiro","berserker"],["arqueiro","assassin"]] as const){
 reset(cls);data.set("drakoriaSubclassProgress",JSON.stringify({activeSubclass:subclass,books:{}}));
 const recipe=FORGE_RECIPES.find(recipe=>recipe.item.slot==="weapon"&&recipe.item.allowedClasses.includes(cls))!;
 const item=forgeResult(recipe);assert.ok(canEquipItem(item,cls,55,subclass));assert.deepEqual(getEquipmentById(item.id)?.stats,item.stats);
}
reset();saveInventory({items:[{item:BLACKSMITH_ITEMS[0]!,quantity:1}],equipped:{weapon:BLACKSMITH_ITEMS[0]!.id}});assert.equal(loadInventory().items[0]!.item.id,BLACKSMITH_ITEMS[0]!.id);
data.set("drakoriaForgeMaterials",'"invalid"');assert.equal(loadForgeFragments(),0);
console.log("Crafting: 108 canonical recipes, tier progression, materials/gold, protected gear, spare copies, full backpack, refusals, legacy sets and subclass/server compatibility passed.");
