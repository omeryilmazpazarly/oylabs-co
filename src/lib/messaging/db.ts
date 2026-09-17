import 'server-only';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from './env';

/**
 * SQLite database for staff accounts and the Meta messaging system.
 *
 * Kept in its own file (data/messaging.db) so it never shares a schema or a
 * backup/restore decision with the portfolio database. In production data/ is
 * a symlink to /var/www/oylabs/data, outside the build output (see DEPLOY.md).
 *
 * Migrations are append-only: add a new entry at the end, never edit one that
 * has shipped. PRAGMA user_version records how many have run.
 */

const MIGRATIONS: string[] = [
  /* 1 — staff auth, workspaces, Meta connections, events, messages, deliveries */
  `
  CREATE TABLE staff_users (
    id            INTEGER PRIMARY KEY,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    INTEGER NOT NULL,
    last_login_at INTEGER
  );

  CREATE TABLE staff_sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE workspaces (
    id             INTEGER PRIMARY KEY,
    name           TEXT    NOT NULL,
    api_key        TEXT    NOT NULL UNIQUE,
    api_secret_enc TEXT    NOT NULL,
    forward_url    TEXT,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );

  CREATE TABLE connect_links (
    id           INTEGER PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    token_hash   TEXT    NOT NULL UNIQUE,
    created_by   INTEGER REFERENCES staff_users(id) ON DELETE SET NULL,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER NOT NULL,
    used_at      INTEGER
  );

  CREATE TABLE oauth_sessions (
    id                 TEXT    PRIMARY KEY,
    link_id            INTEGER NOT NULL REFERENCES connect_links(id) ON DELETE CASCADE,
    state_hash         TEXT    NOT NULL UNIQUE,
    meta_user_id       TEXT,
    client_business_id TEXT,
    business_token_enc TEXT,
    pages_enc          TEXT,
    created_at         INTEGER NOT NULL,
    expires_at         INTEGER NOT NULL
  );

  CREATE TABLE connections (
    id                 INTEGER PRIMARY KEY,
    workspace_id       INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    page_id            TEXT    NOT NULL UNIQUE,
    page_name          TEXT    NOT NULL,
    ig_account_id      TEXT    UNIQUE,
    ig_username        TEXT,
    client_business_id TEXT,
    meta_user_id       TEXT,
    page_token_enc     TEXT,
    business_token_enc TEXT,
    status             TEXT    NOT NULL CHECK (status IN ('active', 'reconnect_needed', 'disconnected')),
    status_detail      TEXT,
    created_at         INTEGER NOT NULL,
    updated_at         INTEGER NOT NULL
  );
  CREATE INDEX connections_workspace ON connections(workspace_id);
  CREATE INDEX connections_meta_user ON connections(meta_user_id);

  CREATE TABLE webhook_events (
    id              INTEGER PRIMARY KEY,
    dedupe_key      TEXT    NOT NULL UNIQUE,
    object          TEXT    NOT NULL,
    account_id      TEXT    NOT NULL,
    payload         TEXT    NOT NULL,
    status          TEXT    NOT NULL CHECK (status IN ('pending', 'done', 'ignored', 'failed')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    next_attempt_at INTEGER NOT NULL,
    locked_until    INTEGER,
    last_error      TEXT,
    received_at     INTEGER NOT NULL,
    processed_at    INTEGER
  );
  CREATE INDEX webhook_events_due ON webhook_events(status, next_attempt_at);

  CREATE TABLE conversations (
    id                   INTEGER PRIMARY KEY,
    workspace_id         INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    connection_id        INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    channel              TEXT    NOT NULL CHECK (channel IN ('messenger', 'instagram')),
    participant_id       TEXT    NOT NULL,
    participant_name     TEXT,
    participant_picture  TEXT,
    profile_fetched_at   INTEGER,
    last_inbound_at      INTEGER,
    last_message_at      INTEGER NOT NULL,
    last_message_preview TEXT,
    created_at           INTEGER NOT NULL,
    UNIQUE (connection_id, channel, participant_id)
  );
  CREATE INDEX conversations_recent ON conversations(workspace_id, last_message_at DESC);

  CREATE TABLE messages (
    id               INTEGER PRIMARY KEY,
    public_id        TEXT    NOT NULL UNIQUE,
    workspace_id     INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id  INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction        TEXT    NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    source           TEXT    NOT NULL CHECK (source IN ('customer', 'api', 'console', 'page_inbox')),
    mid              TEXT    UNIQUE,
    text             TEXT,
    attachments      TEXT    NOT NULL DEFAULT '[]',
    postback         TEXT,
    status           TEXT    NOT NULL CHECK (status IN ('received', 'sent', 'failed')),
    error            TEXT,
    idempotency_key  TEXT,
    sent_by_staff_id INTEGER REFERENCES staff_users(id) ON DELETE SET NULL,
    meta_timestamp   INTEGER NOT NULL,
    created_at       INTEGER NOT NULL,
    UNIQUE (workspace_id, idempotency_key)
  );
  CREATE INDEX messages_thread ON messages(conversation_id, meta_timestamp);
  CREATE INDEX messages_age ON messages(created_at);

  CREATE TABLE deliveries (
    id              INTEGER PRIMARY KEY,
    workspace_id    INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    message_id      INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    event_id        TEXT    NOT NULL UNIQUE,
    payload         TEXT    NOT NULL,
    status          TEXT    NOT NULL CHECK (status IN ('pending', 'delivered', 'dead')),
    attempts        INTEGER NOT NULL DEFAULT 0,
    next_attempt_at INTEGER NOT NULL,
    locked_until    INTEGER,
    last_status     INTEGER,
    last_error      TEXT,
    created_at      INTEGER NOT NULL,
    delivered_at    INTEGER
  );
  CREATE INDEX deliveries_due ON deliveries(status, next_attempt_at);

  CREATE TABLE deletion_requests (
    id                  INTEGER PRIMARY KEY,
    confirmation_code   TEXT    NOT NULL UNIQUE,
    meta_user_id        TEXT,
    source              TEXT    NOT NULL CHECK (source IN ('meta_callback', 'staff')),
    status              TEXT    NOT NULL CHECK (status IN ('completed', 'no_data')),
    connections_deleted INTEGER NOT NULL DEFAULT 0,
    messages_deleted    INTEGER NOT NULL DEFAULT 0,
    created_at          INTEGER NOT NULL,
    completed_at        INTEGER
  );
  `,
];

export type Db = Database.Database;

export function openMessagingDb(file: string): Db {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  return db;
}

function migrate(db: Db) {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let i = current; i < MIGRATIONS.length; i++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

const holder = globalThis as unknown as { __oyMessagingDb?: Db };

/** Process-wide connection (survives dev hot reloads). */
export function getDb(): Db {
  if (!holder.__oyMessagingDb) holder.__oyMessagingDb = openMessagingDb(env.messagingDbPath());
  return holder.__oyMessagingDb;
}

/** Tests only: start from an empty in-memory database. */
export function resetDbForTests(): Db {
  holder.__oyMessagingDb?.close();
  holder.__oyMessagingDb = openMessagingDb(':memory:');
  return holder.__oyMessagingDb;
}

export const now = () => Date.now();
