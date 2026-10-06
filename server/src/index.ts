import { canEquipItem } from "../../shared/src/equipment/equipmentRules.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { BattleManager } from "./modules/combat/battleManager.js";
import {
  applyBattleAction,
  applyCriticalDamage,
  calculateDamageTaken,
  rollCritical,
} from "./modules/combat/combatEngine.js";
import {
  advanceBattleAtb,
  ATB_TICK_MS,
} from "../../shared/src/combat/atb.js";
import { normalizeHeroLevel } from "../../shared/src/combat/classStats.js";
import type { BattleAction } from "../../shared/src/combat/actions.js";
import { STARTER_LOOT_ITEMS } from "../../shared/src/loot/lootTables.js";
import type { HeroClass } from "../../shared/src/types/combat.js";
import type { EquipmentItem } from "../../shared/src/types/equipment.js";
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
const atbIntervals = new Map<string, NodeJS.Timeout>();

function normalizeHeroClass(className?: string): HeroClass {
  if (className === "mago" || className === "arqueiro") return className;
  return "guerreiro";
}

function resolveEquippedItems(
  ids: string[] | undefined,
  heroClass: HeroClass,
  heroLevel: number,
): EquipmentItem[] {
  if (!Array.isArray(ids)) return [];

  const seenSlots = new Set<string>();
  const items: EquipmentItem[] = [];

  for (const id of ids.slice(0, 9)) {
    const item = getEquipmentById(id) ?? STARTER_LOOT_ITEMS[id];
    if (!item || seenSlots.has(item.slot)) continue;

    if (!canEquipItem(item, heroClass, heroLevel)) continue;

    seenSlots.add(item.slot);
    items.push(item);
  }

  return items;
}

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

  const hero = {
    ...battleState.hero,
    stats: { ...battleState.hero.stats },
  };
  const enemy = {
    ...battleState.enemy,
    stats: { ...battleState.enemy.stats },
    atb: 0,
  };

  const wasDefending = hero.defending;
  const critical = rollCritical(enemy.stats.criticalChance);
  const mitigatedDamage = calculateDamageTaken(
    enemy.stats.attack,
    hero.stats.defense,
    wasDefending,
  );
  const finalDamage = critical
    ? applyCriticalDamage(mitigatedDamage, enemy.stats.criticalDamage)
    : mitigatedDamage;

  hero.stats.hp = Math.max(0, hero.stats.hp - finalDamage);
  hero.isAlive = hero.stats.hp > 0;
  hero.defending = false;

  const message = critical
    ? `CRITICO! ${enemy.name} causou ${finalDamage} de dano em ${hero.name}.`
    : wasDefending
      ? `${enemy.name} atacou, mas ${hero.name} se defendeu e recebeu apenas ${finalDamage} de dano.`
      : `${enemy.name} atacou e causou ${finalDamage} de dano.`;

  const nextBattleState = {
    ...battleState,
    hero,
    enemy,
    finished: !hero.isAlive,
    ...(!hero.isAlive ? { winnerId: enemy.id } : {}),
    turnOwnerId: !hero.isAlive ? enemy.id : null,
    lastEvent: {
      actorId: enemy.id,
      targetId: hero.id,
      action: "ATTACK" as const,
      damage: finalDamage,
      critical,
      message,
    },
  };

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
      equippedItemIds?: string[];
      heroLevel?: number;
    }) => {
      const className = normalizeHeroClass(payload.className);
      const heroLevel = normalizeHeroLevel(Number(payload.heroLevel ?? 1));
      const monsterId = payload.monsterId || "goblin-normal-lvl-1";
      const equippedItems = resolveEquippedItems(
        payload.equippedItemIds,
        className,
        heroLevel,
      );

      try {
        const battleState = battleManager.create(
          socket.id,
          className,
          monsterId,
          equippedItems,
          heroLevel,
        );

        socket.emit("battle:update", battleState);
        startAtbLoop(socket.id, battleState.id);
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

    if (nextBattleState === currentBattle) return;

    battleManager.set(socket.id, nextBattleState);
    socket.emit("battle:update", nextBattleState);

    if (nextBattleState.finished) stopAtbLoop(socket.id);
  });

  socket.on("disconnect", () => {
    stopAtbLoop(socket.id);
    battleManager.remove(socket.id);
    console.log(`Jogador desconectado: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log("Servidor do Drakoria online na porta 3001");
});
