import assert from "node:assert/strict";
import { test } from "node:test";
import type { Socket } from "socket.io";
import { BattleManager } from "../server/src/modules/combat/battleManager.js";
import { registerBattleSocketHandlers } from "../server/src/socketHandlers.js";
import { isPlayerSetupPayload } from "../server/src/socketValidation.js";

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

test("setup rejects out-of-domain fields before creating any battle", () => {
  for (const payload of [
    { className: null }, { className: "admin" }, { subclassId: "constructor" },
    { subclassId: "unknown" }, { className: "mago", subclassId: "berserker" },
    { heroName: "x".repeat(161) }, { heroLevel: 0 }, { heroLevel: 101 }, { heroLevel: 1.5 },
    { currentHp: -1 }, { currentMana: -1 }, { currentHp: Number.MAX_VALUE },
    { equippedSkills: Array(5).fill("") }, { equippedSkills: [null] },
    { treeRanks: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`node-${i}`, 1])) },
    { treeRanks: { node: -1 } }, { treeRanks: { node: 1.5 } },
    { treeRanks: { node: Number.MAX_SAFE_INTEGER } }, { treeRanks: { ["x".repeat(161)]: 1 } },
    { potions: { healthPotion: 10000 } }, { potions: { healthPotion: -1 } },
    { potions: { healthPotion: 0.5 } }, { potions: { inventedPotion: 1 } },
  ]) {
    const h = harness();
    assert.equal(isPlayerSetupPayload(payload), false, JSON.stringify(payload));
    h.send("player:setup", payload);
    assert.equal(h.battleManager.has(h.id), false);
    assert.equal(h.started.length, 0);
    assert.equal(h.emitted.at(-1)?.event, "battle:error");
  }
});

test("repeated setup cannot reset an active battle, spent potions or its timer", () => {
  const h = harness();
  const payload = { currentHp: 10, potions: { healthPotion: 2 } };
  h.send("player:setup", payload);
  const initial = h.battleManager.get(h.id)!;
  initial.turnOwnerId = initial.hero.id;
  h.send("battle:item", "healthPotion");
  const current = h.battleManager.get(h.id)!;
  assert.equal(current.potions?.healthPotion, 1);
  const snapshot = JSON.stringify(current);
  for (const repeated of [payload, { className: "mago", heroLevel: 100, currentHp: 9999, potions: { healthPotion: 9999 } }]) {
    h.send("player:setup", repeated);
    assert.equal(h.battleManager.get(h.id), current);
    assert.equal(JSON.stringify(current), snapshot);
    assert.equal(h.emitted.at(-1)?.event, "battle:error");
  }
  assert.equal(h.started.length, 1);
  assert.equal(h.stopped.length, 0);
  // Once the encounter is finished, the existing client can request the next.
  current.finished = true;
  h.send("player:setup", { className: "mago", monsterId: "goblin-normal-lvl-1" });
  assert.notEqual(h.battleManager.get(h.id), current);
  assert.equal(h.started.length, 2);
  assert.equal(h.emitted.at(-1)?.event, "battle:update");
});

test("bounded valid setup retains defaults, zero resources and empty Berserk slots", () => {
  for (const heroLevel of [1, 100]) {
    const h = harness();
    h.send("player:setup", { heroLevel, currentHp: 0, currentMana: 0, potions: { healthPotion: 9999, manaPotion: 0 } });
    const battle = h.battleManager.get(h.id)!;
    assert.ok(battle);
    assert.equal(battle.hero.className, "guerreiro");
    assert.equal(battle.hero.stats.hp, 0);
    assert.equal(battle.hero.stats.mana, 0);
    assert.equal(battle.potions?.healthPotion, 9999);
  }
  const h = harness();
  h.send("player:setup", {
    className: "guerreiro", subclassId: "berserker", heroLevel: 25,
    treeRanks: { "berserker-brutal": 1 }, equippedSkills: ["", "", "", ""],
  });
  const battle = h.battleManager.get(h.id)!;
  assert.ok(battle);
  assert.equal(battle.hero.subclassId, "berserker");
  assert.equal(battle.hero.treeRanks?.["berserker-brutal"], 1);
  assert.deepEqual(battle.hero.equippedSkills, ["", "", "", ""]);
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
