-- Shared workspaces are independent from telurfarm_state (personal v5.0 data).
CREATE TABLE IF NOT EXISTS telurfarm_teams (
 id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL UNIQUE,
 revision INTEGER NOT NULL,
 payload TEXT NOT NULL
);
