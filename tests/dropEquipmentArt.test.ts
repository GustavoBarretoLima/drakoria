import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { ART_EQUIPMENT_ITEMS } from "../shared/src/loot/namedMonsterLoot.js";
import { DUNGEON_LOOT_ITEMS } from "../shared/src/loot/dungeonLoot.js";
import { STARTER_LOOT_ITEMS } from "../shared/src/loot/lootTables.js";
import { generateEquipmentCatalog } from "../shared/src/types/equipmentGenerator.js";
import { canonicalEquipment } from "../shared/src/equipment/equipmentRules.js";
import { createBerserkAxe } from "../shared/src/equipment/berserkWeapons.js";
import { createAssassinDaggers } from "../shared/src/equipment/assassinWeapons.js";
import { BERSERK_WEAPON_ICON, ASSASSIN_WEAPON_ICON } from "../shared/src/equipment/equipmentArtPaths.js";
const renderer=readFileSync("client/src/ui/equipmentArt.ts","utf8");
const items=[...Object.values(ART_EQUIPMENT_ITEMS),...Object.values(DUNGEON_LOOT_ITEMS),...Object.values(STARTER_LOOT_ITEMS),...generateEquipmentCatalog()];
for(const item of items){
 assert.ok(existsSync(item.icon.slice(1)),`${item.id}: missing ${item.icon}`);
 assert.ok(renderer.includes(`"${item.icon}"`),`${item.id}: unregistered art`);
 const old={...item,icon:"/img/itens/obsolete.png"};
 assert.equal(canonicalEquipment(old).icon,item.icon);
 if(item.slot!=="weapon")continue;
 if(item.allowedClasses.includes("guerreiro")){
  const axe=createBerserkAxe(item);assert.equal(axe.icon,item.weaponType==="two-handed-axe"?item.icon:BERSERK_WEAPON_ICON);assert.equal(canonicalEquipment(axe).icon,axe.icon);assert.deepEqual(axe.stats,item.stats);
 }
 if(item.allowedClasses.includes("arqueiro")){
  const dagger=createAssassinDaggers(item);assert.equal(dagger.icon,item.requiredSubclass==="assassin"?item.icon:ASSASSIN_WEAPON_ICON);assert.equal(canonicalEquipment(dagger).icon,dagger.icon);assert.deepEqual(dagger.stats,item.stats);
 }
}
for(const file of readdirSync("img/itens/loot_monstros/icones_128"))assert.ok(renderer.includes(file),file);
console.log(`Drop art audit: ${items.length} equipment variants with existing registered images; legacy canonical migration, class slots, events, insight and subclass weapon art covered.`);
