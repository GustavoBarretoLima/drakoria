import { trackedQuest } from "../progression/questClient.js";
import "../../../css/quest-tracker.css";

/** Updated after rewards in both demo and online battle flows. */
export function renderQuestTracker():void {
  const tracked=trackedQuest();
  let tracker=document.getElementById("questTracker");
  if(!tracked){tracker?.remove();return;}
  if(!tracker){
    tracker=document.createElement("details");
    tracker.id="questTracker";
    tracker.className="quest-tracker";
    const summary=document.createElement("summary");
    const objective=document.createElement("p");
    tracker.append(summary,objective);
    document.getElementById("batalha")?.append(tracker);
  }
  const {quest,count,ready}=tracked;
  tracker.querySelector("summary")!.textContent=ready?"Missão concluída • entregar na Guilda":`Missão • ${count}/${quest.target}`;
  tracker.querySelector("p")!.textContent=`${quest.name}: ${count}/${quest.target}${ready?" — recompensa disponível na Guilda":""}`;
  // Navigation during combat must keep using the existing retreat flow.
  tracker.setAttribute("aria-label",`Missão acompanhada: ${quest.name}`);
}
