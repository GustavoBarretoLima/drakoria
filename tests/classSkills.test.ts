import assert from "node:assert/strict";
import { CLASS_SKILLS, getClassSkills, getSkill, getSkillBlockReason, getSkillCooldown, type SkillId } from "../shared/src/combat/classSkills.js";
import { isBattleAction, type BattleAction } from "../shared/src/combat/actions.js";
import { applyBattleAction, applyEnemyTurn } from "../shared/src/combat/combatEngine.js";
import { applyBattleAction as serverAction } from "../server/src/modules/combat/combatEngine.js";
import { advanceBattleAtb } from "../shared/src/combat/atb.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { createDemoMonster } from "../client/src/demo/demoMonsters.js";
import { renderSkills } from "../client/src/ui/renderSkills.js";
import type { BattleState, HeroClass } from "../shared/src/types/combat.js";

function battle(heroClass: HeroClass = "guerreiro", level = 10): BattleState {
  const state = createInitialBattleState(heroClass, "hobgoblin-elite-lvl-10", [], level);
  state.turnOwnerId = state.hero.id;
  state.hero.atb = 100;
  state.hero.stats.mana = 100;
  state.hero.stats.attack = 40;
  state.hero.stats.magicPower = 60;
  state.hero.stats.criticalChance = 0;
  state.hero.stats.criticalDamage = heroClass === "arqueiro" ? 75 : 50;
  state.enemy.stats.defense = 20;
  state.enemy.stats.magicDefense = 40;
  state.enemy.stats.dodgeChance = 0;
  state.enemy.stats.hp = state.enemy.stats.maxHp = 10000;
  state.enemy.atb = 80;
  return state;
}
function use(state: BattleState, skillId: SkillId) {
  return applyBattleAction(state, { type: "USE_SKILL", skillId });
}
function act(state: BattleState, action: BattleAction = { type: "DEFEND" }) {
  return applyBattleAction({ ...state, turnOwnerId: state.hero.id }, action);
}
function sequence(values: number[]) {
  let index = 0;
  Math.random = () => { assert.ok(index < values.length, "unexpected extra roll"); return values[index++]!; };
  return () => index;
}

