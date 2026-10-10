import type { Pool } from "pg";
import type { HeroClass } from "../../../shared/src/types/combat.js";
import { getEquipmentById } from "../modules/equipment/equipmentService.js";
import { STARTER_LOOT_ITEMS } from "../../../shared/src/loot/lootTables.js";
import { inTransaction } from "./pool.js";

export class CharacterRepository {
  constructor(private readonly pool: Pool) {}

  // Internal API: passwordHash must come from the future authentication service.
  // This is never exposed directly to Socket.IO or the public login form.
  async createAccountCharacter(email: string, passwordHash: string, name: string, heroClass: HeroClass): Promise<{ accountId: string; characterId: string }> {
    return inTransaction(this.pool, async client => {
      const account = await client.query<{ id: string }>(
        "INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email.trim().toLowerCase(), passwordHash],
      );
      const accountId = account.rows[0]!.id;
      const character = await client.query<{ id: string }>(
        "INSERT INTO characters (account_id, name, hero_class) VALUES ($1, $2, $3) RETURNING id",
        [accountId, name.trim(), heroClass],
      );
      return { accountId, characterId: character.rows[0]!.id };
    });
  }

  async getCharacterForAccount(accountId: string) {
    const result = await this.pool.query<{
      id: string; name: string; hero_class: HeroClass; level: number; xp: string; gold: string; version: string;
    }>("SELECT id, name, hero_class, level, xp, gold, version FROM characters WHERE account_id = $1", [accountId]);
    return result.rows[0] ?? null;
  }

  // Server-only grant. One operation key denotes one equipment copy.
  async grantEquipment(accountId: string, characterId: string, definitionId: string, operationKey: string): Promise<string> {
    if (!getEquipmentById(definitionId) && !Object.hasOwn(STARTER_LOOT_ITEMS, definitionId)) throw new Error("Equipamento desconhecido.");
    if (!operationKey || operationKey.length > 160) throw new Error("Chave de operacao invalida.");
    return inTransaction(this.pool, async client => {
      const owner = await client.query("SELECT id FROM characters WHERE id = $1 AND account_id = $2 FOR UPDATE", [characterId, accountId]);
      if (!owner.rowCount) throw new Error("Personagem nao pertence a conta.");
      const previous = await client.query<{ id: string; definition_id: string }>(
        "SELECT id, definition_id FROM equipment_instances WHERE origin_character_id = $1 AND source_operation_key = $2",
        [characterId, operationKey],
      );
      if (previous.rows[0]) {
        if (previous.rows[0].definition_id !== definitionId) throw new Error("Chave de operacao reutilizada com outro item.");
        return previous.rows[0].id;
      }
      const item = await client.query<{ id: string }>(
        "INSERT INTO equipment_instances (owner_character_id, origin_character_id, definition_id, source_operation_key) VALUES ($1, $1, $2, $3) RETURNING id",
        [characterId, definitionId, operationKey],
      );
      const itemId = item.rows[0]!.id;
      await client.query(
        "INSERT INTO equipment_events (equipment_instance_id, character_id, event_type, operation_key) VALUES ($1, $2, 'grant', $3)",
        [itemId, characterId, operationKey],
      );
      return itemId;
    });
  }
}
