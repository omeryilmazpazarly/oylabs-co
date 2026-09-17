import 'server-only';
import { getDb, now } from './db';
import { randomToken } from './crypto';
import type { MessagingItem } from './events';
import { enqueueDelivery, newEventId, type ForwardEvent } from './deliveries';
import { pageTokenFor, markReconnectNeeded } from './connections';
import { previewText, type Attachment, type Channel } from './conversations';
import * as graph from './graph';
import { errorSummary, log } from '@/lib/log';

/**
 * Turns stored webhook items into conversations and messages, then queues a
 * forward to the owning client. Runs in the background worker.
 */

const LOCK_MS = 60_000;
const MAX_ATTEMPTS = 5;
const PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface EventRow {
  id: number;
  object: 'page' | 'instagram';
  account_id: string;
  payload: string;
  attempts: number;
}

interface RoutedConnection {
  id: number;
  workspace_id: number;
  page_id: string;
  ig_account_id: string | null;
  status: string;
  forward_url: string | null;
}

/** Finds the client connection an event belongs to: Instagram events by IG account, Messenger by Page. */
export function routeEvent(object: 'page' | 'instagram', accountId: string): { connection: RoutedConnection; channel: Channel } | null {
  const db = getDb();
  const select = `
    SELECT c.id, c.workspace_id, c.page_id, c.ig_account_id, c.status, w.forward_url
    FROM connections c JOIN workspaces w ON w.id = c.workspace_id
    WHERE c.status != 'disconnected' AND `;
  if (object === 'instagram') {
    const byIg = db.prepare(`${select} c.ig_account_id = ?`).get(accountId) as RoutedConnection | undefined;
    return byIg ? { connection: byIg, channel: 'instagram' } : null;
  }
  const byPage = db.prepare(`${select} c.page_id = ?`).get(accountId) as RoutedConnection | undefined;
  return byPage ? { connection: byPage, channel: 'messenger' } : null;
}

export function normaliseAttachments(item: MessagingItem): Attachment[] {
  return (item.message?.attachments ?? []).map((a) => ({ type: a.type ?? 'unknown', url: a.payload?.url ?? null }));
}

export async function processDueEvents(batch = 20): Promise<number> {
  const db = getDb();
  const rows = db.prepare(`
    UPDATE webhook_events SET locked_until = @lock
    WHERE id IN (
      SELECT id FROM webhook_events
      WHERE status = 'pending' AND next_attempt_at <= @now AND (locked_until IS NULL OR locked_until < @now)
      ORDER BY id LIMIT @batch
    )
    RETURNING id, object, account_id, payload, attempts
  `).all({ now: now(), lock: now() + LOCK_MS, batch }) as EventRow[];

  for (const row of rows) {
    try {
      const outcome = await processEvent(row);
      db.prepare('UPDATE webhook_events SET status = ?, processed_at = ?, locked_until = NULL, last_error = NULL WHERE id = ?')
        .run(outcome, now(), row.id);
    } catch (err) {
      const attempts = row.attempts + 1;
      const failed = attempts >= MAX_ATTEMPTS;
      db.prepare(`UPDATE webhook_events SET status = ?, attempts = ?, next_attempt_at = ?, locked_until = NULL, last_error = ? WHERE id = ?`)
        .run(failed ? 'failed' : 'pending', attempts, now() + 2 ** attempts * 10_000, errorSummary(err), row.id);
      log.error('webhook.event.failed', { eventId: row.id, attempts, final: failed, error: errorSummary(err) });
    }
  }
  return rows.length;
}

