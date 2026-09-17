import 'server-only';
import { getDb, now } from './db';
import { decryptSecret, encryptSecret, randomToken, sha256Hex } from './crypto';
import { env } from './env';
import * as graph from './graph';
import { errorSummary, log } from '@/lib/log';
import { activeChannelCount, getWorkspace } from './workspaces';
import { pageLimit, serviceState } from '@/lib/billing/entitlements';

/**
 * Connecting a client's Facebook Page (and its linked Instagram professional
 * account) through Facebook Login for Business.
 *
 *   staff creates connect link ──► client opens /connect/<token>
 *   ──► /api/meta/oauth/start (state cookie) ──► Facebook consent
 *   ──► /api/meta/oauth/callback (code → token, list granted Pages)
 *   ──► /connect/select (choose Page) ──► finalizeConnection (subscribe webhooks, store encrypted token)
 */

export const CONNECT_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_SESSION_TTL_MS = 30 * 60 * 1000;
export const STATE_COOKIE = 'oy_meta_state';

export type ConnectionStatus = 'active' | 'reconnect_needed' | 'disconnected';

export interface Connection {
  id: number;
  workspace_id: number;
  page_id: string;
  page_name: string;
  ig_account_id: string | null;
  ig_username: string | null;
  client_business_id: string | null;
  status: ConnectionStatus;
  status_detail: string | null;
  created_at: number;
  updated_at: number;
}

const CONNECTION_COLUMNS = 'id, workspace_id, page_id, page_name, ig_account_id, ig_username, client_business_id, status, status_detail, created_at, updated_at';

export const redirectUri = () => `${env.appBaseUrl()}/api/meta/oauth/callback`;

/* ── Connect links ───────────────────────────────────────────────────── */

