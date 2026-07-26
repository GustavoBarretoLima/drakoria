import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderStatus(state: BattleState) {
  const heroHpBar = document.getElementById("hpHeroiBar");
  const heroManaBar = document.getElementById("manaHeroiBar");
  const enemyHpBar = document.getElementById("hpInimigoBar");

  const heroHpPercent = (state.hero.stats.hp / state.hero.stats.maxHp) * 100;
  const heroManaPercent =
    state.hero.stats.maxMana > 0
      ? (state.hero.stats.mana / state.hero.stats.maxMana) * 100
      : 0;
  const enemyHpPercent = (state.enemy.stats.hp / state.enemy.stats.maxHp) * 100;

  if (heroHpBar) heroHpBar.style.width = `${Math.max(heroHpPercent, 0)}%`;
  if (heroManaBar) heroManaBar.style.width = `${Math.max(heroManaPercent, 0)}%`;
  if (enemyHpBar) enemyHpBar.style.width = `${Math.max(enemyHpPercent, 0)}%`;

  const heroHpText = document.getElementById("hpHeroiTexto");
  const heroManaText = document.getElementById("manaHeroiTexto");
  const enemyHpText = document.getElementById("hpInimigoTexto");

  if (heroHpText) {
    heroHpText.textContent = `${state.hero.stats.hp}/${state.hero.stats.maxHp}`;
  }

  if (heroManaText) {
    heroManaText.textContent = `${state.hero.stats.mana}/${state.hero.stats.maxMana}`;
  }

  if (enemyHpText) {
    enemyHpText.textContent = `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}`;
  }

  const heroName = document.getElementById("nomeHeroi");
  const heroClass = document.getElementById("classeHeroi");
  const enemyName = document.getElementById("nomeInimigo");

  if (heroName) heroName.textContent = state.hero.name;
  if (heroClass) {
    heroClass.textContent =
      localStorage.getItem("classeHeroiTexto") || state.hero.className || "";
  }
  if (enemyName) enemyName.textContent = state.enemy.name;
}
