import { io } from "socket.io-client";
import { isPagesDemoMode } from "../demo/demoBattle.js";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
  transports: ["websocket"],
  autoConnect: !isPagesDemoMode(),
});

export default socket;
