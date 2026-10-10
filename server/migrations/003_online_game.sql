ALTER TABLE characters ADD COLUMN current_hp integer CHECK (current_hp >= 0);
ALTER TABLE characters ADD COLUMN current_mana integer CHECK (current_mana >= 0);
ALTER TABLE equipment_instances ADD COLUMN equipped_slot text
  CHECK (equipped_slot IN ('ring', 'weapon', 'armor', 'shield', 'legs', 'boots', 'gloves', 'earring', 'necklace'));
CREATE UNIQUE INDEX equipment_one_per_slot ON equipment_instances(owner_character_id, equipped_slot) WHERE equipped_slot IS NOT NULL;

CREATE TABLE online_battles (
  id uuid PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  start_request_id uuid NOT NULL,
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  messages jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(messages) = 'array'),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  finished boolean NOT NULL DEFAULT false,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT settled OR finished),
  UNIQUE (character_id, start_request_id)
);
CREATE UNIQUE INDEX online_one_active_battle ON online_battles(character_id) WHERE NOT finished;
CREATE INDEX online_latest_battle ON online_battles(character_id, created_at DESC, id);
