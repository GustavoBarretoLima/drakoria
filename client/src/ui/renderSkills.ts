import { getClassSkills, getSkillBlockReason, type SkillId } from "../../../shared/src/combat/classSkills.js";
import type { BattleState } from "../../../shared/src/types/combat.js";

/** Keep nodes stable during ATB ticks so focus and the open panel are preserved. */
export function renderSkills(state: BattleState, onUseSkill: (id: SkillId) => void): void {
  const panel = document.getElementById("painelHabilidades");
  const container = document.getElementById("habilidadesClasse");
  const summary = document.getElementById("tituloHabilidades");
  if (!panel || !container) return;
  const heroClass = state.hero.className;
  const skills = heroClass ? getClassSkills(heroClass) : [];
  panel.hidden = skills.length === 0;
  if (summary && heroClass) {
    const labels = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro" };
    summary.textContent = `Habilidades — ${labels[heroClass]}`;
  }
  if (container.dataset.skillClass !== heroClass) {
    container.replaceChildren();
    container.dataset.skillClass = heroClass ?? "";
    for (const skill of skills) {
      const card = document.createElement("div");
      card.className = "battle-skill-card";
      const button = document.createElement("button");
      button.id = `skill-${skill.id}`;
      button.type = "button";
      button.setAttribute("aria-describedby", `skill-detail-${skill.id} skill-meta-${skill.id}`);
      button.addEventListener("click", () => { if (!button.disabled) onUseSkill(skill.id); });
      const name = document.createElement("strong");
      name.textContent = skill.name;
      const status = document.createElement("span");
      status.id = `skill-status-${skill.id}`;
      button.append(name, status);
      const meta = document.createElement("p");
      meta.id = `skill-meta-${skill.id}`;
      meta.className = "battle-skill-meta";
      meta.textContent = `Nv.${skill.unlockLevel} · ${skill.manaCost} mana · Recuperação: ${skill.cooldown} ação(ões)`;
      const description = document.createElement("p");
      description.id = `skill-detail-${skill.id}`;
      description.textContent = skill.description;
      card.append(button, meta, description);
      container.append(card);
    }
  }
  const isHeroTurn = !state.finished && state.turnOwnerId === state.hero.id;
  for (const skill of skills) {
    const button = document.getElementById(`skill-${skill.id}`) as HTMLButtonElement | null;
    const status = document.getElementById(`skill-status-${skill.id}`);
    const blocked = getSkillBlockReason(state.hero, skill);
    const label = state.finished ? "Batalha encerrada" : blocked ?? (isHeroTurn ? "Pronta" : "Aguarde seu turno");
    if (button) {
      button.disabled = !isHeroTurn || blocked !== null;
      button.title = `${skill.description}\n${skill.manaCost} mana · Recuperação: ${skill.cooldown} ação(ões)\n${label}`;
    }
    if (status) status.textContent = label;
  }
}
