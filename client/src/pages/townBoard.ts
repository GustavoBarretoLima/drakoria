import { POTION_ICONS } from "../ui/potionIcons.js";
import { QUESTS,questBlockReason,guildStanding,questReputation,questRankIndex,GUILD_RANKS } from "../../../shared/src/quests/regionalQuests.js";
import { WORLD_REGIONS } from "../../../shared/src/dungeons/worldRegions.js";
import { POTIONS,type PotionId } from "../../../shared/src/items/potions.js";
import { loadQuests,acceptQuest,claimQuest,trackQuest,trackedQuest } from "../progression/questClient.js";
import { loadProgress } from "../progression/progressionClient.js";
import { buyPotion } from "../progression/shopClient.js";
import { loadConsumables,useCityPotion } from "../battle/heroVitals.js";
import { syncCharacterVitals } from "../progression/heroStats.js";
import { enterWorldRegion } from "../battle/worldMapNavigation.js";
declare global {interface Window {abrirMissoes:()=>void;abrirLoja:()=>void;fecharPainelPraca?:()=>void;}}
const esc=(value:string)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
function panel(){const p=document.getElementById("painelPraca")??document.getElementById("painelGuilda");p?.classList.remove("hidden");return p;}
export function openQuestBoard(message=""):void{
 const p=panel();if(!p)return;const progress=loadProgress(),quests=loadQuests(),guild=guildStanding(quests),tracked=trackedQuest();
 const readyCount=QUESTS.filter(q=>quests.entries[q.id]?.status==="active"&&quests.entries[q.id]!.count>=q.target).length;
 const promotion=guild.promotion;
 const promotionReady=promotion&&quests.entries[promotion.id]?.status==="active"&&quests.entries[promotion.id]!.count>=promotion.target;
 const standing=`<section class="guild-standing" aria-label="Rank da Guilda"><h3>Rank ${guild.rank} • Aventureiro</h3><p><strong>${guild.reputation} de reputação</strong>${guild.next?` • Próximo rank: ${guild.next.name} (${guild.next.reputation})`:" • Rank máximo alcançado"}</p>${guild.next?`<progress aria-label="Reputação para o próximo rank" max="${guild.next.reputation}" value="${Math.min(guild.reputation,guild.next.reputation)}"></progress>`:""}<p>${promotion?`Promoção para ${guild.next!.name}: ${promotion.name}. Aceite o contrato de promoção abaixo, vença o boss e entregue na Guilda.`:"Você concluiu todas as promoções da campanha."}</p><p>A promoção exige o contrato de boss entregue e a reputação indicada. Contratos de caça e coleta também concedem reputação.</p>${promotionReady?`<button data-claim="${promotion!.id}">Entregar promoção • Rank ${guild.next!.name}</button>`:""}</section>`;
 p.innerHTML=`<section class="town-board"><div class="panel-header"><div><span class="panel-kicker">Guilda dos Aventureiros</span><h2>Quadro de Missões</h2></div><strong>Nível ${progress.nivel}</strong></div>${standing}<p class="guild-deliveries" role="status">${readyCount?`${readyCount} missão(ões) pronta(s) para entregar. Recompensas destacadas abaixo.`:"Nenhuma recompensa pendente. Aceite um contrato para começar."}</p><p>Aceite antes de explorar. Entregue recompensas na guilda. Bosses conduzem a campanha; contratos de caça e coleta podem ser aceitos novamente após a entrega.</p><p role="status" aria-live="polite">${esc(message)}</p>${Object.entries(WORLD_REGIONS).map(([id,{config}])=>`<section><h3>${config.label} • Nv. ${config.minLevel}–${config.maxLevel}</h3><div class="town-card-grid">${QUESTS.filter(q=>q.region===id).map(q=>{
 const entry=quests.entries[q.id],block=questBlockReason(q,quests,progress.nivel),ready=entry?.status==="active"&&entry.count>=q.target;
 return `<article class="town-card ${ready?"quest-ready":""}"><span>Rank ${GUILD_RANKS[questRankIndex(q)]!.name} • ${q.repeatable?"Contrato repetível":"Promoção • única"}</span><h4>${q.name}</h4><p>${q.description}</p><p><strong>${entry?.status==="active"?`${entry.count}/${q.target}`:entry?.status==="claimed"?"Entregue":"Não aceita"}</strong>${entry?.claims?` • Entregas: ${entry.claims}`:""}</p><p>Recompensa: ${q.xp} XP • ${q.gold} ouro • +${questReputation(q)} reputação${q.gear?` • Arma épica Nv.${q.gear} da sua classe`:""}</p>${ready?`<button data-claim="${q.id}">Receber recompensa${q.kind==="boss"?" e promover rank":""}</button>`:entry?.status==="active"?`<button data-explore="${id}">Explorar região</button>`:`<button data-accept="${q.id}" ${block?"disabled":""}>${block??(entry?.claims?"Aceitar novamente":"Aceitar missão")}</button>`}${entry?.status==="active"?`<button data-track="${q.id}" aria-pressed="${tracked?.quest.id===q.id}">${tracked?.quest.id===q.id?"Acompanhando na exploração":"Acompanhar na exploração"}</button>`:""}</article>`;
 }).join("")}</div></section>`).join("")}<div class="painel-acoes"><button data-close>Fechar</button></div></section>`;
 p.querySelectorAll<HTMLButtonElement>("[data-track]").forEach(b=>b.addEventListener("click",()=>{trackQuest(b.dataset.track!);openQuestBoard("Missão acompanhada na exploração.");}));
 p.querySelectorAll<HTMLButtonElement>("[data-accept]").forEach(b=>b.addEventListener("click",()=>openQuestBoard(acceptQuest(b.dataset.accept!)??"Missão aceita.")));
 p.querySelectorAll<HTMLButtonElement>("[data-claim]").forEach(b=>b.addEventListener("click",()=>{const result=claimQuest(b.dataset.claim!);syncCharacterVitals();openQuestBoard(result??"Recompensa recebida!");}));
 p.querySelectorAll<HTMLButtonElement>("[data-explore]").forEach(b=>b.addEventListener("click",()=>{if(enterWorldRegion(localStorage,b.dataset.explore!))window.location.href=`${import.meta.env.BASE_URL}pages/batalha.html`;else openQuestBoard("Recupere vida antes de explorar.");}));
 p.querySelector("[data-close]")?.addEventListener("click",()=>window.fecharPainelPraca?.());
}
export function openPotionShop(message=""):void{
 const p=panel();if(!p)return;const progress=loadProgress(),inventory=loadConsumables();syncCharacterVitals();
 p.innerHTML=`<section class="town-board"><div class="panel-header"><div><span class="panel-kicker">Loja da Praça</span><h2>Poções e suprimentos</h2></div><strong>${progress.ouro} ouro</strong></div><p>Compre uma unidade por vez. Curativos e poções de atributos são usados em combate. Apenas um bônus de poção pode ficar ativo; dura três ações suas, sem acumular. Poções de mana não restauram Fúria.</p><p role="status" aria-live="polite">${esc(message)}</p><div class="town-card-grid">${(Object.keys(POTIONS) as PotionId[]).map(id=>{
 const item=POTIONS[id],count=inventory[id]??0,city=!("buff" in item||"cleanse" in item);
 return `<article class="town-card potion-shop-card"><img class="potion-shop-icon" src="${POTION_ICONS[id]}" alt="" width="96" height="96" /><h3>${item.name}</h3><p>${item.detail}</p><p><strong>${item.price} ouro</strong> • Na mochila: ${count}</p><button data-buy="${id}" ${progress.ouro<item.price||count>=9999?"disabled":""}>Comprar • ${item.price} ouro</button>${city?`<button data-drink="${id}" ${count?"":"disabled"}>Usar agora</button>`:"<small>Uso no menu Itens da batalha.</small>"}</article>`;
 }).join("")}</div><div class="painel-acoes"><button data-close>Fechar</button></div></section>`;
 p.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach(b=>b.addEventListener("click",()=>openPotionShop(buyPotion(b.dataset.buy!)??"Poção comprada.")));
 p.querySelectorAll<HTMLButtonElement>("[data-drink]").forEach(b=>b.addEventListener("click",()=>{const result=useCityPotion(b.dataset.drink as PotionId);openPotionShop(result.used?"Recursos recuperados.":"Sem recursos a recuperar; poção preservada.");}));
 p.querySelector("[data-close]")?.addEventListener("click",()=>window.fecharPainelPraca?.());
}
// Classic city scripts assign their placeholders first; modules replace them after parsing.
if(typeof window!=="undefined")window.addEventListener("DOMContentLoaded",()=>{window.abrirMissoes=()=>openQuestBoard();window.abrirLoja=()=>openPotionShop();
 const params=new URLSearchParams(window.location.search);if(params.has("loja"))openPotionShop();else if(params.has("guilda")||params.has("missoes"))window.location.replace(`${import.meta.env.BASE_URL}pages/estabelecimentos.html#guilda`);});
