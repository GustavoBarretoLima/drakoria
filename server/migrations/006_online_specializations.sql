ALTER TABLE characters ADD COLUMN subclass_id text;
ALTER TABLE characters ADD COLUMN tree_ranks jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(tree_ranks) = 'object');
ALTER TABLE characters ADD COLUMN skill_loadout jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(skill_loadout) = 'array');
ALTER TABLE characters ADD CONSTRAINT characters_subclass_class CHECK (
  subclass_id IS NULL OR
  (hero_class = 'guerreiro' AND subclass_id IN ('paladin', 'berserker', 'swordsman')) OR
  (hero_class = 'mago' AND subclass_id IN ('necromancer', 'warlock', 'elementalist')) OR
  (hero_class = 'arqueiro' AND subclass_id IN ('assassin', 'hunter', 'dark-elf'))
);
CREATE TABLE online_subclass_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id),
  subclass_id text NOT NULL CHECK (subclass_id IN ('paladin', 'berserker', 'swordsman', 'necromancer', 'warlock', 'elementalist', 'assassin', 'hunter', 'dark-elf')),
  source_operation_key text NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, source_operation_key),
  UNIQUE (id, character_id)
);
CREATE TABLE online_book_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id uuid NOT NULL,
  character_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('grant', 'consume')),
  operation_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (book_id, character_id) REFERENCES online_subclass_books(id, character_id),
  UNIQUE (book_id, event_type), UNIQUE (character_id, operation_key)
);
CREATE TRIGGER online_book_events_append_only BEFORE UPDATE OR DELETE ON online_book_events
FOR EACH ROW EXECUTE FUNCTION prevent_equipment_event_changes();
CREATE TABLE online_specialization_commands (
  character_id uuid NOT NULL REFERENCES characters(id),
  request_id uuid NOT NULL,
  command jsonb NOT NULL CHECK (jsonb_typeof(command) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, request_id)
);
