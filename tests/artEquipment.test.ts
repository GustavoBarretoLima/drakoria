import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { BLACKSMITH_ITEMS, MONSTER_DROP_SOURCES, MONSTER_EQUIPMENT_BASES } from "../shared/src/equipment/artEquipmentCatalog.js";
import { ART_EQUIPMENT_ITEMS, NAMED_RARITIES, NAMED_RARITY_WEIGHTS, createNamedEquipment, rollNamedMonsterDrops } from "../shared/src/loot/namedMonsterLoot.js";
import { canonicalEquipment, canEquipItem } from "../shared/src/equipment/equipmentRules.js";
import { getEquipmentById } from "../server/src/modules/equipment/equipmentService.js";
import { adaptSubclassWeaponDrops } from "../shared/src/equipment/assassinWeapons.js";
import { blacksmithPrice, buyBlacksmithItem } from "../client/src/progression/blacksmithClient.js";
import { loadInventory } from "../client/src/inventory/inventoryClient.js";

assert.equal(BLACKSMITH_ITEMS.length,27); assert.equal(MONSTER_EQUIPMENT_BASES.length,16);
for(const item of [...BLACKSMITH_ITEMS,...MONSTER_EQUIPMENT_BASES])assert.ok(existsSync(item.icon.slice(1)));
for(const weights of Object.values(NAMED_RARITY_WEIGHTS))assert.equal(weights.reduce((a,b)=>a+b,0),100);
for(const base of MONSTER_EQUIPMENT_BASES)for(const rarity of NAMED_RARITIES){
 const item=createNamedEquipment(base,15,rarity);assert.equal(item.level,15);assert.equal(getEquipmentById(item.id)?.id,item.id);
 assert.deepEqual(canonicalEquipment({...item,stats:{attack:999999}}).stats,item.stats);
 assert.equal(item.requiredSubclass,base.requiredSubclass);assert.equal(item.weaponType,base.weaponType);
 if(rarity==="mythic"){
  const key=base.allowedClasses.includes("mago")?"magicPower":base.allowedClasses.includes("universal")?"defense":"attack";
  assert.ok(item.stats[key]!>=5);assert.ok(item.description.includes("Bônus mítico: +5"));
 }
}
const old=Math.random;
try{
 for(const source of MONSTER_DROP_SOURCES){
  Math.random=()=>0;const drops=rollNamedMonsterDrops(`${source.monsterBaseId}-lvl-1`);
  assert.ok(drops.some(drop=>drop.item.id===`${source.itemId}-common-lvl-1`));
  Math.random=()=>.999;assert.equal(rollNamedMonsterDrops(`${source.monsterBaseId}-lvl-55`).length,0);
 }
 for(const [roll,rarity] of [[.1,"common"],[.75,"rare"],[.94,"epic"],[.985,"legendary"],[.999,"mythic"]] as const){
  let n=0;Math.random=()=>n++%2===0?0:roll;
  assert.equal(rollNamedMonsterDrops("shadow-wolf-normal-lvl-15")[0]!.item.rarity,rarity);
 }
 assert.equal(rollNamedMonsterDrops("goblin-normal-lvl-56").length,0);
 assert.equal(rollNamedMonsterDrops("unknown-normal-lvl-5").length,0);
}finally{Math.random=old;}
const dagger=ART_EQUIPMENT_ITEMS["monster-loot-01-mythic-lvl-5"]!;
assert.equal(canEquipItem(dagger,"arqueiro",5),false);assert.equal(canEquipItem(dagger,"arqueiro",5,"assassin"),true);
const axe=ART_EQUIPMENT_ITEMS["monster-loot-08-mythic-lvl-55"]!;
assert.equal(canEquipItem(axe,"guerreiro",55,"berserker"),true);assert.equal(canEquipItem(axe,"guerreiro",55),false);
for(const subclass of ["berserker","assassin"]){const cls=subclass==="berserker"?"guerreiro":"arqueiro";
 const base=BLACKSMITH_ITEMS.find(item=>item.slot==="weapon"&&item.allowedClasses.includes(cls))!;
 const item=adaptSubclassWeaponDrops([{item:base,quantity:1}],subclass)[0]!.item;
 assert.equal(getEquipmentById(item.id)?.icon,base.icon);assert.deepEqual(canonicalEquipment(item).stats,base.stats);
}
const values=new Map<string,string>();Object.defineProperty(globalThis,"localStorage",{value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)},configurable:true});
values.set("classeHeroi","guerreiro");values.set("drakoriaProgresso",JSON.stringify({nivel:20,xp:0,xpParaProximoNivel:1000,ouro:2000}));
const piece=BLACKSMITH_ITEMS[0]!;assert.equal(blacksmithPrice(piece.sellPrice),408);
assert.equal(buyBlacksmithItem(piece.id),null);assert.equal(loadInventory().items[0]!.quantity,1);
assert.equal(JSON.parse(values.get("drakoriaProgresso")!).ouro,1592);
const before=JSON.stringify([...values]);assert.ok(buyBlacksmithItem("fake"));assert.equal(JSON.stringify([...values]),before);
assert.equal(buyBlacksmithItem(piece.id),null);assert.equal(loadInventory().items[0]!.quantity,2);
values.set("drakoriaProgresso",JSON.stringify({nivel:20,ouro:0}));const poor=JSON.stringify([...values]);assert.ok(buyBlacksmithItem(piece.id));assert.equal(JSON.stringify([...values]),poor);
console.log("Art equipment: 27 shop items, 16 monster drops, five rarities, mythic bonuses, canonical server stats, restrictions, subclass variants, purchase price and stock passed.");
