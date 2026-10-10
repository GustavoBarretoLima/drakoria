import { POTIONS, isPotionId, type PotionId } from "../../../shared/src/items/potions.js";
import { loadConsumables, loadHeroVitals, saveHeroVitals } from "../battle/heroVitals.js";
import { getCurrentHeroStats, syncCharacterVitals } from "../progression/heroStats.js";
import { loadProgress, saveProgress } from "../progression/progressionClient.js";
import { buyPotion } from "../progression/shopClient.js";

const TAVERN_REST_COST = 20;
type EstablishmentId = "taberna" | "ferreiro" | "guilda";

const establishmentIds: EstablishmentId[] = ["taberna", "ferreiro", "guilda"];

declare global {
  interface Window {
    carregarFerreiro?: () => void;
    carregarGuilda?: () => void;
  }
}

function getPanel(id: EstablishmentId): HTMLElement | null {
  return document.getElementById(id);
}

function hideInteriors(): void {
  for (const id of establishmentIds) {
    const panel = getPanel(id);
    if (panel) panel.style.display = "none";
  }
}

function squareUrl(): string {
  return `${import.meta.env.BASE_URL}pages/praca.html`;
}

function renderTavernStatus(message = ""): void {
  const status = document.getElementById("tabernaDescansoStatus");
  if (!status) return;

  syncCharacterVitals();
  const stats = getCurrentHeroStats();
  const vitals = loadHeroVitals(stats.maxHp, stats.maxMana);
  const progress = loadProgress();
  const consumables = loadConsumables();
  const resources = `HP ${vitals.hp}/${vitals.maxHp} • Mana ${vitals.mana}/${vitals.maxMana}`;

  status.textContent = `${message ? `${message} ` : ""}${resources} • Ouro: ${Math.max(0, Math.floor(progress.ouro))} • Poções HP: ${consumables.healthPotion} • Poções Mana: ${consumables.manaPotion}`;
}

function restAtTavern(): void {
  syncCharacterVitals();
  const stats = getCurrentHeroStats();
  const vitals = loadHeroVitals(stats.maxHp, stats.maxMana);
  const progress = loadProgress();
  const gold = Math.max(0, Math.floor(progress.ouro));

  if (vitals.hp >= vitals.maxHp && vitals.mana >= vitals.maxMana) {
    renderTavernStatus("Você já está com HP e mana completos.");
    return;
  }
  if (gold < TAVERN_REST_COST) {
    renderTavernStatus(`Você precisa de ${TAVERN_REST_COST} moedas de ouro para descansar.`);
    return;
  }

  progress.ouro = gold - TAVERN_REST_COST;
  saveProgress(progress);
  saveHeroVitals({ ...vitals, hp: vitals.maxHp, mana: vitals.maxMana });
  renderTavernStatus("Você descansou e recuperou completamente HP e mana.");
}

function buyTavernPotion(id: PotionId): void {
  const message = buyPotion(id);
  renderTavernStatus(message ?? `${POTIONS[id].name} comprada.`);
}

function openTavern(): void {
  const panel = getPanel("taberna");
  if (!panel) return;
  panel.style.display = "block";
  panel.innerHTML = `
    <div class="taberna-interior">
      <h2>🍺 Bem-vindo à Taberna</h2>
      <p>O aroma de cerveja e carne assada preenche o ar, enquanto bardos cantam histórias de heróis e dragões.</p>
      <p>Descanse antes de uma nova expedição. O descanso custa <strong>${TAVERN_REST_COST} moedas de ouro</strong> e restaura totalmente HP e mana.</p>
      <p id="tabernaDescansoStatus" role="status" aria-live="polite"></p>
      <button type="button" data-establishment-action="rest">🛏️ Descansar — ${TAVERN_REST_COST} ouro</button>
      <div class="taberna-loja-pocoes">
        <h3>🧪 Poções</h3>
        <p><a href="praca.html?loja=1">Ver todas as poções e preços na Loja da Praça</a></p>
        <p>Compre suprimentos para usar entre as batalhas da dungeon.</p>
        <button type="button" data-establishment-action="buy-potion" data-potion-id="healthPotion">❤️ ${POTIONS.healthPotion.name} — ${POTIONS.healthPotion.price} ouro</button>
        <button type="button" data-establishment-action="buy-potion" data-potion-id="manaPotion">💧 ${POTIONS.manaPotion.name} — ${POTIONS.manaPotion.price} ouro</button>
        <p><small>${POTIONS.healthPotion.detail}. ${POTIONS.manaPotion.detail}.</small></p>
      </div>
      <button class="btn-voltar" type="button" data-establishment-action="back-square">⬅ Voltar à Praça</button>
    </div>
  `;
  renderTavernStatus();
}

function openEstablishment(id: EstablishmentId): void {
  hideInteriors();
  if (id === "taberna") openTavern();
  else if (id === "ferreiro") window.carregarFerreiro?.();
  else window.carregarGuilda?.();
}

function currentEstablishment(): EstablishmentId | null {
  const hash = window.location.hash.slice(1);
  return establishmentIds.includes(hash as EstablishmentId) ? (hash as EstablishmentId) : null;
}

function syncFromHash(): void {
  const id = currentEstablishment();
  hideInteriors();
  if (id) openEstablishment(id);
}

function navigateTo(id: EstablishmentId): void {
  if (window.location.hash === `#${id}`) openEstablishment(id);
  else window.location.hash = id;
}

document.addEventListener("click", event => {
  const target = event.target as Element | null;
  const hotspot = target?.closest<HTMLElement>("[data-establishment-target]");
  if (hotspot) {
    const id = hotspot.dataset.establishmentTarget;
    if (id && establishmentIds.includes(id as EstablishmentId)) navigateTo(id as EstablishmentId);
    return;
  }

  const action = target?.closest<HTMLButtonElement>("[data-establishment-action]");
  if (!action) return;
  if (action.dataset.establishmentAction === "rest") restAtTavern();
  else if (action.dataset.establishmentAction === "back-square") window.location.href = squareUrl();
  else if (action.dataset.establishmentAction === "buy-potion") {
    const id = action.dataset.potionId;
    if (isPotionId(id)) buyTavernPotion(id);
  }
});

document.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target as HTMLElement | null;
  const hotspot = target?.closest<HTMLElement>("[data-establishment-target]");
  if (!hotspot) return;
  event.preventDefault();
  const id = hotspot.dataset.establishmentTarget;
  if (id && establishmentIds.includes(id as EstablishmentId)) navigateTo(id as EstablishmentId);
});

window.addEventListener("DOMContentLoaded", syncFromHash);
window.addEventListener("hashchange", syncFromHash);
