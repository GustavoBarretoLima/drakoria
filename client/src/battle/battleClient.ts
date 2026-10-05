import socket from "../network/socket.js";
import {
  isPagesDemoMode,
  performDemoAction,
} from "../demo/demoBattle.js";

export function sendAttack() {
  if (isPagesDemoMode()) {
    performDemoAction({ type: "ATTACK" });
    return;
  }

  socket.emit("battle:action", { type: "ATTACK" });
}

export function sendDefend() {
  if (isPagesDemoMode()) {
    performDemoAction({ type: "DEFEND" });
    return;
  }

  socket.emit("battle:action", { type: "DEFEND" });
}

export function sendMagic() {
  if (isPagesDemoMode()) {
    performDemoAction({ type: "CAST_MAGIC" });
    return;
  }

  socket.emit("battle:action", { type: "CAST_MAGIC" });
}
