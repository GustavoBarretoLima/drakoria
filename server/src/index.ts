import { createServer } from "node:http";
import { Server } from "socket.io";
import { BattleManager } from "./modules/combat/battleManager.js";
import { applyEnemyTurn } from "./modules/combat/combatEngine.js";
import { advanceBattleAtb, ATB_TICK_MS } from "../../shared/src/combat/atb.js";
import { registerBattleSocketHandlers } from "./socketHandlers.js";
import { createDatabasePool } from "./database/pool.js";
import { createHealthHandler } from "./health.js";
import { getAllowedOrigins, getServerPort } from "./runtimeConfig.js";

const port = getServerPort(process.env.PORT);
const allowedOrigins = getAllowedOrigins();
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");
const databasePool = process.env.DATABASE_URL ? createDatabasePool() : undefined;
if (databasePool) databasePool.options.query_timeout = 3000;
const health = createHealthHandler(async () => {
  if (databasePool) await databasePool.query("SELECT 1");
});
const httpServer = createServer((request, response) => { void health(request, response); });

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
  },
  // CORS alone does not protect a websocket handshake. This is an origin
  // restriction, not user authentication; non-browser clients may omit Origin.
  allowRequest: (request, callback) => callback(null, !request.headers.origin || allowedOrigins.includes(request.headers.origin)),
});

const battleManager = new BattleManager();
const atbIntervals = new Map<string, NodeJS.Timeout>();

function stopAtbLoop(playerId: string) {
  const interval = atbIntervals.get(playerId);
  if (!interval) return;

  clearInterval(interval);
  atbIntervals.delete(playerId);
}

function processEnemyTurn(playerId: string, expectedBattleId: string) {
  const battleState = battleManager.get(playerId);

  if (!battleState) return;
  if (battleState.id !== expectedBattleId) return;
  if (battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.enemy.id) return;

  const nextBattleState = applyEnemyTurn(battleState);

  battleManager.set(playerId, nextBattleState);
  io.to(playerId).emit("battle:update", nextBattleState);

  if (nextBattleState.finished) stopAtbLoop(playerId);
}

function startAtbLoop(playerId: string, expectedBattleId: string) {
  stopAtbLoop(playerId);

  const interval = setInterval(() => {
    const currentBattle = battleManager.get(playerId);

    if (!currentBattle || currentBattle.id !== expectedBattleId) {
      stopAtbLoop(playerId);
      return;
    }

    if (currentBattle.finished) {
      stopAtbLoop(playerId);
      return;
    }

    const nextBattle = advanceBattleAtb(currentBattle);

    if (nextBattle !== currentBattle) {
      battleManager.set(playerId, nextBattle);
      io.to(playerId).emit("battle:update", nextBattle);
    }

    if (nextBattle.turnOwnerId === nextBattle.enemy.id) {
      processEnemyTurn(playerId, expectedBattleId);
    }
  }, ATB_TICK_MS);

  atbIntervals.set(playerId, interval);
}

io.on("connection", (socket) => {
  socket.join(socket.id);
  console.log(`Jogador conectado: ${socket.id}`);
  registerBattleSocketHandlers(socket, { battleManager, startAtbLoop, stopAtbLoop });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Servidor do Drakoria online na porta ${port}`);
});

process.on("SIGTERM", () => {
  for (const id of atbIntervals.keys()) stopAtbLoop(id);
  io.close(() => { void databasePool?.end(); });
});
