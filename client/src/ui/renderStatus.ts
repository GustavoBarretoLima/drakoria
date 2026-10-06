import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderStatus(state: BattleState) {
  const heroHpBar = document.getElementById("hpHeroiBar");
  const heroManaBar = document.getElementById("manaHeroiBar");
  const heroAtbBar = document.getElementById("atbHeroiBar");
  const enemyHpBar = document.getElementById("hpInimigoBar");
  const enemyAtbBar = document.getElementById("atbInimigoBar");

  const heroHpPercent = (state.hero.stats.hp / state.hero.stats.maxHp) * 100;
  const heroManaPercent =
    state.hero.stats.maxMana > 0
      ? (state.hero.stats.mana / state.hero.stats.maxMana) * 100
      : 0;
  const enemyHpPercent = (state.enemy.stats.hp / state.enemy.stats.maxHp) * 100;

  if (heroHpBar) heroHpBar.style.width = `${Math.max(heroHpPercent, 0)}%`;
  if (heroManaBar) heroManaBar.style.width = `${Math.max(heroManaPercent, 0)}%`;
  if (heroAtbBar) heroAtbBar.style.width = `${Math.max(0, Math.min(100, state.hero.atb))}%`;
  if (enemyHpBar) enemyHpBar.style.width = `${Math.max(enemyHpPercent, 0)}%`;
  if (enemyAtbBar) enemyAtbBar.style.width = `${Math.max(0, Math.min(100, state.enemy.atb))}%`;

  const heroHpText = document.getElementById("hpHeroiTexto");
  const heroManaText = document.getElementById("manaHeroiTexto");
  const heroAtbText = document.getElementById("atbHeroiTexto");
  const enemyHpText = document.getElementById("hpInimigoTexto");
  const enemyAtbText = document.getElementById("atbInimigoTexto");

  if (heroHpText) {
    heroHpText.textContent = `${state.hero.stats.hp}/${state.hero.stats.maxHp}`;
  }

  if (heroManaText) {
    heroManaText.textContent = `${state.hero.stats.mana}/${state.hero.stats.maxMana}`;
  }

  if (heroAtbText) {
    heroAtbText.textContent = `ATB ${Math.floor(state.hero.atb)}%`;
  }

  if (enemyHpText) {
    enemyHpText.textContent = `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}`;
  }

  if (enemyAtbText) {
    enemyAtbText.textContent = `ATB ${Math.floor(state.enemy.atb)}%`;
  }

  const heroDefense = document.getElementById("defesaHeroi");
  const heroMagicDefense = document.getElementById("defesaMagicaHeroi");
  const heroSpeed = document.getElementById("velocidadeHeroi");
  const enemyDefense = document.getElementById("defesaInimigo");
  const enemyMagicDefense = document.getElementById("defesaMagicaInimigo");
  const enemySpeed = document.getElementById("velocidadeInimigo");

  if (heroDefense) heroDefense.textContent = String(state.hero.stats.defense);
  if (heroMagicDefense) heroMagicDefense.textContent = String(state.hero.stats.magicDefense);
  if (heroSpeed) heroSpeed.textContent = String(state.hero.stats.speed);
  if (enemyDefense) enemyDefense.textContent = String(state.enemy.stats.defense);
  if (enemyMagicDefense) enemyMagicDefense.textContent = String(state.enemy.stats.magicDefense);
  if (enemySpeed) enemySpeed.textContent = String(state.enemy.stats.speed);

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
