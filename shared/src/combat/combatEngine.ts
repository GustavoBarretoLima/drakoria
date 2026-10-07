import type {
  BattleState,
  BattleEvent,
} from "../types/combat.js";
import { isBattleAction, type BattleAction } from "./actions.js";
import { CLASS_SKILLS, getSkill, getSkillBlockReason, getSkillCooldown } from "./classSkills.js";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollCritical(criticalChance: number): boolean {
  const normalizedChance = Number.isFinite(criticalChance) ? Math.min(100, Math.max(0, criticalChance)) : 0;
  return Math.random() * 100 < normalizedChance;
}

export function applyCriticalDamage(
  damage: number,
  criticalDamage: number,
): number {
  const bonus = Math.max(0, criticalDamage) / 100;
  return Math.max(1, Math.floor(damage * (1 + bonus)));
}

export function calculateDamageTaken(
  baseDamage: number,
  defense: number,
  defending: boolean,
): number {
  const safeBaseDamage = Math.max(1, Math.floor(baseDamage));
  const safeDefense = Math.max(0, Math.floor(defense));

  const defenseReduction = Math.floor(safeDefense * 0.5);
  let damage = Math.max(1, safeBaseDamage - defenseReduction);

  if (defending) {
    damage = Math.max(1, Math.floor(damage / 2));
  }

  return damage;
}

function createEvent(
  actorId: string,
  targetId: string,
  action: BattleEvent["action"],
  message: string,
  damage?: number,
  critical?: boolean,
): BattleEvent {
  const event: BattleEvent = {
    actorId,
    targetId,
    action,
    message,
  };

  if (damage !== undefined) event.damage = damage;
  if (critical !== undefined) event.critical = critical;

  return event;
}