const originalRandom = Math.random;
try {
  Math.random = () => 0.5;
  assert.equal(CLASS_SKILLS.length, 9);
  assert.equal(new Set(CLASS_SKILLS.map(s => s.id)).size, 9);
  for (const heroClass of ["guerreiro", "mago", "arqueiro"] as const) {
    const skills = getClassSkills(heroClass);
    assert.equal(skills.length, 3);
    assert.deepEqual(skills.map(s => s.unlockLevel), [1, 5, 10]);
    for (const skill of skills) {
      for (const level of [1, 4, 5, 9, 10, 100]) {
        const state = battle(heroClass, level);
        const result = use(state, skill.id);
        if (level < skill.unlockLevel) {
          assert.equal(result, state);
          assert.equal(getSkillBlockReason(state.hero, skill), `Desbloqueia no nível ${skill.unlockLevel}`);
        } else {
          assert.notEqual(result, state);
          assert.equal(result.hero.stats.mana, state.hero.stats.mana - skill.manaCost);
          assert.equal(result.hero.atb, 0);
          assert.equal(result.turnOwnerId, null);
          assert.equal(result.lastEvent?.skillId, skill.id);
          assert.equal(result.lastEvent?.special, skill.name);
          assert.equal(getSkillCooldown(result.hero, skill.id), skill.cooldown);
          assert.deepEqual(serverAction(state, { type: "USE_SKILL", skillId: skill.id }), result);
          assert.equal(state.hero.stats.mana, 100);
          assert.equal(state.enemy.stats.hp, 10000);
          assert.equal(state.hero.skillCooldowns, undefined);
          let cooling = result;
          for (let remaining = skill.cooldown; remaining > 0; remaining--) {
            assert.equal(use({ ...cooling, turnOwnerId: cooling.hero.id }, skill.id).hero.stats.mana, cooling.hero.stats.mana);
            const cooldownSnapshot = structuredClone(cooling.hero.skillCooldowns);
            cooling = act(cooling);
            assert.equal(getSkillCooldown(cooling.hero, skill.id), remaining - 1);
            assert.equal(getSkillCooldown(result.hero, skill.id), skill.cooldown);
            assert.ok(cooldownSnapshot);
          }
          assert.equal(getSkillBlockReason(cooling.hero, skill), null);
        }
      }
    }
  }
  const warrior = battle();
  assert.equal(use(warrior, "warrior-cleave").lastEvent!.damage, 58); // floor(10 + 40 * 1.45) - 10
  assert.equal(use(warrior, "warrior-breaker").lastEvent!.damage, 57); // 10 + 52 - 5
  const guarded = use(warrior, "warrior-guard");
  assert.equal(guarded.hero.defending, true);
  const enemyTurn = { ...guarded, turnOwnerId: guarded.enemy.id };
  const defendingHit = applyEnemyTurn({ ...enemyTurn, enemy: { ...enemyTurn.enemy, specialCooldown: 2 }, hero: { ...enemyTurn.hero, stats: { ...enemyTurn.hero.stats, dodgeChance: 0 } } });
  const unguardedHit = applyEnemyTurn({ ...enemyTurn, enemy: { ...enemyTurn.enemy, specialCooldown: 2 }, hero: { ...enemyTurn.hero, defending: false, stats: { ...enemyTurn.hero.stats, dodgeChance: 0 } } });
  assert.equal(defendingHit.lastEvent!.damage, Math.floor(unguardedHit.lastEvent!.damage! / 2));
  const mage = battle("mago");
  assert.equal(use(mage, "mage-bolt").lastEvent!.damage, 79); // 18 + 81 - 20
  const physicalBuff = structuredClone(mage); physicalBuff.hero.stats.attack += 100;
  assert.equal(use(physicalBuff, "mage-bolt").lastEvent!.damage, use(mage, "mage-bolt").lastEvent!.damage);
  const magicalBuff = structuredClone(warrior); magicalBuff.hero.stats.magicPower += 100;
  assert.equal(use(magicalBuff, "warrior-cleave").lastEvent!.damage, use(warrior, "warrior-cleave").lastEvent!.damage);
  const frost = use(mage, "mage-frost");
  assert.equal(frost.enemy.atb, 0);
  assert.equal(mage.enemy.atb, 80);
  const mageDodged = structuredClone(mage); mageDodged.enemy.stats.dodgeChance = 50;
  Math.random = () => 0;
  assert.equal(use(mageDodged, "mage-frost").enemy.atb, 80);
  const guardDodged = structuredClone(warrior); guardDodged.enemy.stats.dodgeChance = 50;
  const guardMiss = use(guardDodged, "warrior-guard");
  assert.equal(guardMiss.hero.defending, true);
  assert.equal(guardMiss.lastEvent!.dodged, true);
  assert.equal(guardMiss.lastEvent!.damage, 0);
  assert.equal(guardMiss.hero.stats.mana, 92);
  assert.ok(guardMiss.lastEvent!.message.includes("postura defensiva"));
  const archer = battle("arqueiro");
  Math.random = () => 0.19;
  assert.equal(use(archer, "archer-aim").lastEvent!.critical, true);
  Math.random = () => 0.2;
  assert.equal(use(archer, "archer-aim").lastEvent!.critical, false);
  Math.random = () => 0.5;
  assert.equal(use(archer, "archer-pierce").lastEvent!.damage, 59);
  assert.equal(use(archer, "archer-volley").lastEvent!.damage, 68);
  const volley = structuredClone(archer);
  volley.enemy.stats.dodgeChance = 50;
  volley.enemy.defending = true;
  volley.hero.stats.criticalChance = 20;
  const rolls = sequence([0, 0.9, 0.1, 0.5]); // first arrow dodged; second critical
  const partial = use(volley, "archer-volley");
  assert.equal(rolls(), 4);
  assert.equal(partial.lastEvent!.hits, 2);
  assert.equal(partial.lastEvent!.dodged, false);
  assert.equal(partial.lastEvent!.critical, true);
  assert.equal(partial.lastEvent!.damage, 29); // (10 + 34 - 10)/2, then +75%
  assert.equal(partial.enemy.defending, false);
  sequence([0, 0]);
  const totalMiss = use(volley, "archer-volley");
  assert.equal(totalMiss.lastEvent!.dodged, true);
  assert.equal(totalMiss.enemy.defending, true);
  assert.equal(getSkillCooldown(totalMiss.hero, "archer-volley"), 3);
  Math.random = () => 0.5;
  const lethal = structuredClone(archer); lethal.enemy.stats.hp = 1;
  const victory = use(lethal, "archer-volley");
  assert.equal(victory.lastEvent!.hits, 1);
  assert.equal(victory.finished, true);
  assert.equal(victory.winnerId, lethal.hero.id);
  assert.equal(victory.enemy.stats.hp, 0);

  // Invalid payloads and unavailable skills cannot consume a turn or cooldown.
  for (const payload of [null, undefined, [], {}, { type: "USE_SKILL" }, { type: "USE_SKILL", skillId: "unknown" }, { type: "ATTACK_BAD" }]) {
    assert.equal(isBattleAction(payload), false);
    assert.equal(applyBattleAction(warrior, payload as BattleAction), warrior);
  }
  assert.equal(use(warrior, "mage-bolt"), warrior);
  const noMana = structuredClone(warrior); noMana.hero.stats.mana = 5;
  assert.equal(use(noMana, "warrior-cleave"), noMana);
  const busy = structuredClone(warrior); busy.hero.skillCooldowns = { "warrior-cleave": 1 };
  assert.equal(use(busy, "warrior-cleave"), busy);
  const notReady = { ...warrior, turnOwnerId: null }; assert.equal(use(notReady, "warrior-cleave"), notReady);
  const finished = { ...warrior, finished: true }; assert.equal(use(finished, "warrior-cleave"), finished);
  const dead = { ...warrior, hero: { ...warrior.hero, isAlive: false } }; assert.equal(use(dead, "warrior-cleave"), dead);
  const tick = advanceBattleAtb({ ...busy, turnOwnerId: null, hero: { ...busy.hero, atb: 0 } });
  assert.equal(getSkillCooldown(tick.hero, "warrior-cleave"), 1);
  const afterEnemy = applyEnemyTurn({ ...busy, turnOwnerId: busy.enemy.id });
  assert.equal(getSkillCooldown(afterEnemy.hero, "warrior-cleave"), 1);
  const twoCooldowns = { ...warrior, hero: { ...warrior.hero, skillCooldowns: { "warrior-guard": 2, "warrior-breaker": 3 } } };
  const basic = act(twoCooldowns, { type: "ATTACK" });
  assert.equal(getSkillCooldown(basic.hero, "warrior-guard"), 1);
  assert.equal(getSkillCooldown(basic.hero, "warrior-breaker"), 2);
  const manaBoundary = structuredClone(warrior); manaBoundary.hero.stats.mana = 6;
  assert.equal(use(manaBoundary, "warrior-cleave").hero.stats.mana, 0);
  assert.equal(getSkill("unknown"), undefined);
  assert.equal(createInitialBattleState().hero.skillCooldowns, undefined);
  const demo = { ...mage, enemy: createDemoMonster("hobgoblin-elite-lvl-10") };
  const backend = { ...mage, enemy: createInitialBattleState("mago", "hobgoblin-elite-lvl-10", [], 10).enemy };
  assert.deepEqual(use(demo, "mage-burst"), use(backend, "mage-burst"));
} finally { Math.random = originalRandom; }

