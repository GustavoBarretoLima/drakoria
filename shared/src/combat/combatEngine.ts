import type {
  BattleState,
  BattleEvent,
} from "../types/combat.js";
import { isBattleAction, type BattleAction } from "./actions.js";
import { tickPotionBuff } from "../items/potions.js";
import { CLASS_SKILLS, getHeroSkills, getSkill, getSkillBlockReason, getSkillCooldown } from "./classSkills.js";
import type { CombatantState } from "../types/combat.js";
import { SUBCLASS_SKILLS } from "../classes/skillTrees.js";

import { performBerserkSkill, berserkDamageMultiplier, berserkCriticalBonus, healBerserkDamage, onBerserkBasicHit, finishBerserkAction, takeBerserkDamage, tickBerserkBleed } from "./berserkCombat.js";

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

  if (state.hero.subclassId === "berserker" && action.type === "CAST_MAGIC") return state;
  if (action.type === "CAST_MAGIC" && (state.hero.skillLockedTurns ?? 0) > 0) return state;
  const selectedSkill = action.type === "USE_SKILL" ? getHeroSkills(state.hero).find(skill => skill.id === action.skillId) ?? getSkill(action.skillId) : undefined;
  // Rejected skills leave mana, ATB, cooldowns and the current turn untouched.
  if (action.type === "USE_SKILL" && (!selectedSkill || getSkillBlockReason(state.hero, selectedSkill))) return state;

  const hero = { ...state.hero, stats: { ...state.hero.stats }, ...(state.hero.berserk ? { berserk: { ...state.hero.berserk } } : {}), atb: 0 };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats } };

  const statusMessage = tickHeroDamage(hero) + tickBerserkBleed(enemy);
  if (!hero.isAlive) return { ...state, hero, enemy, finished: true, winnerId: enemy.id, turnOwnerId: enemy.id,
    lastEvent: { actorId: enemy.id, targetId: hero.id, action: "CAST_MAGIC", message: statusMessage } };
  if (!enemy.isAlive) return { ...state, hero, enemy, finished: true, winnerId: hero.id, turnOwnerId: hero.id, lastEvent: { actorId: hero.id, targetId: enemy.id, action: "ATTACK", message: statusMessage } };
  hero.skillLockedTurns = Math.max(0, (hero.skillLockedTurns ?? 0) - 1);
  let event: BattleEvent;

  switch (action.type) {
    case "USE_SKILL": {
      if (!selectedSkill) return state;
      if (selectedSkill.effect === "berserk") {
        event = performBerserkSkill(hero, enemy, selectedSkill, { dodge: rollDodge, critical: rollCritical, mitigate: calculateDamageTaken, criticalDamage: applyCriticalDamage });
        break;
      }
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
        const execution = selectedSkill.effect === "execute" && enemy.stats.hp <= enemy.stats.maxHp * 0.3 ? 1.3 : 1;
        const mitigated = calculateDamageTaken((baseDamage + power * selectedSkill.powerMultiplier) * execution, defense, enemy.defending);
        const hitDamage = hitCritical ? applyCriticalDamage(mitigated, hero.stats.criticalDamage) : mitigated;
        damage += hitDamage;
        critical ||= hitCritical;
        enemy.stats.hp = Math.max(0, enemy.stats.hp - hitDamage);
        enemy.isAlive = enemy.stats.hp > 0;
        enemy.defending = false;
      }
      const guarded = selectedSkill.effect === "guard" || selectedSkill.effect === "healGuard";
      const disrupted = selectedSkill.effect === "resetAtb" && damage > 0;
      if (guarded) hero.defending = true;
      if (disrupted) enemy.atb = 0;
      let recovery = 0;
      if (["heal", "healGuard", "drain"].includes(selectedSkill.effect)) {
        const rank = hero.treeRanks?.[selectedSkill.id] ?? 1;
        const amount = selectedSkill.effect === "drain" ? Math.floor(damage * 0.25) : Math.floor(hero.stats.maxHp * ((selectedSkill.effect === "healGuard" ? 0.35 : 0.2) + (rank - 1) * 0.03));
        recovery = Math.min(amount, hero.stats.maxHp - hero.stats.hp);
        hero.stats.hp += recovery;
      }
      if (selectedSkill.effect === "recoil") hero.stats.hp = Math.max(1, hero.stats.hp - Math.floor(hero.stats.maxHp * 0.05));
      if (damage > 0 && selectedSkill.effect === "weaken") enemy.weakenedTurns = 3;
      if (damage > 0 && ["bleed", "burn", "summon"].includes(selectedSkill.effect)) {
        const power = selectedSkill.damageType === "magic" ? hero.stats.magicPower : hero.stats.attack;
        enemy.ongoingDamage = { damage: Math.max(1, Math.floor(power * (0.15 + selectedSkill.powerMultiplier * 0.05))), turns: 3,
          name: selectedSkill.effect === "summon" ? selectedSkill.name : selectedSkill.effect === "bleed" ? "Sangramento" : "Queimadura" };
      }
      event = {
        actorId: hero.id, targetId: selectedSkill.hits === 0 ? hero.id : enemy.id,
        action: selectedSkill.hits === 0 ? "DEFEND" : selectedSkill.damageType === "magic" ? "CAST_MAGIC" : "ATTACK",
        skillId: selectedSkill.id, special: selectedSkill.name, damage, critical, hits,
        dodged: selectedSkill.hits > 0 && damage === 0,
        message: (selectedSkill.hits === 0 ? `${hero.name} usou ${selectedSkill.name}.` : damage === 0
          ? `${enemy.name} esquivou de ${selectedSkill.name}.`
          : `${critical ? "CRITICO! " : ""}${hero.name} usou ${selectedSkill.name} e causou ${damage} de dano${hits > 1 ? ` em ${hits} tiros` : ""}.`)
          + (guarded ? ` ${hero.name} assumiu postura defensiva.` : "")
          + (disrupted ? " O ATB inimigo foi zerado." : ""),
      };
      if (recovery > 0) event.message += ` Recuperou ${recovery} HP.`;
      if (damage > 0 && selectedSkill.effect === "weaken") event.message += " Alvo enfraquecido por três turnos.";
      if (damage > 0 && ["bleed", "burn", "summon"].includes(selectedSkill.effect)) event.message += ` ${enemy.ongoingDamage!.name} ativo por três turnos.`;
      break;
    }
    case "ATTACK": {
      const dodged = rollDodge(enemy.stats.dodgeChance);
      const critical = !dodged && rollCritical(hero.stats.criticalChance + berserkCriticalBonus(hero));
      const rawDamage = (randomInt(5, 15) + hero.stats.attack) * berserkDamageMultiplier(hero, true);
      const mitigatedDamage = calculateDamageTaken(
        rawDamage,
        enemy.stats.defense,
        enemy.defending,
      );
      const damage = dodged ? 0 : critical
        ? applyCriticalDamage(mitigatedDamage, hero.stats.criticalDamage)
        : mitigatedDamage;

      if (hero.subclassId === "berserker" && damage > 0) {
        healBerserkDamage(hero, Math.min(enemy.stats.hp, damage));
        onBerserkBasicHit(hero);
      }
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
        const critical = !dodged && rollCritical(hero.stats.criticalChance + berserkCriticalBonus(hero));
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
    for (const skill of [...CLASS_SKILLS, ...SUBCLASS_SKILLS]) {
      const remaining = getSkillCooldown(state.hero, skill.id);
      if (remaining > 1) hero.skillCooldowns[skill.id] = remaining - 1;
    }
    if (selectedSkill) hero.skillCooldowns[selectedSkill.id] = selectedSkill.cooldown;
  }
  finishBerserkAction(hero, state.hero, selectedSkill?.id, action.type === "ATTACK" && (event.damage ?? 0) > 0);
  tickPotionBuff(hero);
  event.message = statusMessage + event.message;
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
  const hero = { ...state.hero, stats: { ...state.hero.stats }, ...(state.hero.berserk ? { berserk: { ...state.hero.berserk } } : {}) };
  const enemy = { ...state.enemy, stats: { ...state.enemy.stats }, atb: 0 };
  enemy.slowedTurns = Math.max(0, (enemy.slowedTurns ?? 0) - 1);
  let ongoingMessage = "";
  if (enemy.ongoingDamage && enemy.ongoingDamage.turns > 0) {
    const ongoing = enemy.ongoingDamage;
    const damage = Math.min(enemy.stats.hp, ongoing.damage);
    enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
    enemy.isAlive = enemy.stats.hp > 0;
    if (ongoing.turns > 1) enemy.ongoingDamage = { ...ongoing, turns: ongoing.turns - 1 };
    else delete enemy.ongoingDamage;
    ongoingMessage = `${ongoing.name} causou ${damage} de dano. `;
    if (!enemy.isAlive) return { ...state, hero, enemy, finished: true, winnerId: hero.id, turnOwnerId: hero.id,
      lastEvent: { actorId: hero.id, targetId: enemy.id, action: "CAST_MAGIC", damage, message: ongoingMessage } };
  }
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
  const prefix = ongoingMessage + (entersPhaseTwo ? "DANGER! O Orc Rei entrou em fúria. " : "");
  const weakened = (enemy.weakenedTurns ?? 0) > 0;
  enemy.weakenedTurns = Math.max(0, (enemy.weakenedTurns ?? 0) - 1);
  const cooldown = enemy.specialCooldown ?? 0;
  enemy.specialCooldown = Math.max(0, cooldown - 1);
  const regionAbility = enemy.id.startsWith("corruption-hydra-boss-") ? { name: "Névoa Venenosa", effect: "Veneno" }
    : enemy.id.startsWith("mutant-wolf-boss-") ? { name: "Ferida Dilacerante", effect: "Sangramento" }
    : enemy.id.startsWith("orc-warlord-boss-") ? { name: "Quebra-osso", effect: "Quebra-osso" }
    : orcKing ? { name: "Lâmina Sangrenta", effect: "Sangramento" } : undefined;
  const regionalSpecial = Boolean(regionAbility && enemy.stats.hp <= enemy.stats.maxHp * .3 && cooldown === 0);
  const special = regionAbility ? regionalSpecial : !enemy.charging && cooldown === 0 && Math.random() < (elite ? 0.4 : boss ? 0.45 : 0.25);
  // Elite telegraphs its armor-piercing strike for a full hero response window.
  if (elite && special) {
    enemy.charging = true;
    enemy.defending = true;
    return { ...state, hero, enemy, turnOwnerId: null,
      lastEvent: { actorId: enemy.id, targetId: enemy.id, action: "DEFEND", special: "Preparar Emboscada",
        message: `${prefix}${enemy.name} ergue o escudo e prepara uma estocada perfurante. Defenda-se!` } };
  }
  const ambush = elite && enemy.charging === true;
  const usesMagic = regionalSpecial || (special && !regionAbility && enemy.stats.magicPower > 0);
  const ability = regionalSpecial ? regionAbility!.name : ambush ? "Estocada Perfurante" : special ? usesMagic ? "Magia Sombria" : "Golpe Poderoso" : undefined;
  if (ambush || special) enemy.specialCooldown = regionalSpecial ? 2 : boss && enemy.phase === 2 ? 1 : 2;
  enemy.charging = false;
  const dodged = rollDodge(hero.stats.dodgeChance);
  const critical = !dodged && rollCritical(enemy.stats.criticalChance);
  const power = usesMagic ? enemy.stats.magicPower : enemy.stats.attack;
  const rawDamage = (power * (ambush ? 1.35 : special ? 1.15 : 1) + (usesMagic ? 6 : 0)) * (weakened ? 0.8 : 1);
  const defense = usesMagic ? hero.stats.magicDefense : hero.stats.defense * (ambush ? 0.5 : 1);
  const mitigated = calculateDamageTaken(rawDamage, defense, hero.defending);
  const damage = dodged ? 0 : takeBerserkDamage(hero, critical ? applyCriticalDamage(mitigated, enemy.stats.criticalDamage) : mitigated, !usesMagic, true);
  hero.stats.hp = Math.max(0, hero.stats.hp - damage);
  hero.isAlive = hero.stats.hp > 0;
  // A missed hit preserves a defensive stance until an actual hit lands.
  if (!dodged) hero.defending = false;
  if (regionalSpecial && !dodged && hero.isAlive) {
    if (regionAbility!.effect === "Quebra-osso") hero.skillLockedTurns = 2;
    else hero.ongoingDamage = { damage: Math.max(1, Math.floor(enemy.stats.magicPower * .2)), turns: 3, name: regionAbility!.effect };
  }
  const event: BattleEvent = {
    actorId: enemy.id, targetId: hero.id, action: usesMagic ? "CAST_MAGIC" : "ATTACK",
    damage, critical, dodged,
    ...(ability ? { special: ability } : {}),
    message: dodged ? `${prefix}${hero.name} esquivou de ${ability ?? "ataque"} de ${enemy.name}.`
      : `${prefix}${critical ? "CRITICO! " : ""}${enemy.name} usou ${ability ?? "ataque básico"} e causou ${damage} de dano.`,
  };
  if (regionalSpecial && !dodged && hero.isAlive) event.message += regionAbility!.effect === "Quebra-osso"
    ? " Habilidades bloqueadas por duas ações." : ` ${regionAbility!.effect} por três ações.`;
  return { ...state, hero, enemy, finished: !hero.isAlive,
    ...(!hero.isAlive ? { winnerId: enemy.id } : {}), turnOwnerId: !hero.isAlive ? enemy.id : null, lastEvent: event };
}

/** Damage effects advance once per accepted hero action, never on rejected commands. */
export function tickHeroDamage(hero: CombatantState): string {
  const effect = hero.ongoingDamage;
  if (!effect || effect.turns <= 0) return "";
  if (hero.berserk) hero.berserk = { ...hero.berserk };
  const damage = Math.min(hero.stats.hp, takeBerserkDamage(hero, effect.damage, false, false));
  hero.stats.hp = Math.max(0, hero.stats.hp - damage);
  hero.isAlive = hero.stats.hp > 0;
  if (effect.turns > 1) hero.ongoingDamage = { ...effect, turns: effect.turns - 1 };
  else delete hero.ongoingDamage;
  return `${effect.name} causou ${damage} de dano. `;
}
