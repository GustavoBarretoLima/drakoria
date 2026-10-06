import type { CombatantState } from "../../../shared/src/types/combat.js";

type DemoMonsterFactory = () => CombatantState;

const DEMO_MONSTERS: Record<string, DemoMonsterFactory> = {
  "goblin-normal-lvl-1": () => ({
    id: "goblin-normal-lvl-1",
    name: "Goblin Nv.1",
    sprites: {
      idle: "/img/monstros/goblin.gif",
      attack: "/img/monstros/goblin-ataque.gif",
      damage: "/img/monstros/goblin-dano.gif",
      death: "/img/monstros/goblin-dano.gif",
    },
    stats: {
      hp: 60,
      maxHp: 60,
      mana: 0,
      maxMana: 0,
      attack: 8,
      defense: 3,
      magicDefense: 1,
      speed: 12,
      criticalChance: 5,
      criticalDamage: 50,
    },
    atb: 0,
    defending: false,
    isAlive: true,
  }),
  "orc-normal-lvl-1": () => ({
    id: "orc-normal-lvl-1",
    name: "Orc Nv.1",
    sprites: {
      idle: "/img/monstros/orc-idle.png",
      attack: "/img/monstros/orc-attack.png",
      damage: "/img/monstros/orc-damage.png",
      death: "/img/monstros/orc-death.png",
    },
    stats: {
      hp: 95,
      maxHp: 95,
      mana: 0,
      maxMana: 0,
      attack: 14,
      defense: 6,
      magicDefense: 3,
      speed: 8,
      criticalChance: 6,
      criticalDamage: 60,
    },
    atb: 0,
    defending: false,
    isAlive: true,
  }),
};

export function createDemoMonster(monsterId: string): CombatantState {
  const factory = DEMO_MONSTERS[monsterId] ?? DEMO_MONSTERS["goblin-normal-lvl-1"];
  return factory();
}
