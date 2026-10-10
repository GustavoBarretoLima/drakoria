import { createServer } from "node:http";
import { Server } from "socket.io";
import { BattleManager } from "./modules/combat/battleManager.js";
import { applyEnemyTurn } from "./modules/combat/combatEngine.js";
import { advanceBattleAtb, ATB_TICK_MS } from "../../shared/src/combat/atb.js";
import { registerBattleSocketHandlers } from "./socketHandlers.js";
import { createDatabasePool } from "./database/pool.js";
import { createHealthHandler } from "./health.js";
import { getAllowedOrigins, getServerPort } from "./runtimeConfig.js";
import { AuthRepository } from "./auth/repository.js";
import { CharacterRepository } from "./database/characterRepository.js";
import { createAuthHandler } from "./auth/http.js";
import { authOrigin } from "./auth/security.js";
import { googleVerifier } from "./auth/google.js";

const port = getServerPort(process.env.PORT);
const allowedOrigins = getAllowedOrigins();
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");
const databasePool = process.env.DATABASE_URL ? createDatabasePool() : undefined;
if (databasePool) databasePool.options.query_timeout = 3000;
const health = createHealthHandler(async () => {
  if (databasePool) await databasePool.query("SELECT 1");
});
const production = process.env.NODE_ENV === "production";
const origin = authOrigin(process.env);
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
if (googleClientId && !/^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(googleClientId)) throw new Error("GOOGLE_CLIENT_ID inválido.");
const authRepo = databasePool ? new AuthRepository(databasePool) : undefined;
const auth = authRepo && databasePool ? createAuthHandler({
  repo: authRepo, characters: new CharacterRepository(databasePool), origin, production,
  ...(googleClientId ? { googleClientId, verifyGoogle: googleVerifier(googleClientId) } : {}),
}) : undefined;
const httpServer = createServer((request, response) => {
  void (async () => {
    if (auth && await auth(request, response)) return;
    await health(request, response);
  })().catch(() => { if (!response.headersSent) response.writeHead(503); response.end(); });
});
httpServer.requestTimeout = 15000;
httpServer.headersTimeout = 10000;
httpServer.maxHeadersCount = 50;
const cleanupTimer = authRepo ? setInterval(() => {
  void authRepo.cleanup().catch(() => console.error("Falha na limpeza de sessões expiradas."));
}, 3600000) : undefined;
cleanupTimer?.unref();

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
  },
  // CORS alone does not protect a websocket handshake. This is an origin
  // restriction, not user authentication; non-browser clients may omit Origin.
  allowRequest: (request, callback) => callback(null, !request.headers.origin || allowedOrigins.includes(request.headers.origin)),
});

// The demo is local. Production combat stays closed until saved character state
// replaces player-provided setup, equipment and rewards in the online handlers.
if (production) io.use((_socket, next) => next(new Error("Combate online ainda não disponível.")));

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
  if (cleanupTimer) clearInterval(cleanupTimer);
  for (const id of atbIntervals.keys()) stopAtbLoop(id);
  io.close(() => { void databasePool?.end(); });
});
