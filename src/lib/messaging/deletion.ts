import 'server-only';
import { getDb, now } from './db';
import { randomToken } from './crypto';
import { env } from './env';
import * as graph from './graph';
import { parseSignedRequest } from './signatures';
import { decryptSecret } from './crypto';
import { errorSummary, log } from '@/lib/log';

/**
 * Meta data deletion and deauthorisation callbacks, plus staff-initiated
 * deletion of one person's conversation.
 */

export function statusUrl(code: string) {
  return `${env.appBaseUrl()}/data-deletion/status?code=${encodeURIComponent(code)}`;
}

function newConfirmationCode(): string {
  return `DEL${randomToken(9).replace(/[^A-Za-z0-9]/g, '').toUpperCase().padEnd(10, '0').slice(0, 10)}`;
}

interface ConnectionTokens {
  id: number;
  page_id: string;
  ig_account_id: string | null;
  page_token_enc: string | null;
}

async function unsubscribeQuietly(conn: ConnectionTokens) {
  if (!conn.page_token_enc) return;
  try {
    await graph.unsubscribePage(conn.page_id, decryptSecret(conn.page_token_enc));
  } catch (err) {
    log.info('deletion.unsubscribe.failed', { connectionId: conn.id, error: errorSummary(err) });
  }
}

/** Deletes every connection authorised by this Meta user, with all their conversations, messages and queued events. */
export async function handleDataDeletionRequest(signedRequest: string): Promise<{ url: string; confirmation_code: string } | null> {
  const payload = parseSignedRequest(signedRequest, env.metaAppSecret());
  if (!payload) return null;

  const db = getDb();
  const connections = db.prepare('SELECT id, page_id, ig_account_id, page_token_enc FROM connections WHERE meta_user_id = ?')
    .all(payload.user_id) as ConnectionTokens[];
  for (const conn of connections) await unsubscribeQuietly(conn);

  const code = newConfirmationCode();
  const counts = db.transaction(() => {
    let messages = 0;
    for (const conn of connections) {
      messages += (db.prepare('SELECT COUNT(*) AS n FROM messages m JOIN conversations v ON v.id = m.conversation_id WHERE v.connection_id = ?')
        .get(conn.id) as { n: number }).n;
      db.prepare('DELETE FROM webhook_events WHERE account_id IN (?, ?)').run(conn.page_id, conn.ig_account_id ?? '');
      db.prepare('DELETE FROM connections WHERE id = ?').run(conn.id); // cascades to conversations → messages → deliveries
    }
    db.prepare('DELETE FROM oauth_sessions WHERE meta_user_id = ?').run(payload.user_id);
    db.prepare(`
      INSERT INTO deletion_requests (confirmation_code, meta_user_id, source, status, connections_deleted, messages_deleted, created_at, completed_at)
      VALUES (?, ?, 'meta_callback', ?, ?, ?, ?, ?)
    `).run(code, payload.user_id, connections.length ? 'completed' : 'no_data', connections.length, messages, now(), now());
    return { messages };
  })();

  log.info('deletion.callback.completed', { connections: connections.length, messages: counts.messages });
  return { url: statusUrl(code), confirmation_code: code };
}

/** The person removed the app: stop processing and delete their tokens. Conversation history follows retention. */
export async function handleDeauthorize(signedRequest: string): Promise<boolean> {
  const payload = parseSignedRequest(signedRequest, env.metaAppSecret());
  if (!payload) return false;
  const { changes } = getDb().prepare(`
    UPDATE connections SET status = 'disconnected', status_detail = 'App removed in Facebook settings',
      page_token_enc = NULL, business_token_enc = NULL, updated_at = ?
    WHERE meta_user_id = ?
  `).run(now(), payload.user_id);
  log.info('meta.deauthorized', { connections: changes });
  return true;
}

/** Staff action for requests emailed to hi@oylabs.co by someone who messaged a client. */
export function deleteConversationData(conversationId: number): string | null {
  const db = getDb();
  const code = newConfirmationCode();
  return db.transaction(() => {
    const row = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?').get(conversationId) as { n: number };
    const { changes } = db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);
    if (!changes) return null;
    db.prepare(`
      INSERT INTO deletion_requests (confirmation_code, source, status, connections_deleted, messages_deleted, created_at, completed_at)
      VALUES (?, 'staff', 'completed', 0, ?, ?, ?)
    `).run(code, row.n, now(), now());
    return code;
  })();
}

export function getDeletionStatus(code: string) {
  return (getDb().prepare('SELECT confirmation_code, status, created_at, completed_at FROM deletion_requests WHERE confirmation_code = ?')
    .get(code) as { confirmation_code: string; status: 'completed' | 'no_data'; created_at: number; completed_at: number | null } | undefined) ?? null;
}
