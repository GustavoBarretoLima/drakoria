CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 254),
  password_hash text NOT NULL CHECK (length(password_hash) BETWEEN 32 AND 512),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE TABLE account_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX account_sessions_account_idx ON account_sessions(account_id);

CREATE TABLE characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (name = btrim(name) AND length(name) BETWEEN 1 AND 40),
  hero_class text NOT NULL CHECK (hero_class IN ('guerreiro', 'mago', 'arqueiro')),
  level integer NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
  xp bigint NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 9007199254740991),
  gold bigint NOT NULL DEFAULT 0 CHECK (gold BETWEEN 0 AND 9007199254740991),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id)
);

-- Every equipment copy has a stable identity and exactly one current owner.
-- No payment, balance in BRL, listing or automatic import of local saves.
CREATE TABLE equipment_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  origin_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  definition_id text NOT NULL CHECK (length(definition_id) BETWEEN 1 AND 160),
  source_operation_key text NOT NULL CHECK (length(source_operation_key) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin_character_id, source_operation_key),
  UNIQUE (id, origin_character_id)
);
CREATE INDEX equipment_instances_owner_idx ON equipment_instances(owner_character_id);

CREATE TABLE equipment_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  equipment_instance_id uuid NOT NULL REFERENCES equipment_instances(id) ON DELETE RESTRICT,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type = 'grant'),
  operation_key text NOT NULL CHECK (length(operation_key) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (equipment_instance_id, character_id) REFERENCES equipment_instances(id, origin_character_id) ON DELETE RESTRICT,
  UNIQUE (character_id, operation_key)
);
CREATE INDEX equipment_events_item_idx ON equipment_events(equipment_instance_id);

CREATE FUNCTION prevent_equipment_event_changes() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Equipment events are append-only';
END;
$$;
CREATE TRIGGER equipment_events_append_only BEFORE UPDATE OR DELETE ON equipment_events
FOR EACH ROW EXECUTE FUNCTION prevent_equipment_event_changes();
