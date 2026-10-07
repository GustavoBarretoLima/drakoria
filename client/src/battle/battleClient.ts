import socket from "../network/socket.js";
import type { BattleAction } from "../../../shared/src/combat/actions.js";
import type { SkillId } from "../../../shared/src/combat/classSkills.js";
import {
  isPagesDemoMode,
  performDemoAction,
} from "../demo/demoBattle.js";

export function sendAttack() {
  sendAction({ type: "ATTACK" });
}

export function sendDefend() {
  sendAction({ type: "DEFEND" });
}

export function sendMagic() {
  sendAction({ type: "CAST_MAGIC" });
}

export function sendSkill(skillId: SkillId) {
  sendAction({ type: "USE_SKILL", skillId });
}

function sendAction(action: BattleAction) {
  if (isPagesDemoMode()) {
    performDemoAction(action);
    return;
  }

  socket.emit("battle:action", action);
}
