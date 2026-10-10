import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderStatus(state: BattleState) {
  const text = (id: string, value: string) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const bar = (id: string, value: number) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.style.width = `${Math.max(0, Math.min(100, value))}%`;
    element.style.transition = "width 180ms ease";
  };
  const hpBar = (id: string, current: number, max: number) => {
    const percent = max > 0 ? current / max * 100 : 0;
    bar(id, percent);
    const element = document.getElementById(id);
    if (!element) return;

    if (percent <= 25) {
      element.style.background = "linear-gradient(90deg, #9d111f, #ff3d4f)";
      element.style.boxShadow = "0 0 8px rgba(255, 61, 79, .68)";
      return;
    }

    if (percent <= 50) {
      element.style.background = "linear-gradient(90deg, #bd3b1f, #ff7c3d)";
      element.style.boxShadow = "none";
      return;
    }

    element.style.background = "linear-gradient(90deg, #d63344, #ff6673)";
    element.style.boxShadow = "none";
  };
  const atbBar = (id: string, value: number) => {
    bar(id, value);
    const element = document.getElementById(id);
    if (!element) return;
    const ready = value >= 99;
    element.style.filter = ready ? "brightness(1.2)" : "none";
    element.style.boxShadow = ready ? "0 0 8px rgba(255, 226, 122, .72)" : "none";
  };
  const ratio = (value: number, max: number) => max > 0 ? value / max * 100 : 0;

  hpBar("hpHeroiBar", state.hero.stats.hp, state.hero.stats.maxHp);
  const berserk = state.hero.subclassId === "berserker";
  bar("manaHeroiBar", berserk ? state.hero.fury ?? 0 : ratio(state.hero.stats.mana, state.hero.stats.maxMana));
  document.getElementById("manaHeroiBar")?.classList.toggle("berserk-fury", berserk);
  atbBar("atbHeroiBar", state.hero.atb);
  hpBar("hpInimigoBar", state.enemy.stats.hp, state.enemy.stats.maxHp);
  atbBar("atbInimigoBar", state.enemy.atb);
  text("hpHeroiTexto", "Vida");
  text("manaHeroiTexto", berserk ? `Fúria ${state.hero.fury ?? 0}/100` : "Mana");
  text("atbHeroiTexto", "ATB");
  text("nomeHeroi", localStorage.getItem("nomeHeroi") || state.hero.name);
  const classes = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro" };
  text("classeHeroi", state.hero.className ? berserk ? "Berserk" : classes[state.hero.className] : "");
  text("nivelHeroi", String(state.hero.level ?? 1));
  text("nomeInimigo", state.enemy.name);
  const reveal = state.revealEnemyStats === true;
  text("hpInimigoTexto", reveal ? `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}` : "Vida");
  text("atbInimigoTexto", reveal ? `ATB ${Math.floor(state.enemy.atb)}%` : "ATB");
  const panel = document.getElementById("atributosInimigo");
  if (panel) panel.hidden = !reveal;
  const stats = state.enemy.stats;
  for (const [id, value] of Object.entries({
    magiaInimigo: String(stats.magicPower), esquivaInimigo: `${stats.dodgeChance}%`,
    ataqueInimigo: String(stats.attack), defesaInimigo: String(stats.defense),
    defesaMagicaInimigo: String(stats.magicDefense), velocidadeInimigo: String(stats.speed),
    manaInimigo: `${stats.mana}/${stats.maxMana}`, criticoInimigo: `${stats.criticalChance}%`,
    danoCriticoInimigo: `${stats.criticalDamage}%`,
  })) text(id, reveal ? value : "");
}