export function applyBattleAction(
  state: BattleState,
  action: BattleAction,
): BattleState {
  if (!isBattleAction(action)) return state;
  if (state.finished) return state;
  if (state.turnOwnerId !== state.hero.id) return state;
  if (!state.hero.isAlive || !state.enemy.isAlive) return state;

  const selectedSkill = action.type === "USE_SKILL" ? getSkill(action.skillId) : undefined;
  // Rejected skills leave mana, ATB, cooldowns and the current turn untouched.
  if (action.type === "USE_SKILL" && (!selectedSkill || getSkillBlockReason(state.hero, selectedSkill))) return state;

  const hero = { ...state.hero, stats: { ...state.hero.stats }, atb: 0 };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats } };

  let event: BattleEvent;

  switch (action.type) {
    case "USE_SKILL": {
      if (!selectedSkill) return state;
      hero.stats.mana -= selectedSkill.manaCost;
      let damage = 0;
      let critical = false;
      let hits = 0;
      for (let hit = 0; hit < selectedSkill.hits && enemy.isAlive; hit++) {
        hits++;
        if (rollDodge(enemy.stats.dodgeChance)) continue;
        const hitCritical = rollCritical(hero.stats.criticalChance + selectedSkill.criticalBonus);
        const magic = selectedSkill.damageType === "magic";
        const power = magic ? hero.stats.magicPower : hero.stats.attack;
        const baseDamage = magic ? randomInt(10, 25) : randomInt(5, 15);
        const defense = (magic ? enemy.stats.magicDefense : enemy.stats.defense) * selectedSkill.defenseMultiplier;
        const mitigated = calculateDamageTaken(baseDamage + power * selectedSkill.powerMultiplier, defense, enemy.defending);
        const hitDamage = hitCritical ? applyCriticalDamage(mitigated, hero.stats.criticalDamage) : mitigated;
        damage += hitDamage;
        critical ||= hitCritical;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - hitDamage);
        enemy.isAlive = enemy.stats.hp > 0;
        enemy.defending = false;
      }
      const guarded = selectedSkill.effect === "guard";
      const disrupted = selectedSkill.effect === "resetAtb" && damage > 0;
      if (guarded) hero.defending = true;
      if (disrupted) enemy.atb = 0;
      event = {
        actorId: hero.id, targetId: enemy.id,
        action: selectedSkill.damageType === "magic" ? "CAST_MAGIC" : "ATTACK",
        skillId: selectedSkill.id, special: selectedSkill.name, damage, critical, hits,
        dodged: damage === 0,
        message: (damage === 0
          ? `${enemy.name} esquivou de ${selectedSkill.name}.`
          : `${critical ? "CRITICO! " : ""}${hero.name} usou ${selectedSkill.name} e causou ${damage} de dano${hits > 1 ? ` em ${hits} tiros` : ""}.`)
          + (guarded ? ` ${hero.name} assumiu postura defensiva.` : "")
          + (disrupted ? " O ATB inimigo foi zerado." : ""),
      };
      break;
    }
    case "ATTACK": {
      const dodged = rollDodge(enemy.stats.dodgeChance);
      const critical = !dodged && rollCritical(hero.stats.criticalChance);
      const rawDamage = randomInt(5, 15) + hero.stats.attack;
      const mitigatedDamage = calculateDamageTaken(
        rawDamage,
        enemy.stats.defense,
        enemy.defending,
      );
      const damage = dodged ? 0 : critical
        ? applyCriticalDamage(mitigatedDamage, hero.stats.criticalDamage)
        : mitigatedDamage;

      enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
      enemy.isAlive = enemy.stats.hp > 0;
      if (!dodged) enemy.defending = false;

      event = createEvent(
        hero.id,
        enemy.id,
        "ATTACK",
        critical
          ? `CRITICO! ${hero.name} causou ${damage} de dano.`
          : `${hero.name} causou ${damage} de dano.`,
        damage,
        critical,
      );
      break;
    }

    case "DEFEND": {
      hero.defending = true;
      event = createEvent(
        hero.id,
        hero.id,
        "DEFEND",
        `${hero.name} entrou em postura defensiva e reduzira o proximo dano recebido.`,
      );
      break;
    }

    case "CAST_MAGIC": {
      if (hero.stats.mana >= 10) {
        hero.stats.mana -= 10;

        const dodged = rollDodge(enemy.stats.dodgeChance);
        const critical = !dodged && rollCritical(hero.stats.criticalChance);
        const rawDamage = randomInt(10, 25) + hero.stats.magicPower;
        const mitigatedDamage = calculateDamageTaken(
          rawDamage,
          enemy.stats.magicDefense,
          enemy.defending,
        );
        const damage = dodged ? 0 : critical
          ? applyCriticalDamage(mitigatedDamage, hero.stats.criticalDamage)
          : mitigatedDamage;

        enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
        enemy.isAlive = enemy.stats.hp > 0;
        if (!dodged) enemy.defending = false;

        event = createEvent(
          hero.id,
          enemy.id,
          "CAST_MAGIC",
          critical
            ? `CRITICO! ${hero.name} lançou magia e causou ${damage} de dano.`
            : `${hero.name} lançou magia e causou ${damage} de dano.`,
          damage,
          critical,
        );
      } else {
        event = createEvent(
          hero.id,
          hero.id,
          "CAST_MAGIC",
          `${hero.name} tentou usar magia sem mana suficiente.`,
        );
      }
      break;
    }

    default: {
      const exhaustiveCheck: never = action;
      void exhaustiveCheck;
      throw new Error("Unknown action type");
    }
  }

  if (event.damage === 0 && !event.skillId) {
    event.dodged = true;
    event.message = `${enemy.name} esquivou do ataque de ${hero.name}.`;
  }
  if (state.hero.skillCooldowns || selectedSkill) {
    hero.skillCooldowns = {};
    for (const skill of CLASS_SKILLS) {
      const remaining = getSkillCooldown(state.hero, skill.id);
      if (remaining > 1) hero.skillCooldowns[skill.id] = remaining - 1;
    }
    if (selectedSkill) hero.skillCooldowns[selectedSkill.id] = selectedSkill.cooldown;
  }
  const finished = !enemy.isAlive;

  return {
    ...state,
    hero,
    enemy,
    finished,
    ...(finished ? { winnerId: hero.id } : {}),
    turnOwnerId: finished ? hero.id : null,
    lastEvent: event,
  };
}

