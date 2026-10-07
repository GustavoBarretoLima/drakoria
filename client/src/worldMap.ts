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
  levels.textContent = `Níveis ${config.minLevel}–${config.maxLevel}${config.bossLevel ? ` · Orc Rei nível ${config.bossLevel}` : ""}.`;
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
      caption.textContent = "Explorar";
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