export async function processEvent(row: EventRow): Promise<'done' | 'ignored'> {
  const item = JSON.parse(row.payload) as MessagingItem;
  const routed = routeEvent(row.object, row.account_id);
  if (!routed) {
    log.info('webhook.event.unrouted', { eventId: row.id, object: row.object });
    return 'ignored';
  }
  const { connection, channel } = routed;
  const db = getDb();

  // Customer unsent a message: remove our copy.
  if (item.message?.is_deleted && item.message.mid) {
    db.prepare('DELETE FROM messages WHERE mid = ? AND workspace_id = ?').run(item.message.mid, connection.workspace_id);
    return 'done';
  }

  const isEcho = Boolean(item.message?.is_echo);
  const participantId = isEcho ? item.recipient?.id : item.sender?.id;
  if (!participantId || (!item.message && !item.postback)) return 'ignored';

  const timestamp = item.timestamp ?? now();
  const attachments = normaliseAttachments(item);
  const text = item.message?.text ?? item.postback?.title ?? null;
  const postback = item.postback ? { title: item.postback.title ?? null, payload: item.postback.payload ?? null } : null;
  const mid = item.message?.mid ?? item.postback?.mid ?? null;
  const direction = isEcho ? 'outbound' : 'inbound';

  const conversation = db.transaction(() => {
    db.prepare(`
      INSERT INTO conversations (workspace_id, connection_id, channel, participant_id, last_message_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(connection_id, channel, participant_id) DO NOTHING
    `).run(connection.workspace_id, connection.id, channel, participantId, timestamp, now());
    return db.prepare(`SELECT id, participant_name, profile_fetched_at FROM conversations WHERE connection_id = ? AND channel = ? AND participant_id = ?`)
      .get(connection.id, channel, participantId) as { id: number; participant_name: string | null; profile_fetched_at: number | null };
  })();

  const publicId = `msg_${randomToken(12)}`;
  const inserted = db.prepare(`
    INSERT OR IGNORE INTO messages (public_id, workspace_id, conversation_id, direction, source, mid, text, attachments, postback, status, meta_timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(publicId, connection.workspace_id, conversation.id, direction, isEcho ? 'page_inbox' : 'customer', mid, text,
    JSON.stringify(attachments), postback ? JSON.stringify(postback) : null, isEcho ? 'sent' : 'received', timestamp, now());

  if (!inserted.changes) return 'done'; // already recorded (e.g. echo of a message we sent through the API)

  db.prepare(`
    UPDATE conversations SET
      last_message_at = MAX(last_message_at, @ts),
      last_message_preview = CASE WHEN @ts >= last_message_at THEN @preview ELSE last_message_preview END,
      last_inbound_at = CASE WHEN @inbound THEN MAX(COALESCE(last_inbound_at, 0), @ts) ELSE last_inbound_at END
    WHERE id = @id
  `).run({ ts: timestamp, preview: previewText(text, attachments), inbound: isEcho ? 0 : 1, id: conversation.id });

  if (isEcho) return 'done';

  let senderName = conversation.participant_name;
  if (!conversation.profile_fetched_at || now() - conversation.profile_fetched_at > PROFILE_TTL_MS) {
    senderName = (await refreshProfile(conversation.id, connection.id, channel, participantId)) ?? senderName;
  }

  if (connection.forward_url) {
    const event: ForwardEvent = {
      id: newEventId(),
      type: 'message.received',
      clientId: String(connection.workspace_id),
      channel,
      direction: 'inbound',
      pageId: connection.page_id,
      igAccountId: channel === 'instagram' ? connection.ig_account_id : null,
      senderId: participantId,
      senderName,
      messageId: publicId,
      mid,
      text,
      attachments,
      postback,
      timestamp: new Date(timestamp).toISOString(),
      raw: item,
    };
    const messageId = (db.prepare('SELECT id FROM messages WHERE public_id = ?').get(publicId) as { id: number }).id;
    enqueueDelivery(db, connection.workspace_id, messageId, event);
  }
  return 'done';
}

/** Best effort: a missing name must never block delivering the message. */
async function refreshProfile(conversationId: number, connectionId: number, channel: Channel, participantId: string): Promise<string | null> {
  const db = getDb();
  const token = pageTokenFor(connectionId);
  if (!token) return null;
  try {
    const profile = await graph.fetchProfile(channel, participantId, token);
    db.prepare('UPDATE conversations SET participant_name = COALESCE(?, participant_name), participant_picture = ?, profile_fetched_at = ? WHERE id = ?')
      .run(profile.name, profile.picture, now(), conversationId);
    return profile.name;
  } catch (err) {
    db.prepare('UPDATE conversations SET profile_fetched_at = ? WHERE id = ?').run(now(), conversationId);
    if (err instanceof graph.GraphError && err.tokenInvalid) markReconnectNeeded(connectionId, 'Meta rejected the Page token while loading a profile');
    else log.info('profile.lookup.failed', { connectionId, channel, error: errorSummary(err) });
    return null;
  }
}
