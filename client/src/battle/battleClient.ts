import socket from "../network/socket.js";

export function sendAttack() {
  socket.emit("battle:action", { type: "ATTACK" });
}

export function sendDefend() {
  socket.emit("battle:action", { type: "DEFEND" });
}

export function sendMagic() {
  socket.emit("battle:action", { type: "CAST_MAGIC" });
}
