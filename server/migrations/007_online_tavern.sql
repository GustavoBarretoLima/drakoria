ALTER TABLE characters ADD COLUMN potion_inventory jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(potion_inventory) = 'object');
CREATE TABLE online_tavern_commands (
  character_id uuid NOT NULL REFERENCES characters(id),
  request_id uuid NOT NULL,
  command jsonb NOT NULL CHECK (jsonb_typeof(command) = 'object'),
  receipt jsonb NOT NULL CHECK (jsonb_typeof(receipt) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, request_id)
);
CREATE TRIGGER online_tavern_commands_append_only BEFORE UPDATE OR DELETE ON online_tavern_commands
FOR EACH ROW EXECUTE FUNCTION prevent_equipment_event_changes();
