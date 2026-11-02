-- DDL rujukan. Inisialisasi payload dilakukan oleh aplikasi.
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS app_state (
 id INTEGER PRIMARY KEY CHECK(id=1),
 revision INTEGER NOT NULL,
 payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_preferences (
 key TEXT PRIMARY KEY,
 revision INTEGER NOT NULL,
 payload TEXT NOT NULL
);
