import assert from "node:assert/strict";
import { test } from "node:test";
import type { Socket } from "socket.io";
import { BattleManager } from "../server/src/modules/combat/battleManager.js";
import { registerBattleSocketHandlers } from "../server/src/socketHandlers.js";

function harness() {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const emitted: Array<{ event: string; value: unknown }> = [];
  const started: string[] = [];
  const stopped: string[] = [];
  const battleManager = new BattleManager();
  const socket = {
    id: "socket-test-player",
    on(event: string, handler: (...args: unknown[]) => void) { handlers.set(event, handler); },
    emit(event: string, value: unknown) { emitted.push({ event, value }); },
  };
  registerBattleSocketHandlers(socket as unknown as Pick<Socket, "id" | "on" | "emit">, {
    battleManager,
    startAtbLoop: (id, battleId) => started.push(`${id}:${battleId}`),
    stopAtbLoop: id => stopped.push(id),
  });
  return {
    battleManager, emitted, started, stopped, id: socket.id,
    send(event: string, ...args: unknown[]) {
      const handler = handlers.get(event);
      assert.ok(handler, `Handler missing: ${event}`);
      handler(...args);
    },
  };
}

test("invalid setup payloads cannot replace a battle or start its timer", () => {
  const h = harness();
  h.send("player:setup", { className: "mago", heroLevel: 10 });
  const original = h.battleManager.get(h.id);
  assert.ok(original);
  for (const payload of [
    undefined, null, [], true, 1, "hero", { className: {} },
    { heroLevel: "100" }, { heroLevel: Infinity }, { currentHp: NaN },
    { monsterId: {} }, { monsterId: "" },
    { equippedItemIds: [null] }, { equippedItemIds: [{}] },
    { equippedItemIds: Array(10).fill("orc-iron-axe") },
    { equippedSkills: [1] }, { treeRanks: [] }, { treeRanks: { rank: {} } },
    { potions: { healthPotion: "999" } },
  ]) {
    assert.doesNotThrow(() => h.send("player:setup", payload));
    assert.equal(h.battleManager.get(h.id), original);
    assert.equal(h.emitted.at(-1)?.event, "battle:error");
  }
  assert.equal(h.started.length, 1);
});

test("catalogue events handle missing and non-function acknowledgements", () => {
  const h = harness();
  for (const event of ["monsters:list", "monsters:get", "monsters:random", "request:equipmentList", "equipments:get"]) {
    for (const callback of [undefined, null, 1, {}, "callback"]) {
      assert.doesNotThrow(() => h.send(event, null, callback));
    }
  }
  assert.equal(h.emitted.length, 0);
});

test("invalid catalogue IDs and filters return empty responses", () => {
  const h = harness();
  let response: unknown;
  const ack = (value: unknown) => { response = value; };
  const readResponse = (): unknown => response;
  for (const event of ["monsters:get", "equipments:get"]) {
    for (const id of [undefined, null, [], {}, 10, "", "x".repeat(161)]) {
      h.send(event, id, ack);
      assert.equal(response, null);
    }
  }
  for (const event of ["monsters:list", "request:equipmentList"]) {
    for (const filters of [[], true, 1, "filters", { level: {} }, { level: Infinity }]) {
      h.send(event, filters, ack);
      assert.deepEqual(response, []);
    }
  }
  h.send("monsters:random", { family: [] }, ack);
  assert.equal(response, null);
  h.send("monsters:get", "goblin-normal-lvl-1", ack);
  assert.equal((readResponse() as { id: string }).id, "goblin-normal-lvl-1");
  h.send("request:equipmentList", { level: 20, heroClass: "mago" }, ack);
  const equipmentResponse = readResponse();
  assert.ok(Array.isArray(equipmentResponse) && equipmentResponse.length > 0);
  h.send("monsters:list", undefined, ack);
  const monsterResponse = readResponse();
  assert.ok(Array.isArray(monsterResponse) && monsterResponse.length > 0);
});

test("valid setup, actions, potion acknowledgements and disconnect still work", () => {
  const h = harness();
  h.send("player:setup", {
    className: "guerreiro", heroLevel: 25, heroName: "  Jogador  ",
    monsterId: "goblin-normal-lvl-1", equippedItemIds: ["orc-iron-axe"],
    currentHp: 50, currentMana: 10, potions: { healthPotion: 2 },
    treeRanks: {}, equippedSkills: [],
  });
  const battle = h.battleManager.get(h.id)!;
  assert.equal(battle.hero.name, "Jogador");
  assert.equal(battle.hero.level, 25);
  assert.equal(battle.hero.stats.hp, 50);
  assert.equal(battle.potions?.healthPotion, 2);
  assert.equal(h.emitted.at(-1)?.event, "battle:update");
  for (const action of [null, [], "ATTACK", { type: "USE_SKILL", skillId: {} }]) {
    h.send("battle:action", action);
    assert.equal(h.battleManager.get(h.id), battle);
  }
  battle.turnOwnerId = battle.hero.id;
  let accepted: unknown;
  h.send("battle:item", "healthPotion", (value: unknown) => { accepted = value; });
  assert.equal(accepted, true);
  const healed = h.battleManager.get(h.id)!;
  assert.ok(healed.hero.stats.hp > 50);
  assert.equal(healed.potions?.healthPotion, 1);
  h.send("battle:item", null, {});
  assert.equal(h.battleManager.get(h.id), healed);
  healed.turnOwnerId = healed.hero.id;
  healed.enemy.stats.hp = healed.enemy.stats.maxHp = 10000;
  h.send("battle:action", { type: "ATTACK" });
  assert.notEqual(h.battleManager.get(h.id), healed);
  h.send("disconnect");
  assert.equal(h.battleManager.has(h.id), false);
  assert.deepEqual(h.stopped, [h.id]);
  h.send("battle:item", "healthPotion", (value: unknown) => { accepted = value; });
  assert.equal(accepted, false);
});

test("an unexpected event exception is contained and later events still run", () => {
  const h = harness();
  const originalError = console.error;
  const errors: unknown[][] = [];
  console.error = (...args: unknown[]) => { errors.push(args); };
  try {
    assert.doesNotThrow(() => h.send("equipments:get", "orc-iron-axe", () => { throw new Error("broken ack"); }));
    assert.equal(errors.length, 1);
    assert.equal(h.emitted.at(-1)?.event, "battle:error");
    h.send("player:setup", {});
    assert.equal(h.emitted.at(-1)?.event, "battle:update");
    assert.ok(h.battleManager.has(h.id));
    h.send("player:setup", { monsterId: "unknown-monster" });
    assert.equal(h.emitted.at(-1)?.event, "battle:error");
    assert.equal(h.started.length, 1);
  } finally {
    console.error = originalError;
  }
});
