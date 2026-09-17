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
  if ((payload as { object?: string })?.object === 'whatsapp_business_account') return ingestWhatsApp(body as WaWebhookBody);
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

/* ── WhatsApp Business Account webhooks ───────────────────────────────── */

interface WaWebhookBody {
  object: 'whatsapp_business_account';
  entry?: { id?: string; time?: number; changes?: { field?: string; value?: Record<string, unknown> }[] }[];
}

type WaMetadata = { display_phone_number?: string; phone_number_id?: string };

/**
 * One stored row per message, status, echo, history message, contact change
 * or account/template event. account_id is the phone number ID (or the
 * WhatsApp Business Account ID for account-level events).
 */
export function ingestWhatsApp(body: WaWebhookBody): { stored: number; duplicates: number; skipped: number } {
  const result = { stored: 0, duplicates: 0, skipped: 0 };
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO webhook_events (dedupe_key, object, account_id, payload, status, next_attempt_at, received_at)
    VALUES (?, 'whatsapp', ?, ?, 'pending', ?, ?)
  `);
  const store = (key: string, accountId: string | undefined, payload: object) => {
    if (!accountId) {
      result.skipped++;
      return;
    }
    const { changes } = insert.run(key, accountId, JSON.stringify(payload), now(), now());
    if (changes) result.stored++;
    else result.duplicates++;
  };

  db.transaction(() => {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const metadata = (value.metadata ?? {}) as WaMetadata;
        const phoneId = metadata.phone_number_id;
        switch (change.field) {
          case 'messages': {
            const contacts = value.contacts ?? [];
            for (const message of (value.messages as { id?: string }[] | undefined) ?? []) {
              store(`wa:msg:${message.id}`, phoneId, { field: 'messages', wabaId: entry.id, metadata, contacts, message });
            }
            for (const status of (value.statuses as { id?: string; status?: string }[] | undefined) ?? []) {
              store(`wa:status:${status.id}:${status.status}`, phoneId, { field: 'statuses', wabaId: entry.id, metadata, contacts, status });
            }
            break;
          }
          case 'smb_message_echoes':
            for (const message of (value.message_echoes as { id?: string }[] | undefined) ?? []) {
              store(`wa:echo:${message.id}`, phoneId, { field: 'echo', wabaId: entry.id, metadata, message });
            }
            break;
          case 'history':
            for (const chunk of (value.history as { metadata?: { phase?: number; chunk_order?: number; progress?: number }; threads?: { id?: string; messages?: { id?: string }[] }[]; errors?: { code?: number }[] }[] | undefined) ?? []) {
              if (chunk.errors?.length) {
                store(`wa:history_error:${phoneId}:${chunk.errors[0].code}`, phoneId, { field: 'history_error', wabaId: entry.id, metadata, errors: chunk.errors });
                continue;
              }
              for (const thread of chunk.threads ?? []) {
                for (const message of thread.messages ?? []) {
                  store(`wa:hist:${message.id}`, phoneId, { field: 'history', wabaId: entry.id, metadata, threadId: thread.id, message });
                }
              }
              const m = chunk.metadata ?? {};
              store(`wa:hist_progress:${phoneId}:${m.phase}:${m.chunk_order}`, phoneId, { field: 'history_progress', wabaId: entry.id, metadata, progress: m.progress ?? null, phase: m.phase ?? null });
            }
            break;
          case 'smb_app_state_sync':
            for (const item of (value.state_sync as { contact?: { phone_number?: string }; action?: string; metadata?: { timestamp?: string } }[] | undefined) ?? []) {
              store(`wa:contact:${phoneId}:${item.contact?.phone_number}:${item.metadata?.timestamp}:${item.action}`, phoneId, { field: 'contact', wabaId: entry.id, metadata, item });
            }
            break;
          case 'message_template_status_update':
            store(`wa:tpl:${value.message_template_id}:${value.event}:${entry.time ?? ''}`, entry.id, { field: 'template_status', wabaId: entry.id, value });
            break;
          case 'account_update':
            store(`wa:account:${entry.id}:${value.event}:${entry.time ?? ''}`, entry.id, { field: 'account_update', wabaId: entry.id, value });
            break;
          default:
            result.skipped++;
        }
      }
    }
  })();
  return result;
}
