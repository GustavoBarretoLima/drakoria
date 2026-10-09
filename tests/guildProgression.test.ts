import assert from "node:assert/strict";
import { QUESTS,GUILD_RANKS,guildStanding,questReputation,questBlockReason,normalizeQuests,questTracker,advanceQuestVictory } from "../shared/src/quests/regionalQuests.js";
import { acceptQuest,claimQuest,loadQuests,trackQuest,trackedQuest,recordQuestVictory } from "../client/src/progression/questClient.js";
import { createInitialBattleState } from "../server/src/modules/combat/battleRoom.js";
import { WORLD_REGIONS } from "../shared/src/dungeons/worldRegions.js";
const saved=new Map<string,string>();
Object.assign(globalThis,{localStorage:{getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)}});
saved.set("classeHeroi","guerreiro");saved.set("drakoriaProgresso",'{"nivel":55,"ouro":0}');
assert.equal(guildStanding(loadQuests()).rank,"F");
assert.equal(guildStanding(loadQuests()).reputation,0);
assert.ok(acceptQuest("pantano-corrompido-hunt")?.includes("rank E"));
assert.equal(acceptQuest("cemiterio-esquecido-hunt"),null);
assert.equal(acceptQuest("cemiterio-esquecido-collect"),null);
trackQuest("cemiterio-esquecido-hunt");assert.equal(trackedQuest()?.quest.kind,"hunt");
trackQuest("fake");assert.equal(trackedQuest()?.quest.kind,"hunt");
assert.equal(questTracker(normalizeQuests({})),null);
// Reputation alone never replaces the promotion boss.
const rich=normalizeQuests({entries:{"cemiterio-esquecido-hunt":{status:"claimed",count:5,claims:100}}});
assert.equal(guildStanding(rich).rank,"F");
assert.ok(questBlockReason(QUESTS.find(q=>q.id==="pantano-corrompido-hunt")!,rich,55));
let index=0;
for(const [region,{config}] of Object.entries(WORLD_REGIONS)){
 const id=`${region}-boss`;
 assert.equal(acceptQuest(id),null);
 const state=createInitialBattleState("guerreiro",`${config.bossMonster}-boss-lvl-${config.bossLevel}`,[],55);
 state.id=`promotion-${index}`;
 state.finished=true;state.winnerId=state.enemy.id;recordQuestVictory(state);
 assert.equal(loadQuests().entries[id]!.count,0);
 state.winnerId=state.hero.id;recordQuestVictory(state);recordQuestVictory(state);
 assert.equal(loadQuests().entries[id]!.count,1);
 assert.equal(guildStanding(loadQuests()).rank,GUILD_RANKS[index]!.name);
 assert.equal(claimQuest(id),null);
 const standing=guildStanding(loadQuests());
 assert.equal(standing.rank,GUILD_RANKS[++index]!.name);
 assert.equal(standing.reputation,GUILD_RANKS[index]!.reputation);
 assert.ok(claimQuest(id));assert.equal(guildStanding(loadQuests()).reputation,standing.reputation);
}
assert.equal(guildStanding(loadQuests()).next,undefined);
assert.equal(guildStanding(loadQuests()).promotion,undefined);
// Old delivered saves with no claims counter retain their rank and all other progress.
const legacy=normalizeQuests({entries:Object.fromEntries(QUESTS.filter(q=>q.kind==="boss").map(q=>[q.id,{status:"claimed",count:1}]))});
assert.equal(guildStanding(legacy).rank,"A");assert.equal(guildStanding(legacy).reputation,700);
assert.equal(guildStanding(normalizeQuests({entries:{"fortaleza-rei-orc-boss":{status:"claimed",count:1,claims:1}}})).rank,"F");
// Active contracts accepted before rank gating remain playable.
const oldActive=normalizeQuests({entries:{"fortaleza-rei-orc-hunt":{status:"active",count:2,claims:0}}});
const advanced=advanceQuestVictory(oldActive,"legacy-active","hobgoblin-normal-lvl-35",0);
assert.equal(advanced.entries["fortaleza-rei-orc-hunt"]!.count,3);
assert.equal(questTracker(advanced,"missing")?.quest.id,"fortaleza-rei-orc-hunt");
const ready=normalizeQuests({entries:{"cemiterio-esquecido-hunt":{status:"active",count:5,claims:0}}});
saved.set("drakoriaQuests",JSON.stringify(ready));assert.equal(trackedQuest()?.ready,true);
assert.equal(claimQuest("cemiterio-esquecido-hunt"),null);assert.equal(trackedQuest(),null);
assert.equal(guildStanding(loadQuests()).reputation,questReputation(QUESTS[0]!));
assert.equal(acceptQuest("cemiterio-esquecido-hunt"),null);
assert.equal(guildStanding(loadQuests()).reputation,10);assert.equal(trackedQuest()?.count,0);
// Legacy repeatable claims must not lose earned reputation when accepted again.
saved.set("drakoriaQuests",JSON.stringify({entries:{"cemiterio-esquecido-collect":{status:"claimed",count:3}}}));
assert.equal(guildStanding(loadQuests()).reputation,8);
assert.equal(acceptQuest("cemiterio-esquecido-collect"),null);
assert.equal(guildStanding(loadQuests()).reputation,8);
assert.equal(loadQuests().entries["cemiterio-esquecido-collect"]!.claims,1);
console.log("Guild ranks: F–A promotions, reputation, gates, repeat claims, legacy saves, defeat/duplicate rejection and tracker passed.");
