import { WORLD_REGIONS,type WorldRegionId } from "../dungeons/worldRegions.js";
export interface QuestDefinition{id:string;region:WorldRegionId;name:string;description:string;kind:"hunt"|"collect"|"boss";target:number;repeatable:boolean;level:number;requires?:string;xp:number;gold:number;gear?:number;}
export const QUESTS:QuestDefinition[]=[];
const regions=Object.entries(WORLD_REGIONS) as [WorldRegionId,typeof WORLD_REGIONS[WorldRegionId]][];
regions.forEach(([region,{config}],index)=>{
 QUESTS.push({id:`${region}-hunt`,region,name:`Patrulha: ${config.label}`,description:"Derrote cinco monstros comuns ou elites da região.",kind:"hunt",target:5,repeatable:true,level:config.minLevel,xp:Math.max(60,Math.floor(100*1.25**(config.minLevel-1)*.2)),gold:20*(index+1)});
 QUESTS.push({id:`${region}-collect`,region,name:`Suprimentos: ${config.label}`,description:"Obtenha três equipamentos como drops em vitórias na região. Itens ficam com você; drops anteriores à aceitação não contam.",kind:"collect",target:3,repeatable:true,level:config.minLevel,xp:Math.max(40,Math.floor(100*1.25**(config.minLevel-1)*.15)),gold:15*(index+1)});
 QUESTS.push({id:`${region}-boss`,region,name:`Derrote ${config.bossName}`,description:`Derrote ${config.bossName} no nível regional ${config.bossLevel}. Entregue esta missão para seguir a campanha.`,kind:"boss",target:1,repeatable:false,level:config.minLevel,...(index?{requires:`${regions[index-1]![0]}-boss`}:{}),xp:Math.floor(100*1.25**(config.bossLevel!-1)*.6),gold:60*(index+1),gear:config.bossLevel!});
});
export interface QuestEntry{count:number;status:"active"|"claimed";claims:number;}
export interface QuestProgress{entries:Record<string,QuestEntry>;seenBattles:string[];}
export function normalizeQuests(raw:unknown):QuestProgress{
 const result:QuestProgress={entries:{},seenBattles:[]};if(!raw||typeof raw!=="object")return result;
 const obj=raw as Partial<QuestProgress>;
 for(const quest of QUESTS){const entry=obj.entries?.[quest.id];if(!entry||!(entry.status==="active"||entry.status==="claimed"))continue;
 result.entries[quest.id]={count:Math.min(quest.target,Math.max(0,Number.isFinite(entry.count)?Math.floor(entry.count):0)),status:entry.status,claims:Math.max(0,Number.isFinite(entry.claims)?Math.floor(entry.claims):0)};}
 if(Array.isArray(obj.seenBattles))result.seenBattles=[...new Set(obj.seenBattles.filter(id=>typeof id==="string"))];return result;
}
export function questBlockReason(q:QuestDefinition,p:QuestProgress,level:number):string|null{
 if(level<q.level)return `Requer nível ${q.level}`;
 if(q.requires&&p.entries[q.requires]?.status!=="claimed")return "Entregue a missão do boss da região anterior";
 const entry=p.entries[q.id];if(entry?.status==="active")return "Missão já aceita";if(entry?.status==="claimed"&&!q.repeatable)return "Missão concluída";return null;
}
export function advanceQuestVictory(progress:QuestProgress,battleId:string,monsterId:string,dropCount:number):QuestProgress{
 const next=normalizeQuests(progress);if(!battleId||next.seenBattles.includes(battleId))return next;
 next.seenBattles.push(battleId);
 for(const q of QUESTS){const entry=next.entries[q.id];if(entry?.status!=="active")continue;
 const config=WORLD_REGIONS[q.region].config;
 const boss=monsterId===`${config.bossMonster}-boss-lvl-${config.bossLevel}`;
 const level=Number(monsterId.match(/-lvl-(\d+)$/)?.[1]);
 const common=level>=config.minLevel&&level<=config.maxLevel&&config.monsters.some(type=>monsterId.startsWith(`${type}-normal-lvl-`)||monsterId.startsWith(`${type}-elite-lvl-`));
 const increase=q.kind==="boss"?Number(boss):q.kind==="hunt"?Number(common):(boss||common)?Math.max(0,Number.isFinite(dropCount)?Math.floor(dropCount):0):0;
 entry.count=Math.min(q.target,entry.count+increase);
 }return next;
}
