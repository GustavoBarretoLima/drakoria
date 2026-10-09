import { QUESTS,normalizeQuests,questBlockReason,advanceQuestVictory,type QuestProgress } from "../../../shared/src/quests/regionalQuests.js";
import type { BattleState } from "../../../shared/src/types/combat.js";
import { loadProgress,saveProgress,awardBattleRewards } from "./progressionClient.js";
import { addDropsToInventory } from "../inventory/inventoryClient.js";
import { createDungeonEquipment } from "../../../shared/src/loot/dungeonLoot.js";
import { adaptSubclassWeaponDrops } from "../../../shared/src/equipment/assassinWeapons.js";
import { getActiveSubclass } from "./subclassClient.js";
const KEY="drakoriaQuests";
export function loadQuests():QuestProgress{try{return normalizeQuests(JSON.parse(localStorage.getItem(KEY)??"{}"));}catch{return normalizeQuests({});}}
export function acceptQuest(id:string):string|null{
 const q=QUESTS.find(q=>q.id===id);if(!q)return "Missão desconhecida";
 const p=loadQuests(),reason=questBlockReason(q,p,loadProgress().nivel);if(reason)return reason;
 p.entries[id]={count:0,status:"active",claims:p.entries[id]?.claims??0};localStorage.setItem(KEY,JSON.stringify(p));return null;
}
export function recordQuestVictory(state:BattleState):void{
 if(!state.finished||state.winnerId!==state.hero.id)return;
 const drops=(state.rewards?.drops??[]).reduce((sum,drop)=>sum+drop.quantity,0);
 localStorage.setItem(KEY,JSON.stringify(advanceQuestVictory(loadQuests(),state.id,state.enemy.id,drops)));
}
export function claimQuest(id:string):string|null{
 const q=QUESTS.find(q=>q.id===id),p=loadQuests();const entry=p.entries[id];
 if(!q||!entry||entry.status!=="active"||entry.count<q.target)return "Missão ainda não concluída ou recompensa já entregue";
 entry.status="claimed";entry.claims++;localStorage.setItem(KEY,JSON.stringify(p));
 awardBattleRewards({xp:q.xp,gold:q.gold});
 const progress=loadProgress();if(!q.repeatable&&!progress.missoesConcluidas.includes(id)){progress.missoesConcluidas.push(id);saveProgress(progress);}
 if(q.gear){const raw=localStorage.getItem("classeHeroi");const cls=raw==="mago"||raw==="arqueiro"?raw:"guerreiro";
 addDropsToInventory(adaptSubclassWeaponDrops([{item:createDungeonEquipment(cls,"weapon",q.gear,"epic"),quantity:1}],getActiveSubclass(cls)));}
 return null;
}
