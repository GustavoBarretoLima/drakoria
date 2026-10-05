import { createServer } from "node:http";
import { Server } from "socket.io";
import { BattleManager } from "./modules/combat/battleManager.js";
import {
  applyBattleAction,
  calculateDamageTaken,
} from "./modules/combat/combatEngine.js";
import type { BattleAction } from "../../shared/src/combat/actions.js";
import type { HeroClass } from "../../shared/src/types/combat.js";
import {
  getEquipmentById,
  listEquipments,
} from "./modules/equipment/equipmentService.js";
import {
  getMonsterById,
  getRandomMonster,
  listMonsters,
} from "./modules/monsters/monsterService.js";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const battleManager = new BattleManager();

function normalizeHeroClass(className?: string): HeroClass {
  if (className === "mago" || className === "arqueiro") {
    return className;
  }

  return "guerreiro";
}

function processEnemyTurn(playerId: string, expectedBattleId: string) {
  const battleState = battleManager.get(playerId);

  if (!battleState) return;
  if (battleState.id !== expectedBattleId) return;
  if (battleState.finished) return;
  if (battleState.turnOwnerId !== battleState.enemy.id) return;

  const baseDamage = battleState.enemy.stats.attack;
  const hero = {
    ...battleState.hero,
    stats: { ...battleState.hero.stats },
  };

  const wasDefending = hero.defending;
  const finalDamage = calculateDamageTaken(baseDamage, wasDefending);

  hero.stats.hp = Math.max(0, hero.stats.hp - finalDamage);
  hero.isAlive = hero.stats.hp > 0;
  hero.defending = false;

  const nextBattleState = {
    ...battleState,
    hero,
    finished: !hero.isAlive,
    winnerId: !hero.isAlive ? battleState.enemy.id : undefined,
    turnOwnerId: !hero.isAlive ? battleState.enemy.id : battleState.hero.id,
    lastEvent: {
      actorId: battleState.enemy.id,
      targetId: battleState.hero.id,
      action: "ATTACK" as const,
      damage: finalDamage,
      critical: false,
      message: wasDefending
        ? `${battleState.enemy.name} atacou, mas ${hero.name} se defendeu e recebeu apenas ${finalDamage} de dano.`
        : `${battleState.enemy.name} atacou e causou ${finalDamage} de dano.`,
    },
  };

  battleManager.set(playerId, nextBattleState);
  io.to(playerId).emit("battle:update", nextBattleState);
}

io.on("connection", (socket) => {
  socket.join(socket.id);
  console.log(`Jogador conectado: ${socket.id}`);

  socket.on("monsters:list", (filters, callback) => {
    const monsters = listMonsters(filters ?? {});
    callback?.(monsters);
  });

  socket.on("monsters:get", (monsterId, callback) => {
    const monster = getMonsterById(monsterId);
    callback?.(monster ?? null);
  });

  socket.on("monsters:random", (filters, callback) => {
    const monster = getRandomMonster(filters ?? {});
    callback?.(monster ?? null);
  });

  socket.on("request:equipmentList", (filters, callback) => {
    const items = listEquipments(filters ?? {});
    callback(items);
  });

  socket.on("equipments:get", (id, callback) => {
    const item = getEquipmentById(id);
    callback?.(item ?? null);
  });

  socket.on(
    "player:setup",
    (payload: {
      className?: string;
      monsterId?: string;
    }) => {
      const className = normalizeHeroClass(payload.className);
      const monsterId = payload.monsterId || "goblin-normal-lvl-1";

      try {
        const battleState = battleManager.create(
          socket.id,
          className,
          monsterId,
        );

        socket.emit("battle:update", battleState);
      } catch (error) {
        console.error("Falha ao criar batalha:", error);
        socket.emit("battle:error", {
          message: "Nao foi possivel iniciar a batalha.",
        });
      }
    },
  );

  socket.on("battle:action", (action: BattleAction) => {
    const currentBattle = battleManager.get(socket.id);

    if (!currentBattle) {
      socket.emit("battle:error", {
        message: "Nenhuma batalha ativa para este jogador.",
      });
      return;
    }

    const nextBattleState = applyBattleAction(currentBattle, action);
    battleManager.set(socket.id, nextBattleState);
    socket.emit("battle:update", nextBattleState);

    if (
      !nextBattleState.finished &&
      nextBattleState.turnOwnerId === nextBattleState.enemy.id
    ) {
      const expectedBattleId = nextBattleState.id;
      setTimeout(() => {
        processEnemyTurn(socket.id, expectedBattleId);
      }, 1000);
    }
  });

  socket.on("disconnect", () => {
    battleManager.remove(socket.id);
    console.log(`Jogador desconectado: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log("Servidor do Drakoria online na porta 3001");
});
