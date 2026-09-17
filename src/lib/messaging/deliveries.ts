import 'server-only';
import { getDb, now, type Db } from './db';
import { randomToken } from './crypto';
import { signClientPayload } from './signatures';
import { workspaceSecret } from './workspaces';
import { errorSummary, log } from '@/lib/log';

/**
 * Forwarding normalised events to each client's webhook URL, signed with the
 * client's secret. Failed deliveries back off exponentially and become "dead"
 * after the last attempt; staff can retry dead ones from the console.
 */

export const RETRY_DELAYS_MS = [30e3, 2 * 60e3, 10 * 60e3, 30 * 60e3, 60 * 60e3, 3 * 3600e3, 6 * 3600e3, 12 * 3600e3];
const LOCK_MS = 60_000;

export interface ForwardEvent {
  id: string;
  type: 'message.received';
  clientId: string;
  channel: 'messenger' | 'instagram';
  direction: 'inbound';
  pageId: string;
  igAccountId: string | null;
  senderId: string;
  senderName: string | null;
  messageId: string;
  mid: string | null;
  text: string | null;
  attachments: { type: string; url: string | null }[];
  postback: { title: string | null; payload: string | null } | null;
  timestamp: string;
  raw: unknown;
}

export function enqueueDelivery(db: Db, workspaceId: number, messageId: number, event: ForwardEvent) {
  db.prepare(`
    INSERT OR IGNORE INTO deliveries (workspace_id, message_id, event_id, payload, status, next_attempt_at, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `).run(workspaceId, messageId, event.id, JSON.stringify(event), now(), now());
}

export function newEventId(): string {
  return `evt_${randomToken(12)}`;
}

interface DeliveryRow {
  id: number;
  workspace_id: number;
  event_id: string;
  payload: string;
  attempts: number;
  forward_url: string | null;
}

export async function postSigned(url: string, secret: string, eventId: string, body: string): Promise<{ ok: boolean; status: number | null; error: string | null }> {
  const timestamp = Math.floor(now() / 1000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OYLabs-Webhooks/1.0',
        'X-OYLABS-Event-Id': eventId,
        'X-OYLABS-Timestamp': String(timestamp),
        'X-OYLABS-Signature': signClientPayload(secret, timestamp, body),
      },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    await res.body?.cancel().catch(() => undefined);
    return { ok: res.status >= 200 && res.status < 300, status: res.status, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, status: null, error: errorSummary(err) };
  }
}

export async function deliverDue(batch = 10): Promise<number> {
  const db = getDb();
  const rows = db.prepare(`
    UPDATE deliveries SET locked_until = @lock
    WHERE id IN (
      SELECT id FROM deliveries
      WHERE status = 'pending' AND next_attempt_at <= @now AND (locked_until IS NULL OR locked_until < @now)
      ORDER BY next_attempt_at LIMIT @batch
    )
    RETURNING id, workspace_id, event_id, payload, attempts,
      (SELECT forward_url FROM workspaces w WHERE w.id = deliveries.workspace_id) AS forward_url
  `).all({ now: now(), lock: now() + LOCK_MS, batch }) as DeliveryRow[];

  for (const row of rows) {
    const attempts = row.attempts + 1;
    if (!row.forward_url) {
      db.prepare(`UPDATE deliveries SET status = 'dead', attempts = ?, last_error = 'No forwarding URL configured', locked_until = NULL WHERE id = ?`)
        .run(attempts, row.id);
      continue;
    }
    const result = await postSigned(row.forward_url, workspaceSecret(row.workspace_id), row.event_id, row.payload);
    if (result.ok) {
      db.prepare(`UPDATE deliveries SET status = 'delivered', attempts = ?, last_status = ?, last_error = NULL, delivered_at = ?, locked_until = NULL WHERE id = ?`)
        .run(attempts, result.status, now(), row.id);
      log.info('delivery.succeeded', { deliveryId: row.id, workspaceId: row.workspace_id, attempts });
    } else {
      const delay = RETRY_DELAYS_MS[attempts - 1];
      const status = delay === undefined ? 'dead' : 'pending';
      db.prepare(`UPDATE deliveries SET status = ?, attempts = ?, last_status = ?, last_error = ?, next_attempt_at = ?, locked_until = NULL WHERE id = ?`)
        .run(status, attempts, result.status, result.error, now() + (delay ?? 0), row.id);
      log.warn('delivery.failed', { deliveryId: row.id, workspaceId: row.workspace_id, attempts, status: result.status, dead: status === 'dead' });
    }
  }
  return rows.length;
}

export function retryDelivery(workspaceId: number, deliveryId: number) {
  getDb().prepare(`UPDATE deliveries SET status = 'pending', next_attempt_at = ?, locked_until = NULL WHERE id = ? AND workspace_id = ? AND status = 'dead'`)
    .run(now(), deliveryId, workspaceId);
}

export interface DeliverySummary {
  id: number;
  event_id: string;
  status: 'pending' | 'delivered' | 'dead';
  attempts: number;
  last_status: number | null;
  last_error: string | null;
  created_at: number;
  next_attempt_at: number;
  delivered_at: number | null;
}

export function listDeliveries(workspaceId: number, filter: 'all' | 'dead' = 'all', limit = 50): DeliverySummary[] {
  return getDb().prepare(`
    SELECT id, event_id, status, attempts, last_status, last_error, created_at, next_attempt_at, delivered_at
    FROM deliveries WHERE workspace_id = ? ${filter === 'dead' ? "AND status = 'dead'" : ''}
    ORDER BY created_at DESC LIMIT ?
  `).all(workspaceId, limit) as DeliverySummary[];
}

/** Sends a signed test event straight away so staff can check a client's endpoint. */
export async function sendTestDelivery(workspaceId: number, forwardUrl: string) {
  const eventId = newEventId();
  const body = JSON.stringify({ id: eventId, type: 'test', clientId: String(workspaceId), timestamp: new Date().toISOString() });
  return postSigned(forwardUrl, workspaceSecret(workspaceId), eventId, body);
}
