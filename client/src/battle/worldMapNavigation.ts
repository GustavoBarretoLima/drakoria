import { getWorldRegion } from "../../../shared/src/dungeons/worldRegions.js";
import { createDungeonRun } from "../../../shared/src/dungeons/dungeonRun.js";
import { clearBattleStorage, prepareNextMonster } from "./victoryNavigation.js";

type BattleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function enterWorldRegion(storage: BattleStorage, id: string, random: () => number = Math.random): boolean {
  const region = getWorldRegion(id);
  if (!region) return false;
  const saved = storage.getItem("drakoriaHeroVitals");
  if (saved) {
    try {
      if (Number(JSON.parse(saved).hp) <= 0) return false;
    } catch { /* Invalid saved vitals are handled by the normal battle setup. */ }
  }
  clearBattleStorage(storage);
  storage.setItem("worldRegionAtual", id);
  storage.setItem("dungeonAtual", region.config.id);
  storage.setItem("drakoriaDungeonRun", JSON.stringify(createDungeonRun(region.config.id)));
  prepareNextMonster(storage, random);
  return true;
}

export function getBattleExitPage(storage: BattleStorage): "mapa.html" | "praca.html" {
  return getWorldRegion(storage.getItem("worldRegionAtual")) ? "mapa.html" : "praca.html";
}
