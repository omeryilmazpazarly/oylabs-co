import 'server-only';
import { getDb, now } from './db';

/**
 * Webhook intake: split a Meta payload into one row per messaging item and
 * store it for the worker. This must stay fast (Meta wants a 200 within 5s)
 * and idempotent (Meta retries), so it does no network calls and relies on
 * the UNIQUE dedupe_key to drop redeliveries.
 */

export interface MessagingItem {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    app_id?: number;
    attachments?: { type?: string; payload?: { url?: string } }[];
  };
  postback?: { mid?: string; title?: string; payload?: string };
}

interface WebhookBody {
  object?: string;
  entry?: { id?: string; time?: number; messaging?: MessagingItem[] }[];
}

export function dedupeKey(object: string, accountId: string, item: MessagingItem): string | null {
  if (item.message?.mid) return `${item.message.is_deleted ? 'deleted' : 'mid'}:${item.message.mid}`;
  if (item.postback) {
    return `postback:${object}:${accountId}:${item.sender?.id}:${item.timestamp}:${item.postback.mid ?? item.postback.payload ?? ''}`;
  }
  return null; // reads, deliveries, reactions etc. are not stored
}

export function ingestWebhook(body: unknown): { stored: number; duplicates: number; skipped: number } {
  const payload = body as WebhookBody;
  const result = { stored: 0, duplicates: 0, skipped: 0 };
  if (payload?.object !== 'page' && payload?.object !== 'instagram') return result;

  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO webhook_events (dedupe_key, object, account_id, payload, status, next_attempt_at, received_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `);

  db.transaction(() => {
    for (const entry of payload.entry ?? []) {
      if (!entry.id) continue;
      for (const item of entry.messaging ?? []) {
        const key = dedupeKey(payload.object!, entry.id, item);
        if (!key) {
          result.skipped++;
          continue;
        }
        const { changes } = insert.run(key, payload.object, entry.id, JSON.stringify(item), now(), now());
        if (changes) result.stored++;
        else result.duplicates++;
      }
    }
  })();
  return result;
}
