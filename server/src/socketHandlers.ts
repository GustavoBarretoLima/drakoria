import { isPlayerSetupPayload, isResourceId, parseFilters, reply } from "./socketValidation.js";
import { applyPotionAction } from "../../shared/src/combat/potionAction.js";
import { normalizePotions } from "../../shared/src/items/potions.js";
import { canEquipItem } from "../../shared/src/equipment/equipmentRules.js";
import { SUBCLASS_DEFINITIONS, type SubclassId } from "../../shared/src/classes/subclasses.js";
import type { Socket } from "socket.io";
import type { BattleManager } from "./modules/combat/battleManager.js";
import { applyBattleAction } from "./modules/combat/combatEngine.js";
import { normalizeHeroLevel } from "../../shared/src/combat/classStats.js";
import { isBattleAction } from "../../shared/src/combat/actions.js";
import { STARTER_LOOT_ITEMS } from "../../shared/src/loot/lootTables.js";
import type { HeroClass } from "../../shared/src/types/combat.js";
import type { EquipmentItem } from "../../shared/src/types/equipment.js";
import {
  getEquipmentById,
  listEquipments,
  type EquipmentFilters,
} from "./modules/equipment/equipmentService.js";
import {
  getMonsterById,
  getRandomMonster,
  listMonsters,
  type MonsterFilters,
} from "./modules/monsters/monsterService.js";

function normalizeHeroClass(className?: string): HeroClass {
  if (className === "mago" || className === "arqueiro") return className;
  return "guerreiro";
}

function normalizeSubclass(subclassId: unknown, heroClass: HeroClass): SubclassId | undefined {
  if (typeof subclassId !== "string") return undefined;
  const id = subclassId as SubclassId;
  return SUBCLASS_DEFINITIONS[id]?.baseClass === heroClass ? id : undefined;
}

function resolveEquippedItems(
  ids: string[] | undefined,
  heroClass: HeroClass,
  heroLevel: number,
  subclassId?: SubclassId,
): EquipmentItem[] {
  if (!Array.isArray(ids)) return [];

  const seenSlots = new Set<string>();
  const items: EquipmentItem[] = [];

  for (const id of ids.slice(0, 9)) {
    const item = getEquipmentById(id) ?? (Object.hasOwn(STARTER_LOOT_ITEMS, id) ? STARTER_LOOT_ITEMS[id] : undefined);
    if (!item || seenSlots.has(item.slot)) continue;

    if (!canEquipItem(item, heroClass, heroLevel, subclassId)) continue;

    seenSlots.add(item.slot);
    items.push(item);
  }

  return items;
}

export interface BattleSocketDependencies {
  battleManager: BattleManager;
  startAtbLoop: (playerId: string, battleId: string) => void;
  stopAtbLoop: (playerId: string) => void;
}

export function registerBattleSocketHandlers(
  socket: Pick<Socket, "id" | "on" | "emit">,
  { battleManager, startAtbLoop, stopAtbLoop }: BattleSocketDependencies,
): void {
  // Event payloads arrive from the network: TypeScript annotations cannot
  // validate them. Contain unexpected failures at the event boundary too.
  function on(event: string, handler: (...args: unknown[]) => void): void {
    socket.on(event, (...args: unknown[]) => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Falha no evento ${event}:`, error);
        socket.emit("battle:error", { message: "Nao foi possivel processar a solicitacao." });
      }
    });
  }

  on("monsters:list", (rawFilters, callback) => {
    const filters = parseFilters(rawFilters, ["level", "minLevel", "maxLevel"], ["family", "rank"]);
    reply(callback, filters ? listMonsters(filters as MonsterFilters) : []);
  });

  on("monsters:get", (monsterId, callback) => {
    reply(callback, isResourceId(monsterId) ? getMonsterById(monsterId) ?? null : null);
  });

  on("monsters:random", (rawFilters, callback) => {
    const filters = parseFilters(rawFilters, ["level", "minLevel", "maxLevel"], ["family", "rank"]);
    reply(callback, filters ? getRandomMonster(filters as MonsterFilters) ?? null : null);
  });

  on("request:equipmentList", (rawFilters, callback) => {
    const filters = parseFilters(rawFilters, ["level"], ["slot", "rarity", "heroClass"]);
    reply(callback, filters ? listEquipments(filters as EquipmentFilters) : []);
  });

  on("equipments:get", (id, callback) => {
    reply(callback, isResourceId(id) ? getEquipmentById(id) ?? null : null);
  });

  on(
    "player:setup",
    (payload: unknown) => {
      if (!isPlayerSetupPayload(payload)) {
        socket.emit("battle:error", { message: "Dados invalidos para iniciar a batalha." });
        return;
      }
      if (battleManager.get(socket.id)?.finished === false) {
        socket.emit("battle:error", { message: "Ja existe uma batalha em andamento para este jogador." });
        return;
      }
      const className = normalizeHeroClass(payload.className);
      const subclassId = normalizeSubclass(payload.subclassId, className);
      const heroLevel = normalizeHeroLevel(Number(payload.heroLevel ?? 1));
      const monsterId = payload.monsterId || "goblin-normal-lvl-1";
      const equippedItems = resolveEquippedItems(
        payload.equippedItemIds,
        className,
        heroLevel,
        subclassId,
      );

      try {
        const battleState = battleManager.create(
          socket.id,
          className,
          monsterId,
          equippedItems,
          heroLevel,
          {
            ...(Number.isFinite(payload.currentHp) ? { hp: Number(payload.currentHp) } : {}),
            ...(Number.isFinite(payload.currentMana) ? { mana: Number(payload.currentMana) } : {}),
          },
          subclassId,
          typeof payload.heroName === "string" ? payload.heroName.trim().slice(0, 40) : "Heroi",
          payload.treeRanks,
          payload.equippedSkills,
        );

        battleState.potions = normalizePotions(payload.potions);
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

  on("battle:item", (id: unknown, callback: unknown) => {
    const current = battleManager.get(socket.id);
    if (!current) {
      reply(callback, false);
      return;
    }
    const next = applyPotionAction(current, id);
    if (next === current) {
      reply(callback, false);
      return;
    }
    battleManager.set(socket.id, next);
    socket.emit("battle:update", next);
    if (next.finished) stopAtbLoop(socket.id);
    reply(callback, true);
  });

  on("battle:action", (action: unknown) => {
    if (!isBattleAction(action)) return;
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

  on("disconnect", () => {
    stopAtbLoop(socket.id);
    battleManager.remove(socket.id);
    console.log(`Jogador desconectado: ${socket.id}`);
  });
}
