ALTER TABLE accounts ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE accounts ADD COLUMN google_subject text UNIQUE
  CHECK (length(google_subject) BETWEEN 1 AND 255);
ALTER TABLE accounts ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE accounts ADD CONSTRAINT account_has_credentials
  CHECK (password_hash IS NOT NULL OR google_subject IS NOT NULL);

CREATE TABLE auth_google_challenges (
  token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  nonce text NOT NULL CHECK (length(nonce) = 43),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes'
);

-- Persistent limits survive restarts and apply to all instances. Keys are hashed.
CREATE TABLE auth_rate_limits (
  key_hash bytea PRIMARY KEY CHECK (octet_length(key_hash) = 32),
  window_started timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0)
);
CREATE INDEX auth_sessions_expiry_idx ON account_sessions(expires_at);
