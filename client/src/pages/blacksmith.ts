import { FORGE_RECIPES,FORGE_TIERS,fitsForgeRecipe,salvageYield } from "../../../shared/src/equipment/crafting.js";
import { EQUIPMENT_RARITY_META } from "../../../shared/src/types/equipmentRarity.js";
import { equipmentArt } from "../ui/equipmentArt.js";
import { craftEquipment,dismantleEquipment,loadForgeFragments,spareQuantity,forgeResult,forgeBlockReason } from "../progression/blacksmithClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { loadInventory } from "../inventory/inventoryClient.js";
import { getActiveSubclass } from "../progression/subclassClient.js";
import type { EquipmentItem } from "../../../shared/src/types/equipment.js";
const labels:Record<string,string>={attack:"Força / ataque",defense:"Defesa",hp:"HP",mana:"Mana",magicPower:"Poder mágico",magicDefense:"Defesa mágica",speed:"Velocidade",criticalChance:"Crítico %",criticalDamage:"Dano crítico %",dodgeChance:"Esquiva %"};
const esc=(text:string)=>text.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
const stats=(item:EquipmentItem)=>Object.entries(item.stats).map(([key,value])=>`${labels[key]??key} +${value}`).join(" · ");
let tab:"forge"|"salvage"="forge",tier=0;
const bases=new Map<string,string>();
let pending:{recipeId:string;baseId:string}|{salvageId:string}|null=null;
function openBlacksmith(message=""):void {
 const panel=document.getElementById("ferreiro");if(!panel)return;panel.style.display="block";
 const progress=loadProgress(),inventory=loadInventory(),fragments=loadForgeFragments();
 const raw=(localStorage.getItem("classeHeroi")??"guerreiro").toLowerCase(),cls=raw==="mago"||raw==="arqueiro"?raw:"guerreiro";
 const recipes=FORGE_RECIPES.filter(recipe=>recipe.item.allowedClasses.includes(cls)&&recipe.item.rarity===FORGE_TIERS[tier]!.rarity&&!(recipe.item.slot==="shield"&&getActiveSubclass(cls)==="berserker"));
 let review="";
 if(pending&&"recipeId" in pending){
  const recipeId=pending.recipeId;
  const recipe=FORGE_RECIPES.find(recipe=>recipe.item.id===recipeId)!;
  const base=inventory.items.find(entry=>entry.item.id===(pending as {baseId:string}).baseId);
  if(base){const result=forgeResult(recipe);review=`<section class="forge-review"><h3>Confirmar criação</h3><p>Consumir 1× ${esc(base.item.name)}, ${recipe.fragments} fragmentos e ${recipe.gold} ouro.</p><div class="forge-comparison"><div><strong>Peça utilizada</strong><p>${esc(stats(base.item))}</p></div><div><strong>${esc(result.name)}</strong><p>${esc(stats(result))}</p></div></div><p>A peça criada vai para a mochila. O equipamento em uso permanece protegido.</p><button data-confirm>Confirmar forja</button><button data-cancel>Cancelar</button></section>`;}
 }else if(pending&&"salvageId" in pending){const id=pending.salvageId;const entry=inventory.items.find(entry=>entry.item.id===id);if(entry)review=`<section class="forge-review"><h3>Confirmar desmontagem</h3><p>Desmontar 1× ${esc(entry.item.name)} por ${salvageYield(entry.item)} fragmentos. Essa unidade será consumida.</p><button data-confirm>Confirmar desmontagem</button><button data-cancel>Cancelar</button></section>`;}
 panel.innerHTML=`<section class="blacksmith-shop"><header><h2>Forja de Drakoria</h2><strong>${progress.ouro} ouro • ${fragments} fragmentos</strong></header><p>Transforme equipamentos que sobraram em fragmentos. Forje uma peça superior usando fragmentos, ouro e uma peça inferior do mesmo slot. Sem chance de falha.</p><nav aria-label="Serviços do ferreiro"><button data-tab="forge" aria-pressed="${tab==="forge"}">Forjar equipamentos</button><button data-tab="salvage" aria-pressed="${tab==="salvage"}">Desmontar equipamentos</button></nav><p role="status" aria-live="polite">${esc(message)}</p>${review}${tab==="forge"?`<nav aria-label="Qualidade da forja">${FORGE_TIERS.map((entry,index)=>`<button data-tier="${index}" aria-pressed="${index===tier}">${EQUIPMENT_RARITY_META[entry.rarity].label} • Nv.${entry.level}</button>`).join("")}</nav><div class="blacksmith-grid">${recipes.map(recipe=>{
 const item=forgeResult(recipe);const compatible=inventory.items.filter(entry=>spareQuantity(inventory,entry.item.id)>0&&fitsForgeRecipe(entry.item,recipe));
 const selected=bases.get(recipe.item.id);const base=compatible.find(entry=>entry.item.id===selected)??compatible[0];if(base)bases.set(recipe.item.id,base.item.id);
 const block=forgeBlockReason(recipe,base?.item.id??"");
 return `<article class="blacksmith-card rarity-${item.rarity}">${equipmentArt(item)}<h3>${esc(item.name)}</h3><p>${esc(stats(item))}</p><p>Receita: ${recipe.fragments} fragmentos • ${recipe.gold} ouro • 1 peça ${recipe.inputs.map(rarity=>EQUIPMENT_RARITY_META[rarity].label).join(" / ")} do mesmo slot, até Nv.${item.level}.</p><label>Peça da mochila<select data-base="${recipe.item.id}"><option value="">${compatible.length?"Escolha uma peça":"Nenhuma peça compatível"}</option>${compatible.map(entry=>`<option value="${esc(entry.item.id)}" ${base?.item.id===entry.item.id?"selected":""}>${esc(entry.item.name)} • ${spareQuantity(inventory,entry.item.id)} disponível(is)</option>`).join("")}</select></label>${base?`<p>Peça atual: ${esc(stats(base.item))}</p>`:""}<button data-forge="${recipe.item.id}" ${block?"disabled":""}>${block??"Revisar forja"}</button></article>`;
 }).join("")}</div>`:`<p>Somente unidades disponíveis na mochila podem ser desmontadas. A cópia equipada nunca será consumida.</p><div class="blacksmith-grid">${inventory.items.filter(entry=>spareQuantity(inventory,entry.item.id)>0).map(entry=>`<article class="blacksmith-card rarity-${entry.item.rarity}">${equipmentArt(entry.item)}<h3>${esc(entry.item.name)}</h3><p>${spareQuantity(inventory,entry.item.id)} disponível(is) • +${salvageYield(entry.item)} fragmentos por unidade</p><button data-salvage="${esc(entry.item.id)}">Desmontar 1 unidade</button></article>`).join("")||"<p>Nenhum equipamento sobrando na mochila.</p>"}</div>`}<a class="blacksmith-back" href="praca.html">Voltar à praça</a></section>`;
 panel.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach(button=>button.addEventListener("click",()=>{tab=button.dataset.tab as typeof tab;pending=null;openBlacksmith();}));
 panel.querySelectorAll<HTMLButtonElement>("[data-tier]").forEach(button=>button.addEventListener("click",()=>{tier=Number(button.dataset.tier);pending=null;openBlacksmith();}));
 panel.querySelectorAll<HTMLSelectElement>("[data-base]").forEach(select=>select.addEventListener("change",()=>{bases.set(select.dataset.base!,select.value);pending=null;openBlacksmith();}));
 panel.querySelectorAll<HTMLButtonElement>("[data-forge]").forEach(button=>button.addEventListener("click",()=>{pending={recipeId:button.dataset.forge!,baseId:bases.get(button.dataset.forge!)??""};openBlacksmith();panel.querySelector(".forge-review")?.scrollIntoView({block:"nearest"});}));
 panel.querySelectorAll<HTMLButtonElement>("[data-salvage]").forEach(button=>button.addEventListener("click",()=>{pending={salvageId:button.dataset.salvage!};openBlacksmith();panel.querySelector(".forge-review")?.scrollIntoView({block:"nearest"});}));
 panel.querySelector("[data-cancel]")?.addEventListener("click",()=>{pending=null;openBlacksmith("Operação cancelada.");});
 panel.querySelector("[data-confirm]")?.addEventListener("click",()=>{const action=pending;pending=null;if(!action)return;const result="recipeId" in action?craftEquipment(action.recipeId,action.baseId):dismantleEquipment(action.salvageId);openBlacksmith(result??("recipeId" in action?"Equipamento forjado e adicionado à mochila!":"Equipamento desmontado. Fragmentos recebidos."));});
}
declare global {interface Window {carregarFerreiro:()=>void;}}
window.addEventListener("DOMContentLoaded",()=>{window.carregarFerreiro=()=>openBlacksmith();if(window.location.hash==="#ferreiro")openBlacksmith();});
