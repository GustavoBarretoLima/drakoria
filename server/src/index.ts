import { createServer } from "node:http";
import { Server } from "socket.io";
import { createInitialBattleState } from "./modules/combat/battleRoom.js";
import {
  applyBattleAction,
  calculateDamageTaken,
} from "./modules/combat/combatEngine.js";
import type { BattleAction } from "../../shared/src/combat/actions.js";
import {
  getEquipmentById,
  listEquipments,
} from "./modules/equipment/equipmentService.js";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let battleState = createInitialBattleState("guerreiro");

function processEnemyTurn() {
  if (battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.enemy.id) return;

  const baseDamage = 8;

  const hero = {
    ...battleState.hero,
    stats: { ...battleState.hero.stats },
  };

  const wasDefending = hero.defending;
  const finalDamage = calculateDamageTaken(baseDamage, wasDefending);

  hero.stats.hp = Math.max(0, hero.stats.hp - finalDamage);
  hero.isAlive = hero.stats.hp > 0;
  hero.defending = false;

  battleState = {
    ...battleState,
    hero,
    finished: !hero.isAlive,
    winnerId: !hero.isAlive ? battleState.enemy.id : "",
    turnOwnerId: !hero.isAlive ? battleState.enemy.id : battleState.hero.id,
    lastEvent: {
      actorId: battleState.enemy.id,
      targetId: battleState.hero.id,
      action: "ATTACK",
      damage: finalDamage,
      critical: false,
      message: wasDefending
        ? `Goblin atacou, mas ${hero.name} se defendeu e recebeu apenas ${finalDamage} de dano.`
        : `Goblin atacou e causou ${finalDamage} de dano.`,
    },
  };

  io.emit("battle:update", battleState);
}

io.on("connection", (socket) => {
  socket.on("request:equipmentList", (filters, callback) => {
    const items = listEquipments(filters ?? {});
    callback(items);
  });

  socket.on("equipments:get", (id, callback) => {
    const item = getEquipmentById(id);
    callback?.(item ?? null);
  });
  console.log(`Jogador conectado: ${socket.id}`);

  socket.emit("battle:update", battleState);

  socket.on(
    "player:setup",
    (payload: { className?: "guerreiro" | "mago" | "arqueiro" }) => {
      const className =
        payload.className === "mago" || payload.className === "arqueiro"
          ? payload.className
          : "guerreiro";

      battleState = createInitialBattleState(className);
      io.emit("battle:update", battleState);
    },
  );

  socket.on("battle:action", (action: BattleAction) => {
    console.log("Acao recebida do cliente:", action);

    battleState = applyBattleAction(battleState, action);
    io.emit("battle:update", battleState);

    if (
      !battleState.finished &&
      battleState.turnOwnerId === battleState.enemy.id
    ) {
      setTimeout(() => {
        processEnemyTurn();
      }, 1000);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Jogador desconectado: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log("Servidor do Drakoria online na porta 3001");
});
