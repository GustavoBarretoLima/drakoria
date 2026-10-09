import { QUESTS,questBlockReason,guildStanding } from "../../shared/src/quests/regionalQuests.js";
import { normalizeExpedition } from "../../shared/src/dungeons/expedition.js";
import { getDungeonConfig } from "../../shared/src/dungeons/dungeonEncounters.js";
import { loadQuests } from "./progression/questClient.js";
import { loadProgress } from "./progression/progressionClient.js";
import { WORLD_REGIONS, type WorldRegionId } from "../../shared/src/dungeons/worldRegions.js";
import { enterWorldRegion } from "./battle/worldMapNavigation.js";

const locations = document.getElementById("mapLocations")!;
const choices = document.getElementById("regionChoices")!;
const title = document.getElementById("regionTitle")!;
const description = document.getElementById("regionDescription")!;
const inhabitants = document.getElementById("regionInhabitants")!;
const levels = document.getElementById("regionLevels")!;
const details = document.getElementById("regionDetails")!;
const explore = document.getElementById("exploreRegion") as HTMLButtonElement;
const message = document.getElementById("mapMessage")!;
let selected: WorldRegionId | null = null;

function selectRegion(id: WorldRegionId): void {
  selected = id;
  const { config, inhabitants: monsters } = WORLD_REGIONS[id];
  title.textContent = config.label;
  description.textContent = config.description;
  inhabitants.textContent = `Monstros: ${monsters}.`;
  levels.textContent = `Níveis ${config.minLevel}–${config.maxLevel}${config.bossLevel ? ` · ${config.bossName} nível ${config.bossLevel}` : ""}.`;
  const quests=loadQuests();
  const regionQuests=QUESTS.filter(q=>q.region===id);
  const active=regionQuests.filter(q=>quests.entries[q.id]?.status==="active");
  let missions=document.getElementById("regionMissions");
  if(!missions){missions=document.createElement("section");missions.id="regionMissions";details.insertBefore(missions,explore);}
  missions.replaceChildren();
  const heading=document.createElement("h3");heading.textContent=`Missões da região • Seu rank: ${guildStanding(quests).rank}`;missions.append(heading);
  for(const quest of active){const entry=quests.entries[quest.id]!;const line=document.createElement("p");line.textContent=`${quest.name} • ${entry.count}/${quest.target}${entry.count>=quest.target?" • Entrega disponível na Guilda":""}`;missions.append(line);}
  if(!active.length){const line=document.createElement("p");line.textContent="Nenhuma missão ativa nesta região. Aceite contratos na Guilda antes de explorar.";missions.append(line);}
  const available=regionQuests.filter(q=>!questBlockReason(q,quests,loadProgress().nivel)).length;
  const link=document.createElement("a");link.href=`${import.meta.env.BASE_URL}pages/estabelecimentos.html#guilda`;link.textContent=`Ir à Guilda • ${available} contrato(s) disponível(is)`;missions.append(link);
  const boss=document.createElement("p");boss.textContent=`O boss aparece após ${config.bossAfterVictories??0} vitórias. Haverá uma pausa para preparação antes do confronto.`;missions.append(boss);
  details.hidden = false;
  explore.textContent = `Explorar ${config.label}`;
  message.textContent = "";
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-region]")) {
    button.setAttribute("aria-pressed", String(button.dataset.region === id));
  }
  details.scrollIntoView({ behavior: "smooth", block: "nearest" });
  explore.focus({ preventScroll: true });
}

for (const [id, region] of Object.entries(WORLD_REGIONS)) {
  for (const target of [locations, choices]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.region = id;
    button.setAttribute("aria-pressed", "false");
    button.textContent = region.config.label;
    if (target === locations) {
      button.className = "map-hotspot";
      button.style.setProperty("--x", `${region.x}%`);
      button.style.setProperty("--y", `${region.y}%`);
      const caption = document.createElement("span");
      const active=QUESTS.filter(q=>q.region===id&&loadQuests().entries[q.id]?.status==="active").length;
      caption.textContent = `Nv.${region.config.minLevel}–${region.config.maxLevel} • Boss ${region.config.bossLevel}${active?` • ${active} missão(ões)`:""}`;
      button.append(caption);
    }
    button.addEventListener("click", () => selectRegion(id as WorldRegionId));
    target.append(button);
  }
}

explore.addEventListener("click", () => {
  if (!selected || explore.disabled) return;
  if (!enterWorldRegion(localStorage, selected)) {
    message.textContent = "Você está sem HP. Retorne à praça e descanse na Taberna antes de explorar.";
    return;
  }
  explore.disabled = true;
  window.location.href = `${import.meta.env.BASE_URL}pages/batalha.html`;
});

// Keep a reviewable receipt after leaving an expedition; it never awards loot twice.
try {
 const raw=JSON.parse(localStorage.getItem("drakoriaLastExpedition")??"null");
 const config=raw?getDungeonConfig(raw.dungeonId):undefined;
 if(config){
  const totals=normalizeExpedition(raw.expedition);
  const summary=document.createElement("details");summary.className="map-panel expedition-receipt";
  const heading=document.createElement("summary");heading.textContent=`Última expedição • ${config.label} • ${raw.outcome==="completed"?"Boss derrotado":raw.outcome==="defeat"?"Derrota":"Retorno"}`;summary.append(heading);
  const stats=document.createElement("p");stats.textContent=`${Number.isFinite(raw.victories)?raw.victories:0} vitórias • ${totals.xp} XP • ${totals.gold} ouro obtidos em combate. Penalidades de derrota, quando houver, são mostradas separadamente na batalha.`;summary.append(stats);
  for(const item of totals.loot){const row=document.createElement("p");row.textContent=`${item.quantity}× ${item.name}`;summary.append(row);}
  document.querySelector(".map-header")!.after(summary);
 }
} catch { /* Invalid old receipts are ignored, without changing character progress. */ }
