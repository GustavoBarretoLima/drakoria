CREATE TABLE online_guild_progress (
  character_id uuid PRIMARY KEY REFERENCES characters(id),
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE online_quest_commands (
  character_id uuid NOT NULL REFERENCES characters(id),
  request_id uuid NOT NULL,
  quest_id text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('accept', 'claim')),
  reward jsonb CHECK (reward IS NULL OR jsonb_typeof(reward) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (character_id, request_id)
);
CREATE INDEX online_quest_deliveries ON online_quest_commands(character_id, created_at DESC) WHERE operation = 'claim';
