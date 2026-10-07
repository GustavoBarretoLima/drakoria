import { getHeroSkills, getSkillBlockReason, getSkillCooldown, type SkillId } from "../../../shared/src/combat/classSkills.js";
import type { BattleState } from "../../../shared/src/types/combat.js";

/** A compact command submenu; nodes remain stable during ATB updates. */
export function renderSkills(state: BattleState, onUseSkill: (id: SkillId) => void): void {
  const dock = document.getElementById("battleCommandDock");
  const panel = document.getElementById("painelHabilidades");
  const commands = document.getElementById("comandosBatalha");
  const container = document.getElementById("habilidadesClasse");
  const title = document.getElementById("tituloHabilidades");
  const detail = document.getElementById("descricaoHabilidade");
  const launcher = document.getElementById("btnHabilidades") as HTMLButtonElement | null;
  const back = document.getElementById("btnVoltarHabilidades");
  if (!dock || !panel || !commands || !container || !launcher || !back) return;
  const heroClass = state.hero.className;
  const skills = heroClass ? getHeroSkills(state.hero) : [];
  const skillKey = `${heroClass}:${skills.map(skill => skill.id).join(",")}`;
  const close = (restoreFocus = true) => {
    panel.hidden = true;
    commands.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    if (restoreFocus && !launcher.disabled) launcher.focus();
  };
  const buttons = () => Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
  const select = (id: string) => {
    container.dataset.selectedSkill = id;
    for (const button of buttons()) button.dataset.selected = String(button.id === `skill-${id}`);
    const selected = document.getElementById(`skill-${id}`);
    if (detail && selected) {
      const text = selected.title.replaceAll("\n", " · ");
      if (detail.textContent !== text) detail.textContent = text;
      detail.title = text;
    }
  };
  if (!panel.dataset.bound) {
    panel.dataset.bound = "true";
    launcher.addEventListener("click", () => {
      if (launcher.disabled) return;
      commands.hidden = true;
      panel.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      (buttons().find(button => !button.disabled) ?? back).focus();
    });
    back.addEventListener("click", () => close());
    dock.addEventListener("keydown", event => {
      if (panel.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const available = buttons().filter(button => !button.disabled);
        if (!available.length) return;
        const index = available.findIndex(button => button === document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + available.length) % available.length;
        available[next]?.focus();
      }
    });
  }
  launcher.hidden = skills.length === 0;
  launcher.disabled = state.finished || skills.length === 0;
  if (title && heroClass) {
    const labels = { guerreiro: "Guerreiro", mago: "Mago", arqueiro: "Arqueiro" };
    title.textContent = `Habilidades — ${labels[heroClass]}`;
  }
  if (container.dataset.skillClass !== skillKey) {
    close(false);
    container.replaceChildren();
    container.dataset.skillClass = skillKey;
    container.dataset.selectedSkill = skills[0]?.id ?? "";
    for (const skill of skills) {
      const row = document.createElement("div");
      row.className = "battle-skill-row";
      const button = document.createElement("button");
      button.id = `skill-${skill.id}`;
      button.type = "button";
      button.setAttribute("aria-describedby", `skill-detail-${skill.id}`);
      button.addEventListener("focus", () => select(skill.id));
      row.addEventListener("pointerenter", () => select(skill.id));
      button.addEventListener("click", () => {
        if (button.disabled) return;
        close();
        onUseSkill(skill.id);
      });
      const name = document.createElement("strong");
      name.textContent = skill.name;
      const meta = document.createElement("span");
      meta.textContent = `${skill.manaCost} MP`;
      const status = document.createElement("span");
      status.id = `skill-status-${skill.id}`;
      const description = document.createElement("span");
      description.id = `skill-detail-${skill.id}`;
      description.className = "battle-skill-accessible-detail";
      description.textContent = `${skill.description} Custo: ${skill.manaCost} mana. Recuperação: ${skill.cooldown} outra(s) ação(ões). Requer nível ${skill.unlockLevel}.`;
      button.append(name, meta, status);
      row.append(button, description);
      container.append(row);
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
    if (status) status.textContent = blocked?.startsWith("Desbloqueia") ? `Nv.${skill.unlockLevel}`
      : getSkillCooldown(state.hero, skill.id) > 0 ? `CD ${getSkillCooldown(state.hero, skill.id)}`
      : blocked ? "Sem MP" : isHeroTurn ? "Pronta" : "Aguarde";
  }
  select(container.dataset.selectedSkill ?? "");
  if (state.finished || skills.length === 0) close(false);
}
