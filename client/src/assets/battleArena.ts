import { getWorldRegion, WORLD_REGIONS } from "../../../shared/src/dungeons/worldRegions.js";
import { getDungeonConfig } from "../../../shared/src/dungeons/dungeonEncounters.js";

export function setupBattleArena(): void {
  const battlefield = document.getElementById("batalha");
  if (!battlefield) return;
  const battleId = localStorage.getItem("tipoBatalhaAtual");
  const config = getDungeonConfig(battleId ?? localStorage.getItem("dungeonAtual"));
  const regionId = localStorage.getItem("worldRegionAtual");
  const region = getWorldRegion(regionId);
  // Keep the same arena through normal, elite and boss encounters in a region.
  const arena = region && config?.id === region.config.id ? regionId
    : Object.entries(WORLD_REGIONS).find(([, candidate]) => candidate.config.id === config?.id)?.[0]
      ?? (config?.id === "dungeon-orc-king" ? "fortaleza-rei-orc" : undefined);
  if (arena) battlefield.dataset.arena = arena;
  else delete battlefield.dataset.arena;
}