// Minimal DOM harness verifies availability, activation and stable focus targets.
class Element {
  id = ""; type = ""; className = ""; textContent = ""; hidden = false; disabled = false; title = "";
  dataset: Record<string, string> = {}; children: Element[] = [];
  attributes = new Map<string, string>(); listeners = new Map<string, (event: any) => void>();
  append(...children: Element[]) { this.children.push(...children); }
  replaceChildren() { this.children = []; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  addEventListener(key: string, listener: (event: any) => void) { this.listeners.set(key, listener); }
  querySelectorAll(selector: string) { return all(this).filter(el => selector === "button" && el.type === "button"); }
  focus() { documentStub.activeElement = this; this.listeners.get("focus")?.({}); }
  click() { this.listeners.get("click")?.({}); }
}
const panel = new Element(); panel.id = "painelHabilidades";
const container = new Element(); container.id = "habilidadesClasse";
const summary = new Element(); summary.id = "tituloHabilidades";
const detail = new Element(); detail.id = "descricaoHabilidade";
const back = new Element(); back.id = "btnVoltarHabilidades"; back.type = "button";
const launcher = new Element(); launcher.id = "btnHabilidades"; launcher.type = "button";
const commands = new Element(); commands.id = "comandosBatalha"; commands.append(launcher);
const dock = new Element(); dock.id = "battleCommandDock";
panel.append(summary, back, container, detail); dock.append(commands, panel);
function all(element: Element): Element[] { return [element, ...element.children.flatMap(all)]; }
const documentStub = {
  activeElement: null as Element | null,
  getElementById: (id: string) => all(dock).find(element => element.id === id) ?? null,
  createElement: () => new Element(),
};
Object.defineProperty(globalThis, "document", { configurable: true, value: documentStub });
const selected: SkillId[] = [];
const state = battle("guerreiro", 1);
renderSkills(state, id => selected.push(id));
assert.equal(container.children.length, 3);
assert.equal(panel.hidden, true);
launcher.click();
assert.equal(panel.hidden, false);
assert.equal(commands.hidden, true);
assert.equal(launcher.attributes.get("aria-expanded"), "true");
const button = all(panel).find(el => el.id === "skill-warrior-cleave")!;
assert.equal(button.disabled, false);
assert.ok(button.title.includes("6 mana"));
assert.ok(button.attributes.get("aria-describedby")?.includes("skill-detail-warrior-cleave"));
button.click(); assert.deepEqual(selected, ["warrior-cleave"]);
assert.equal(panel.hidden, true);
assert.equal(commands.hidden, false);
assert.equal(documentStub.activeElement, launcher);
launcher.click();
back.click();
assert.equal(panel.hidden, true);
launcher.click();
dock.listeners.get("keydown")?.({ key: "Escape", preventDefault() {} });
assert.equal(panel.hidden, true);
assert.equal(launcher.attributes.get("aria-expanded"), "false");
const locked = all(panel).find(el => el.id === "skill-warrior-breaker")!;
assert.equal(locked.disabled, true); locked.click(); assert.equal(selected.length, 1);
renderSkills({ ...state, hero: { ...state.hero, level: 10, skillCooldowns: { "warrior-cleave": 1 } } }, id => selected.push(id));
assert.equal(all(panel).find(el => el.id === button.id), button);
assert.equal(button.disabled, true);
assert.ok(button.title.includes("Recuperação: 1"));
assert.equal(locked.disabled, false);
launcher.click();
dock.listeners.get("keydown")?.({ key: "End", preventDefault() {} });
assert.equal(documentStub.activeElement, locked);
assert.equal(locked.dataset.selected, "true");
assert.ok(detail.textContent.includes("ignora metade"));
renderSkills({ ...state, turnOwnerId: null }, id => selected.push(id)); assert.equal(button.disabled, true);
renderSkills({ ...state, finished: true }, id => selected.push(id)); assert.equal(locked.disabled, true);
renderSkills({ ...state, hero: { ...state.hero, stats: { ...state.hero.stats, mana: 0 } } }, id => selected.push(id));
assert.ok(button.title.includes("Mana insuficiente"));
renderSkills(battle("mago"), id => selected.push(id));
assert.equal(container.children.length, 3);
assert.equal(all(panel).some(el => el.id === button.id), false);
assert.ok(summary.textContent.includes("Mago"));
console.log("Passed: nine class skills, level gates, costs, cooldowns, damage, effects, rejection, parity and UI availability.");
