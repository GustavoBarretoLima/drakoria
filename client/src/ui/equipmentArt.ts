import { canonicalEquipment } from "../../../shared/src/equipment/equipmentRules.js";
import { classEquipmentIcon } from "../../../shared/src/equipment/equipmentArtPaths.js";
import type { EquipmentItem } from "../../../shared/src/types/equipment.js";

const icons: Record<string, string> = {
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-armor-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-armor-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-boots-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-boots-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-earring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-earring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-gloves-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-gloves-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-legs-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-legs-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-necklace-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-necklace-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-ring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-ring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-shield-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-shield-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-arqueiro-weapon-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-arqueiro-weapon-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-armor-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-armor-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-boots-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-boots-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-earring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-earring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-gloves-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-gloves-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-legs-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-legs-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-necklace-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-necklace-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-ring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-ring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-shield-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-shield-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-guerreiro-weapon-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-guerreiro-weapon-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-armor-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-armor-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-boots-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-boots-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-earring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-earring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-gloves-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-gloves-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-legs-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-legs-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-necklace-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-necklace-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-ring-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-ring-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-shield-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-shield-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/drakoria-mago-weapon-rare-lvl-20.png": new URL("../../../img/itens/loot_monstros/icones_128/drakoria-mago-weapon-rare-lvl-20.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/goblin-hide-gloves.png": new URL("../../../img/itens/loot_monstros/icones_128/goblin-hide-gloves.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/goblin-shadow-ring.png": new URL("../../../img/itens/loot_monstros/icones_128/goblin-shadow-ring.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/goblin-tooth-ring.png": new URL("../../../img/itens/loot_monstros/icones_128/goblin-tooth-ring.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-01.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-01.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-02.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-02.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-03.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-03.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-04.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-04.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-05.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-05.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-06.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-06.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-07.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-07.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-08.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-08.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-09.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-09.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-10.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-10.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-11.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-11.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-12.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-12.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-13.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-13.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-14.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-14.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-15.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-15.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/monster-loot-16.png": new URL("../../../img/itens/loot_monstros/icones_128/monster-loot-16.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-iron-axe.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-iron-axe.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-iron-chest.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-iron-chest.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-king-eye-of-truth.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-king-eye-of-truth.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-axe.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-axe.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-bow.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-bow.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-chest.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-chest.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-gloves.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-gloves.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-ring.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-ring.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-shield.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-shield.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-staff.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-staff.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/orc-warlord-sword.png": new URL("../../../img/itens/loot_monstros/icones_128/orc-warlord-sword.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/ring-universal-legendary-pascoa-lvl-100.png": new URL("../../../img/itens/loot_monstros/icones_128/ring-universal-legendary-pascoa-lvl-100.png", import.meta.url).href,
  "/img/itens/loot_monstros/icones_128/weapon-universal-legendary-natal-lvl-100.png": new URL("../../../img/itens/loot_monstros/icones_128/weapon-universal-legendary-natal-lvl-100.png", import.meta.url).href,
};

export function equipmentArt(item: EquipmentItem): string {
  // Older saves may still contain paths from before the art folder was consolidated.
  const canonical = canonicalEquipment(item);
  const savedIcon = canonical.icon || "";
  const path = savedIcon.replace("/img/itens/complementares/", "/img/itens/loot_monstros/icones_128/").replace("/img/itens/equipamentos/icones_128/", "/img/itens/loot_monstros/icones_128/");
  const cls = canonical.allowedClasses?.find(cls => cls === "guerreiro" || cls === "mago" || cls === "arqueiro") || "universal";
  const url = icons[path] || icons[classEquipmentIcon(cls, canonical.slot)];
  if (!url) return "";
  return `<span class="equipment-art${item.rarity === "mythic" ? " mythic-art" : ""}" aria-hidden="true"><img src="${url}" alt="" width="56" height="56" /></span>`;
}

declare global { interface Window { equipmentArt?: typeof equipmentArt; } }
if (typeof window !== "undefined") window.equipmentArt = equipmentArt;
