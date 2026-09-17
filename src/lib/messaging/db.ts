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

  /* 2 — client accounts, team membership, email tokens, subscriptions */
  `
  CREATE TABLE client_users (
    id                INTEGER PRIMARY KEY,
    email             TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    name              TEXT    NOT NULL,
    password_hash     TEXT    NOT NULL,
    email_verified_at INTEGER,
    created_at        INTEGER NOT NULL,
    last_login_at     INTEGER
  );

  CREATE TABLE workspace_members (
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      INTEGER NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
    role         TEXT    NOT NULL CHECK (role IN ('owner', 'member')),
    created_at   INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
  );
  CREATE INDEX workspace_members_user ON workspace_members(user_id);

  CREATE TABLE client_sessions (
    token_hash   TEXT    PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER NOT NULL
  );

  CREATE TABLE email_tokens (
    token_hash   TEXT    PRIMARY KEY,
    purpose      TEXT    NOT NULL CHECK (purpose IN ('verify_email', 'reset_password', 'invite')),
    user_id      INTEGER REFERENCES client_users(id) ON DELETE CASCADE,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    email        TEXT    NOT NULL COLLATE NOCASE,
    role         TEXT    CHECK (role IN ('owner', 'member')),
    data         TEXT,
    created_at   INTEGER NOT NULL,
    expires_at   INTEGER NOT NULL,
    used_at      INTEGER
  );
  CREATE INDEX email_tokens_invites ON email_tokens(workspace_id, purpose);

  ALTER TABLE workspaces ADD COLUMN stripe_customer_id     TEXT;
  ALTER TABLE workspaces ADD COLUMN stripe_subscription_id TEXT;
  ALTER TABLE workspaces ADD COLUMN plan                   TEXT;
  ALTER TABLE workspaces ADD COLUMN billing_interval       TEXT;
  ALTER TABLE workspaces ADD COLUMN subscription_status    TEXT;
  ALTER TABLE workspaces ADD COLUMN trial_ends_at          INTEGER;
  ALTER TABLE workspaces ADD COLUMN current_period_end     INTEGER;
  ALTER TABLE workspaces ADD COLUMN cancel_at_period_end   INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE workspaces ADD COLUMN past_due_since         INTEGER;
  ALTER TABLE workspaces ADD COLUMN trial_used             INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE workspaces ADD COLUMN stripe_synced_at       INTEGER;
  ALTER TABLE workspaces ADD COLUMN complimentary          INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE workspaces ADD COLUMN page_limit_override    INTEGER;
  CREATE UNIQUE INDEX workspaces_stripe_customer ON workspaces(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

  -- Workspaces created before billing existed were set up by staff for in-house use.
  UPDATE workspaces SET complimentary = 1;

  CREATE TABLE stripe_events (
    id           TEXT    PRIMARY KEY,
    type         TEXT    NOT NULL,
    received_at  INTEGER NOT NULL,
    processed_at INTEGER,
    error        TEXT
  );
  `,

  /* 3 — WhatsApp numbers, templates and contacts; conversations/messages gain a WhatsApp shape.
     conversations and messages are rebuilt (SQLite can't alter CHECK constraints); ids are kept. */
  `
  CREATE TABLE wa_numbers (
    id                   INTEGER PRIMARY KEY,
    workspace_id         INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id              TEXT    NOT NULL,
    phone_number_id      TEXT    NOT NULL UNIQUE,
    display_phone_number TEXT    NOT NULL,
    verified_name        TEXT,
    business_id          TEXT,
    meta_user_id         TEXT,
    token_enc            TEXT,
    pin_enc              TEXT,
    coexistence          INTEGER NOT NULL DEFAULT 0,
    quality_rating       TEXT,
    status               TEXT    NOT NULL CHECK (status IN ('active', 'reconnect_needed', 'disconnected')),
    status_detail        TEXT,
    history_status       TEXT    CHECK (history_status IN ('requested', 'in_progress', 'complete', 'declined', 'failed')),
    history_progress     INTEGER,
    created_at           INTEGER NOT NULL,
    updated_at           INTEGER NOT NULL
  );
  CREATE INDEX wa_numbers_workspace ON wa_numbers(workspace_id);
  CREATE INDEX wa_numbers_waba ON wa_numbers(waba_id);

  CREATE TABLE wa_templates (
    id               INTEGER PRIMARY KEY,
    workspace_id     INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    waba_id          TEXT    NOT NULL,
    template_id      TEXT    NOT NULL UNIQUE,
    name             TEXT    NOT NULL,
    language         TEXT    NOT NULL,
    category         TEXT    NOT NULL,
    status           TEXT    NOT NULL,
    parameter_format TEXT    NOT NULL DEFAULT 'positional',
    components       TEXT    NOT NULL DEFAULT '[]',
    rejected_reason  TEXT,
    updated_at       INTEGER NOT NULL
  );
  CREATE INDEX wa_templates_waba ON wa_templates(waba_id, status);

  CREATE TABLE wa_contacts (
    wa_number_id INTEGER NOT NULL REFERENCES wa_numbers(id) ON DELETE CASCADE,
    phone        TEXT    NOT NULL,
    name         TEXT,
    updated_at   INTEGER NOT NULL,
    PRIMARY KEY (wa_number_id, phone)
  );

  CREATE TABLE conversations_v3 (
    id                   INTEGER PRIMARY KEY,
    workspace_id         INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    connection_id        INTEGER REFERENCES connections(id) ON DELETE CASCADE,
    wa_number_id         INTEGER REFERENCES wa_numbers(id) ON DELETE CASCADE,
    channel              TEXT    NOT NULL CHECK (channel IN ('messenger', 'instagram', 'whatsapp')),
    participant_id       TEXT    NOT NULL,
    participant_phone    TEXT,
    participant_username TEXT,
    participant_name     TEXT,
    participant_picture  TEXT,
    profile_fetched_at   INTEGER,
    last_inbound_at      INTEGER,
    last_message_at      INTEGER NOT NULL,
    last_message_preview TEXT,
    created_at           INTEGER NOT NULL,
    CHECK ((connection_id IS NULL) != (wa_number_id IS NULL))
  );
  INSERT INTO conversations_v3 (id, workspace_id, connection_id, channel, participant_id, participant_name, participant_picture,
    profile_fetched_at, last_inbound_at, last_message_at, last_message_preview, created_at)
  SELECT id, workspace_id, connection_id, channel, participant_id, participant_name, participant_picture,
    profile_fetched_at, last_inbound_at, last_message_at, last_message_preview, created_at FROM conversations;

  CREATE TABLE messages_v3 (
    id               INTEGER PRIMARY KEY,
    public_id        TEXT    NOT NULL UNIQUE,
    workspace_id     INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id  INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction        TEXT    NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    source           TEXT    NOT NULL CHECK (source IN ('customer', 'api', 'console', 'page_inbox', 'business_app', 'history')),
    kind             TEXT    NOT NULL DEFAULT 'text',
    mid              TEXT    UNIQUE,
    text             TEXT,
    attachments      TEXT    NOT NULL DEFAULT '[]',
    postback         TEXT,
    template         TEXT,
    status           TEXT    NOT NULL CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    error            TEXT,
    idempotency_key  TEXT,
    sent_by_staff_id INTEGER REFERENCES staff_users(id) ON DELETE SET NULL,
    sent_by_user_id  INTEGER REFERENCES client_users(id) ON DELETE SET NULL,
    meta_timestamp   INTEGER NOT NULL,
    created_at       INTEGER NOT NULL,
    UNIQUE (workspace_id, idempotency_key)
  );
  INSERT INTO messages_v3 (id, public_id, workspace_id, conversation_id, direction, source, mid, text, attachments, postback, status,
    error, idempotency_key, sent_by_staff_id, meta_timestamp, created_at)
  SELECT id, public_id, workspace_id, conversation_id, direction, source, mid, text, attachments, postback, status,
    error, idempotency_key, sent_by_staff_id, meta_timestamp, created_at FROM messages;

  DROP TABLE messages;
  DROP TABLE conversations;
  ALTER TABLE conversations_v3 RENAME TO conversations;
  ALTER TABLE messages_v3 RENAME TO messages;

  CREATE UNIQUE INDEX conversations_page_participant ON conversations(connection_id, channel, participant_id) WHERE connection_id IS NOT NULL;
  CREATE UNIQUE INDEX conversations_wa_participant ON conversations(wa_number_id, participant_id) WHERE wa_number_id IS NOT NULL;
  CREATE INDEX conversations_wa_phone ON conversations(wa_number_id, participant_phone) WHERE wa_number_id IS NOT NULL;
  CREATE INDEX conversations_recent ON conversations(workspace_id, last_message_at DESC);
  CREATE INDEX messages_thread ON messages(conversation_id, meta_timestamp);
  CREATE INDEX messages_age ON messages(created_at);
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
  if (current >= MIGRATIONS.length) return;
  // Table rebuilds drop tables other tables reference, so foreign keys are
  // switched off for the duration (it can't change inside a transaction) and
  // checked before committing each migration.
  db.pragma('foreign_keys = OFF');
  try {
    for (let i = current; i < MIGRATIONS.length; i++) {
      db.transaction(() => {
        db.exec(MIGRATIONS[i]);
        const violations = db.pragma('foreign_key_check') as unknown[];
        if (violations.length) throw new Error(`Migration ${i + 1} left ${violations.length} foreign key violations`);
        db.pragma(`user_version = ${i + 1}`);
      })();
    }
  } finally {
    db.pragma('foreign_keys = ON');
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