export function createConnectLink(workspaceId: number, staffId: number | null): { url: string; expiresAt: number } {
  const token = randomToken(24);
  const expiresAt = now() + CONNECT_LINK_TTL_MS;
  getDb().prepare('INSERT INTO connect_links (workspace_id, token_hash, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(workspaceId, sha256Hex(token), staffId, now(), expiresAt);
  return { url: `${env.appBaseUrl()}/connect/${token}`, expiresAt };
}

export type LinkLookup =
  | { ok: true; linkId: number; workspaceId: number; workspaceName: string; expiresAt: number }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' };

export function resolveConnectLink(token: string): LinkLookup {
  const row = getDb().prepare(`
    SELECT l.id, l.workspace_id, l.expires_at, l.used_at, w.name
    FROM connect_links l JOIN workspaces w ON w.id = l.workspace_id
    WHERE l.token_hash = ?
  `).get(sha256Hex(token)) as { id: number; workspace_id: number; expires_at: number; used_at: number | null; name: string } | undefined;
  if (!row) return { ok: false, reason: 'invalid' };
  if (row.used_at) return { ok: false, reason: 'used' };
  if (row.expires_at < now()) return { ok: false, reason: 'expired' };
  return { ok: true, linkId: row.id, workspaceId: row.workspace_id, workspaceName: row.name, expiresAt: row.expires_at };
}

export function listOpenConnectLinks(workspaceId: number) {
  return getDb().prepare(`
    SELECT id, created_at, expires_at FROM connect_links
    WHERE workspace_id = ? AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC
  `).all(workspaceId, now()) as { id: number; created_at: number; expires_at: number }[];
}

export function revokeConnectLink(workspaceId: number, linkId: number) {
  getDb().prepare('DELETE FROM connect_links WHERE id = ? AND workspace_id = ? AND used_at IS NULL').run(linkId, workspaceId);
}

/* ── OAuth ───────────────────────────────────────────────────────────── */

/** Begins the Facebook consent flow for a valid link. Returns the dialog URL and the state to put in a cookie. */
export function beginOAuth(linkToken: string): { dialogUrl: string; state: string } {
  const link = resolveConnectLink(linkToken);
  if (!link.ok) throw new ConnectError(link.reason);
  const state = randomToken(24);
  getDb().prepare('INSERT INTO oauth_sessions (id, link_id, state_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(randomToken(16), link.linkId, sha256Hex(state), now(), now() + OAUTH_SESSION_TTL_MS);
  return { dialogUrl: graph.loginDialogUrl(state, redirectUri()), state };
}

export class ConnectError extends Error {
  constructor(public readonly reason: 'invalid' | 'expired' | 'used' | 'state' | 'no_pages' | 'page' | 'meta' | 'limit' | 'billing' | 'taken' | 'expired_code') {
    super(reason);
    this.name = 'ConnectError';
  }
}

interface StoredPage {
  id: string;
  name: string;
  token: string;
  igId: string | null;
  igUsername: string | null;
}

interface OAuthSessionRow {
  id: string;
  link_id: number;
  meta_user_id: string | null;
  client_business_id: string | null;
  business_token_enc: string | null;
  pages_enc: string | null;
}

function sessionForState(state: string | undefined): OAuthSessionRow {
  if (!state) throw new ConnectError('state');
  const row = getDb().prepare(`
    SELECT id, link_id, meta_user_id, client_business_id, business_token_enc, pages_enc
    FROM oauth_sessions WHERE state_hash = ? AND expires_at > ?
  `).get(sha256Hex(state), now()) as OAuthSessionRow | undefined;
  if (!row) throw new ConnectError('state');
  return row;
}

/**
 * Handles the redirect back from Facebook: verifies state, exchanges the code,
 * and stores the granted Pages (tokens encrypted) on the OAuth session.
 */
export async function completeOAuth(code: string, stateParam: string, stateCookie: string | undefined): Promise<void> {
  if (!stateCookie || stateCookie !== stateParam) throw new ConnectError('state');
  const session = sessionForState(stateCookie);
  const link = getDb().prepare('SELECT used_at, expires_at FROM connect_links WHERE id = ?').get(session.link_id) as { used_at: number | null; expires_at: number } | undefined;
  if (!link) throw new ConnectError('invalid');
  if (link.used_at) throw new ConnectError('used');

  try {
    let { access_token: token } = await graph.exchangeCode(code, redirectUri());
    const info = await graph.debugToken(token);
    if (info.type === 'USER') {
      // A user-token Login configuration: upgrade so the derived Page tokens don't expire.
      token = (await graph.exchangeLongLivedUserToken(token)).access_token;
    }
    const me = await graph.getMe(token);
    const clientBusinessId = await graph.getClientBusinessId(token);
    const pages: StoredPage[] = (await graph.listGrantedPages(token)).map((p) => ({
      id: p.id,
      name: p.name,
      token: p.access_token,
      igId: p.instagram_business_account?.id ?? null,
      igUsername: p.instagram_business_account?.username ?? null,
    }));

    getDb().prepare(`
      UPDATE oauth_sessions SET meta_user_id = ?, client_business_id = ?, business_token_enc = ?, pages_enc = ? WHERE id = ?
    `).run(info.user_id ?? me.id, clientBusinessId, encryptSecret(token), encryptSecret(JSON.stringify(pages)), session.id);

    log.info('meta.oauth.completed', { linkId: session.link_id, pages: pages.length, tokenType: info.type ?? 'unknown' });
    if (pages.length === 0) throw new ConnectError('no_pages');
  } catch (err) {
    if (err instanceof ConnectError) throw err;
    log.warn('meta.oauth.failed', { linkId: session.link_id, error: errorSummary(err) });
    throw new ConnectError('meta');
  }
}

export interface PageChoice {
  id: string;
  name: string;
  igUsername: string | null;
  hasInstagram: boolean;
  connectedElsewhere: boolean;
}

/** Pages the person granted, for the selection screen (no tokens leave this module). */
export function pendingPageChoices(stateCookie: string | undefined): { workspaceName: string; pages: PageChoice[] } {
  const session = sessionForState(stateCookie);
  if (!session.pages_enc) throw new ConnectError('state');
  const pages = JSON.parse(decryptSecret(session.pages_enc)) as StoredPage[];
  const link = getDb().prepare('SELECT l.workspace_id, w.name FROM connect_links l JOIN workspaces w ON w.id = l.workspace_id WHERE l.id = ?')
    .get(session.link_id) as { workspace_id: number; name: string };
  const taken = getDb().prepare(`SELECT page_id FROM connections WHERE workspace_id != ? AND status != 'disconnected'`)
    .all(link.workspace_id) as { page_id: string }[];
  const takenIds = new Set(taken.map((t) => t.page_id));
  return {
    workspaceName: link.name,
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      igUsername: p.igUsername,
      hasInstagram: Boolean(p.igId),
      connectedElsewhere: takenIds.has(p.id),
    })),
  };
}

