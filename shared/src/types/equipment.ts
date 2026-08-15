export type HeroClass = "guerreiro" | "mago" | "arqueiro";

export type EquipmentSlot =
  | "ring"
  | "weapon"
  | "armor"
  | "shield"
  | "legs"
  | "boots"
  | "gloves"
  | "earring"
  | "necklace";

export type EquipmentRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type EventType =
  | "pascoa"
  | "natal"
  | "halloween"
  | "ano-novo"
  | "aniversario"
  | "nenhum";

export interface EquipmentStats {
  hp?: number;
  mana?: number;
  attack?: number;
  defense?: number;
  criticalChance?: number;
  criticalDamage?: number;
  dodgeChance?: number;
  magicPower?: number;
}

export interface UniqueEffect {
  id: string;
  name: string;
  description: string;
  trigger: "onAttack" | "onDefense" | "onMagic" | "onDamageTaken" | "passive";
}

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  level: number;
  allowedClasses: Array<HeroClass | "universal">;
  stats: EquipmentStats;
  uniqueEffect?: UniqueEffect;
  eventType?: EventType;
  icon: string;
  sellPrice: number;
}