/** Dodge is percentage based and capped at 50% so every build remains hittable. */
export function rollDodge(chance: number): boolean {
  const safeChance = Number.isFinite(chance) ? Math.min(50, Math.max(0, chance)) : 0;
  return Math.random() * 100 < safeChance;
}

/** One enemy action per ATB turn; cooldown counts subsequent enemy turns. */
export function applyEnemyTurn(state: BattleState): BattleState {
  if (state.finished || state.turnOwnerId !== state.enemy.id) return state;
  const hero = { ...state.hero, stats: { ...state.hero.stats } };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats }, atb: 0 };
  const orcKing = enemy.id.startsWith("orc-king-boss-lvl-");
  const boss = /-boss-lvl-\d+$/.test(enemy.id);
  const elite = enemy.id.startsWith("hobgoblin-elite-lvl-");
  const entersPhaseTwo = orcKing && enemy.phase !== 2 && enemy.stats.hp <= enemy.stats.maxHp / 2;
  if (entersPhaseTwo) {
    enemy.phase = 2;
    enemy.stats.attack = Math.floor(enemy.stats.attack * 1.3);
    enemy.stats.defense = Math.floor(enemy.stats.defense * 1.25);
    enemy.stats.magicPower = Math.floor(enemy.stats.magicPower * 1.15);
  }
  const prefix = entersPhaseTwo ? "DANGER! O Orc Rei entrou em fúria. " : "";
  const cooldown = enemy.specialCooldown ?? 0;
  enemy.specialCooldown = Math.max(0, cooldown - 1);
  const special = !enemy.charging && cooldown === 0 && Math.random() < (elite ? 0.4 : boss ? 0.45 : 0.25);
  // Elite telegraphs its armor-piercing strike for a full hero response window.
  if (elite && special) {
    enemy.charging = true;
    enemy.defending = true;
    return { ...state, hero, enemy, turnOwnerId: null,
      lastEvent: { actorId: enemy.id, targetId: enemy.id, action: "DEFEND", special: "Preparar Emboscada",
        message: `${enemy.name} ergue o escudo e prepara uma estocada perfurante. Defenda-se!` } };
  }
  const ambush = elite && enemy.charging === true;
  const usesMagic = orcKing ? enemy.phase === 2 && special : special && enemy.stats.magicPower > 0;
  const ability = ambush ? "Estocada Perfurante" : special ? usesMagic ? "Magia Sombria" : "Golpe Poderoso" : undefined;
  if (ambush || special) enemy.specialCooldown = boss && enemy.phase === 2 ? 1 : 2;
  enemy.charging = false;
  const dodged = rollDodge(hero.stats.dodgeChance);
  const critical = !dodged && rollCritical(enemy.stats.criticalChance);
  const power = usesMagic ? enemy.stats.magicPower : enemy.stats.attack;
  const rawDamage = power * (ambush ? 1.35 : special ? 1.15 : 1) + (usesMagic ? 6 : 0);
  const defense = usesMagic ? hero.stats.magicDefense : hero.stats.defense * (ambush ? 0.5 : 1);
  const mitigated = calculateDamageTaken(rawDamage, defense, hero.defending);
  const damage = dodged ? 0 : critical ? applyCriticalDamage(mitigated, enemy.stats.criticalDamage) : mitigated;
  hero.stats.hp = Math.max(0, hero.stats.hp - damage);
  hero.isAlive = hero.stats.hp > 0;
  // A missed hit preserves a defensive stance until an actual hit lands.
  if (!dodged) hero.defending = false;
  const event: BattleEvent = {
    actorId: enemy.id, targetId: hero.id, action: usesMagic ? "CAST_MAGIC" : "ATTACK",
    damage, critical, dodged,
    ...(ability ? { special: ability } : {}),
    message: dodged ? `${prefix}${hero.name} esquivou de ${ability ?? "ataque"} de ${enemy.name}.`
      : `${prefix}${critical ? "CRITICO! " : ""}${enemy.name} usou ${ability ?? "ataque básico"} e causou ${damage} de dano.`,
  };
  return { ...state, hero, enemy, finished: !hero.isAlive,
    ...(!hero.isAlive ? { winnerId: enemy.id } : {}), turnOwnerId: !hero.isAlive ? enemy.id : null, lastEvent: event };
}