/** Subscribes the chosen Page to webhooks and saves the connection. Consumes the link. */
export async function finalizeConnection(stateCookie: string | undefined, pageId: string): Promise<{ workspaceName: string; connection: Connection }> {
  const session = sessionForState(stateCookie);
  if (!session.pages_enc || !session.business_token_enc) throw new ConnectError('state');
  const pages = JSON.parse(decryptSecret(session.pages_enc)) as StoredPage[];
  const page = pages.find((p) => p.id === pageId);
  if (!page) throw new ConnectError('page');

  const db = getDb();
  const link = db.prepare('SELECT l.workspace_id, l.used_at, w.name FROM connect_links l JOIN workspaces w ON w.id = l.workspace_id WHERE l.id = ?')
    .get(session.link_id) as { workspace_id: number; used_at: number | null; name: string };
  if (link.used_at) throw new ConnectError('used');

  const existing = db.prepare(`SELECT workspace_id, status FROM connections WHERE page_id = ?`).get(page.id) as { workspace_id: number; status: ConnectionStatus } | undefined;
  if (existing && existing.workspace_id !== link.workspace_id && existing.status !== 'disconnected') throw new ConnectError('page');

  assertCanConnect(link.workspace_id, page.id);

  try {
    await graph.subscribePage(page.id, page.token);
  } catch (err) {
    log.warn('meta.subscribe.failed', { pageId: page.id, error: errorSummary(err) });
    throw new ConnectError('meta');
  }

  const t = now();
  db.transaction(() => {
    // An Instagram account can only route to one Page connection.
    if (page.igId) db.prepare('UPDATE connections SET ig_account_id = NULL, ig_username = NULL WHERE ig_account_id = ? AND page_id != ?').run(page.igId, page.id);
    db.prepare(`
      INSERT INTO connections (workspace_id, page_id, page_name, ig_account_id, ig_username, client_business_id, meta_user_id,
                               page_token_enc, business_token_enc, status, status_detail, created_at, updated_at)
      VALUES (@workspaceId, @pageId, @pageName, @igId, @igUsername, @businessId, @metaUserId, @pageToken, @businessToken, 'active', NULL, @t, @t)
      ON CONFLICT(page_id) DO UPDATE SET
        workspace_id = excluded.workspace_id, page_name = excluded.page_name, ig_account_id = excluded.ig_account_id,
        ig_username = excluded.ig_username, client_business_id = excluded.client_business_id, meta_user_id = excluded.meta_user_id,
        page_token_enc = excluded.page_token_enc, business_token_enc = excluded.business_token_enc,
        status = 'active', status_detail = NULL, updated_at = excluded.updated_at
    `).run({
      workspaceId: link.workspace_id, pageId: page.id, pageName: page.name, igId: page.igId, igUsername: page.igUsername,
      businessId: session.client_business_id, metaUserId: session.meta_user_id,
      pageToken: encryptSecret(page.token), businessToken: session.business_token_enc, t,
    });
    db.prepare('UPDATE connect_links SET used_at = ? WHERE id = ?').run(t, session.link_id);
    db.prepare('DELETE FROM oauth_sessions WHERE link_id = ?').run(session.link_id);
  })();

  const connection = db.prepare(`SELECT ${CONNECTION_COLUMNS} FROM connections WHERE page_id = ?`).get(page.id) as Connection;
  log.info('meta.connection.created', { workspaceId: link.workspace_id, connectionId: connection.id, instagram: Boolean(page.igId) });
  return { workspaceName: link.name, connection };
}

/** Plan rules: the workspace must be in service and within its channel limit (reconnecting a channel it already has is always allowed). */
export function assertCanAddChannel(workspaceId: number, alreadyConnectedHere: boolean, nowMs: number = now()) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new ConnectError('invalid');
  if (!serviceState(workspace, nowMs).active) throw new ConnectError('billing');
  if (!alreadyConnectedHere && activeChannelCount(workspaceId) >= pageLimit(workspace)) throw new ConnectError('limit');
}

export function assertCanConnect(workspaceId: number, pageId: string, nowMs: number = now()) {
  const alreadyHere = Boolean(getDb().prepare(`SELECT 1 FROM connections WHERE workspace_id = ? AND page_id = ? AND status != 'disconnected'`).get(workspaceId, pageId));
  assertCanAddChannel(workspaceId, alreadyHere, nowMs);
}

/* ── Managing connections ────────────────────────────────────────────── */

export function listConnections(workspaceId: number): Connection[] {
  return getDb().prepare(`SELECT ${CONNECTION_COLUMNS} FROM connections WHERE workspace_id = ? ORDER BY status = 'active' DESC, page_name`)
    .all(workspaceId) as Connection[];
}

export function getConnection(id: number): Connection | null {
  return (getDb().prepare(`SELECT ${CONNECTION_COLUMNS} FROM connections WHERE id = ?`).get(id) as Connection | undefined) ?? null;
}

export function pageTokenFor(connectionId: number): string | null {
  const row = getDb().prepare('SELECT page_token_enc FROM connections WHERE id = ?').get(connectionId) as { page_token_enc: string | null } | undefined;
  return row?.page_token_enc ? decryptSecret(row.page_token_enc) : null;
}

export function markReconnectNeeded(connectionId: number, detail: string) {
  getDb().prepare(`UPDATE connections SET status = 'reconnect_needed', status_detail = ?, updated_at = ? WHERE id = ? AND status = 'active'`)
    .run(detail.slice(0, 200), now(), connectionId);
  log.warn('meta.connection.reconnect_needed', { connectionId });
}

/** Unsubscribes webhooks (best effort) and deletes the stored tokens. Message history follows normal retention. */
export async function disconnectConnection(connectionId: number): Promise<void> {
  const connection = getConnection(connectionId);
  if (!connection) return;
  const token = pageTokenFor(connectionId);
  if (token) {
    try {
      await graph.unsubscribePage(connection.page_id, token);
    } catch (err) {
      log.warn('meta.unsubscribe.failed', { connectionId, error: errorSummary(err) });
    }
  }
  getDb().prepare(`
    UPDATE connections SET status = 'disconnected', status_detail = 'Disconnected by OY Labs staff',
      page_token_enc = NULL, business_token_enc = NULL, updated_at = ? WHERE id = ?
  `).run(now(), connectionId);
  log.info('meta.connection.disconnected', { connectionId });
}
