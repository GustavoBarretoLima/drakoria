import { trackedQuest } from "../progression/questClient.js";
import { loadDungeonRun } from "../battle/dungeonRunClient.js";
import { getDungeonConfig } from "../../../shared/src/dungeons/dungeonEncounters.js";
import "../../../css/quest-tracker.css";

/** Updated after rewards in both demo and online battle flows. */
export function renderQuestTracker():void {
  const tracked=trackedQuest(),run=loadDungeonRun();
  const config=run?getDungeonConfig(run.dungeonId):undefined;
  let tracker=document.getElementById("questTracker");
  if(!tracked&&!config){tracker?.remove();return;}
  if(!tracker){
    tracker=document.createElement("details");tracker.id="questTracker";tracker.className="quest-tracker";
    tracker.append(document.createElement("summary"),document.createElement("p"),document.createElement("p"));
    document.getElementById("batalha")?.append(tracker);
  }
  const summary=tracker.querySelector("summary")!;
  const [expedition,objective]=tracker.querySelectorAll("p");
  summary.textContent=config&&run?`${config.label} • ${run.bossDefeated?run.victories:`${run.victories}/${config.bossAfterVictories??"—"}`} vitórias${run.bossDefeated?" • Boss derrotado":run.bossPending?" • Boss à frente":""}`:tracked?.ready?"Missão concluída • entregar na Guilda":`Missão • ${tracked!.count}/${tracked!.quest.target}`;
  expedition!.hidden=!config;
  expedition!.textContent=run&&config?`Profundidade ${run.depth} • ${run.expedition?.xp??0} XP • ${run.expedition?.gold??0} ouro acumulados. ${run.bossDefeated?"Expedição concluída.":run.bossPending?`${config.bossName} aguarda no próximo encontro.`:`Faltam ${Math.max(0,(config.bossAfterVictories??0)-run.victories)} vitórias para o boss.`}`:"";
  objective!.hidden=!tracked;
  objective!.textContent=tracked?`${tracked.quest.name}: ${tracked.count}/${tracked.quest.target}${tracked.ready?" — recompensa disponível na Guilda":""}`:"";
  tracker.setAttribute("aria-label",config?"Painel da expedição":`Missão acompanhada: ${tracked!.quest.name}`);
}
