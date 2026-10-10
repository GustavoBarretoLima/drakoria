CREATE TABLE online_expeditions (
  id uuid PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES characters(id),
  region_id text NOT NULL CHECK (region_id IN ('cemiterio-esquecido', 'pantano-corrompido', 'floresta-sombria', 'acampamento-orc', 'fortaleza-rei-orc')),
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defeated', 'retreated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, character_id)
);
CREATE UNIQUE INDEX online_expeditions_one_active ON online_expeditions(character_id) WHERE status = 'active';
CREATE INDEX online_expeditions_latest ON online_expeditions(character_id, created_at DESC, id DESC);
-- Existing online goblin battles remain playable, with no expedition credit.
ALTER TABLE online_battles ADD COLUMN expedition_id uuid;
ALTER TABLE online_battles ADD CONSTRAINT online_battles_expedition_owner
  FOREIGN KEY (expedition_id, character_id) REFERENCES online_expeditions(id, character_id);
