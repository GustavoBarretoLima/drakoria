import assert from "node:assert/strict";
import { DUNGEON_CONFIG, pickDungeonEncounter } from "../shared/src/dungeons/dungeonEncounters.js";
import { createDungeonRun, pickDungeonRunEncounter, recordDungeonVictory } from "../shared/src/dungeons/dungeonRun.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { createDemoMonster } from "../client/src/demo/demoMonsters.js";
import { applyBattleAction, applyEnemyTurn } from "../shared/src/combat/combatEngine.js";
import { getClassSkills, getSkillBlockReason } from "../shared/src/combat/classSkills.js";
import { rollMonsterDrops } from "../shared/src/loot/lootTables.js";
import type { BattleState } from "../shared/src/types/combat.js";
const expected = [["cemiterio",1,10,15],["pantano",10,20,25],["floresta",15,30,35],["iniciante",25,35,40],["avancada",35,50,55]] as const;
for (const [key,min,max,bossLevel] of expected) {
 const config = DUNGEON_CONFIG[key]!;
 assert.equal(config.minLevel,min); assert.equal(config.maxLevel,max); assert.equal(config.bossLevel,bossLevel);
 for (const random of [0,.999999]) {
  const encounter = pickDungeonEncounter(config,()=>random);
  assert.equal(encounter.level,random===0 ? min : max);
  assert.deepEqual(createDemoMonster(encounter.monsterId),createInitialBattleState("guerreiro",encounter.monsterId).enemy);
 }
 let run = createDungeonRun(config.id);
 for (let n=0;n<5;n++) run=recordDungeonVictory(config,run,pickDungeonRunEncounter(config,run,()=>0).monsterId);
 const boss = pickDungeonRunEncounter(config,run);
 assert.equal(boss.monsterId,`${config.bossMonster}-boss-lvl-${bossLevel}`);
 assert.deepEqual(createDemoMonster(boss.monsterId),createInitialBattleState("guerreiro",boss.monsterId).enemy);
}
const originalRandom = Math.random;
function enemyAction(state: BattleState) { return applyEnemyTurn({...state,turnOwnerId:state.enemy.id}); }
function heroAction(state: BattleState) { return applyBattleAction({...state,turnOwnerId:state.hero.id},{type:"DEFEND"}); }
try {
 Math.random=()=>.99; // Regional spells are guaranteed once the HP gate/cooldown permit them.
 for (const [id,effect] of [["corruption-hydra-boss-lvl-25","Veneno"],["mutant-wolf-boss-lvl-35","Sangramento"],["orc-warlord-boss-lvl-40","Quebra-osso"],["orc-king-boss-lvl-55","Sangramento"]] as const) {
  const state=createInitialBattleState("guerreiro",id);
  state.hero.stats.hp=state.hero.stats.maxHp=100000; state.hero.stats.dodgeChance=0;
  state.enemy.stats.hp=Math.floor(state.enemy.stats.maxHp*.3)+1;
  assert.equal(enemyAction(state).lastEvent?.special,undefined);
  state.enemy.stats.hp=Math.floor(state.enemy.stats.maxHp*.3);
  const cast=enemyAction(state);
  assert.equal(cast.lastEvent?.action,"CAST_MAGIC"); assert.ok(cast.lastEvent?.special);
  assert.equal(cast.enemy.specialCooldown,2);
  const second=enemyAction(cast), third=enemyAction(second),fourth=enemyAction(third);
  assert.equal(second.lastEvent?.special,undefined); assert.equal(third.lastEvent?.special,undefined); assert.ok(fourth.lastEvent?.special);
  const defended=enemyAction({...state,hero:{...state.hero,defending:true}});
  assert.equal(defended.lastEvent?.damage,Math.floor(cast.lastEvent!.damage!/2));
  if (effect==="Quebra-osso") {
   assert.equal(cast.hero.skillLockedTurns,2);
   const skill=getClassSkills("guerreiro")[0]!;
   const ready={...cast,turnOwnerId:cast.hero.id};
   assert.ok(getSkillBlockReason(ready.hero,skill)?.includes("Quebra-osso"));
   assert.equal(applyBattleAction(ready,{type:"USE_SKILL",skillId:skill.id}),ready);
   const one=heroAction(cast); assert.equal(one.hero.skillLockedTurns,1);
   const two=heroAction(one); assert.equal(two.hero.skillLockedTurns,0);
   assert.ok(!getSkillBlockReason(two.hero,skill)?.includes("Quebra-osso"));
  } else {
   assert.equal(cast.hero.ongoingDamage?.name,effect); assert.equal(cast.hero.ongoingDamage?.turns,3);
   const damage=cast.hero.ongoingDamage!.damage;
   let ticking=cast;
   for (let turn=0;turn<3;turn++) { const hp=ticking.hero.stats.hp; ticking=heroAction(ticking); assert.equal(ticking.hero.stats.hp,hp-damage); }
   assert.equal(ticking.hero.ongoingDamage,undefined);
   const fatal={...cast,hero:{...cast.hero,stats:{...cast.hero.stats,hp:damage}}};
   const death=heroAction(fatal); assert.equal(death.finished,true); assert.equal(death.winnerId,death.enemy.id);
   assert.equal(death.enemy.stats.hp,fatal.enemy.stats.hp);
  }
  Math.random=()=>0; state.hero.stats.dodgeChance=50;
  const miss=enemyAction(state); assert.equal(miss.lastEvent?.dodged,true);
  assert.equal(miss.hero.ongoingDamage,undefined); assert.equal(miss.hero.skillLockedTurns,undefined);
  assert.equal(state.enemy.specialCooldown,undefined); // Shared engine does not mutate the input.
  Math.random=()=>0;
  const drops=rollMonsterDrops(id); assert.equal(drops[0]!.item.level,Number(id.split("-").at(-1)));
  Math.random=()=>.99;
 }
} finally {Math.random=originalRandom;}
console.log("Region levels/boss effects: ranges, progression, demo/server parity, thresholds, 3-round cadence, DOT expiry/death, two-action skill lock and dodge passed.");
