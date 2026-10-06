import type { BattleState } from "../../../shared/src/types/combat.js";

export function renderStatus(state: BattleState) {
  const text = (id: string, value: string) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const bar = (id: string, value: number) => {
    const element = document.getElementById(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, value))}%`;
  };
  const ratio = (value: number, max: number) => max > 0 ? value / max * 100 : 0;
  bar("hpHeroiBar", ratio(state.hero.stats.hp, state.hero.stats.maxHp));
  bar("manaHeroiBar", ratio(state.hero.stats.mana, state.hero.stats.maxMana));
  bar("atbHeroiBar", state.hero.atb);
  bar("hpInimigoBar", ratio(state.enemy.stats.hp, state.enemy.stats.maxHp));
  bar("atbInimigoBar", state.enemy.atb);
  text("hpHeroiTexto", "Vida");
  text("manaHeroiTexto", "Mana");
  text("atbHeroiTexto", "ATB");
  text("nomeHeroi", localStorage.getItem("nomeHeroi") || state.hero.name);
  const classes = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro" };
  text("classeHeroi", state.hero.className ? classes[state.hero.className] : "");
  text("nivelHeroi", String(state.hero.level ?? 1));
  text("nomeInimigo", state.enemy.name);
  const reveal = state.revealEnemyStats === true;
  text("hpInimigoTexto", reveal ? `${state.enemy.stats.hp}/${state.enemy.stats.maxHp}` : "Vida");
  text("atbInimigoTexto", reveal ? `ATB ${Math.floor(state.enemy.atb)}%` : "ATB");
  const panel = document.getElementById("atributosInimigo");
  if (panel) panel.hidden = !reveal;
  const stats = state.enemy.stats;
  for (const [id, value] of Object.entries({
    ataqueInimigo: String(stats.attack), defesaInimigo: String(stats.defense),
    defesaMagicaInimigo: String(stats.magicDefense), velocidadeInimigo: String(stats.speed),
    manaInimigo: `${stats.mana}/${stats.maxMana}`, criticoInimigo: `${stats.criticalChance}%`,
    danoCriticoInimigo: `${stats.criticalDamage}%`,
  })) text(id, reveal ? value : "");
}
