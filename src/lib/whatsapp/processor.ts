import 'server-only';
import { getDb, now, type Db } from '@/lib/messaging/db';
import { randomToken } from '@/lib/messaging/crypto';
import { env } from '@/lib/messaging/env';
import { enqueueDelivery, newEventId, type ForwardAttachment, type ForwardEvent } from '@/lib/messaging/deliveries';
import { previewText } from '@/lib/messaging/conversations';
import { log } from '@/lib/log';
import { getWaNumber, waNumberByPhoneId, type WaNumber } from './numbers';

/**
 * Applies stored WhatsApp webhook rows: conversations and messages (live,
 * Business-app echoes and imported history), delivery statuses, synced
 * contacts, template status changes and account removal.
 */

const DAY = 24 * 60 * 60 * 1000;
const STATUS_RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

export interface WaMessage {
  id: string;
  from?: string;
  to?: string;
  from_user_id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: WaMedia; video?: WaMedia; audio?: WaMedia; document?: WaMedia; sticker?: WaMedia;
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
  contacts?: { name?: { formatted_name?: string }; phones?: { phone?: string }[] }[];
  interactive?: { type?: string; button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string; description?: string } };
  button?: { payload?: string; text?: string };
  reaction?: { message_id?: string; emoji?: string };
  context?: { id?: string };
  errors?: { code?: number; title?: string }[];
}
interface WaMedia { id?: string; mime_type?: string; caption?: string; filename?: string; link?: string }
interface WaContact { profile?: { name?: string; username?: string }; wa_id?: string; user_id?: string }

type Payload =
  | { field: 'messages'; wabaId: string; metadata: WaMeta; contacts: WaContact[]; message: WaMessage }
  | { field: 'statuses'; wabaId: string; metadata: WaMeta; contacts: WaContact[]; status: WaStatus }
  | { field: 'echo'; wabaId: string; metadata: WaMeta; message: WaMessage }
  | { field: 'history'; wabaId: string; metadata: WaMeta; threadId: string; message: WaMessage }
  | { field: 'history_progress'; wabaId: string; metadata: WaMeta; progress: number | null; phase: number | null }
  | { field: 'history_error'; wabaId: string; metadata: WaMeta; errors: { code?: number }[] }
  | { field: 'contact'; wabaId: string; metadata: WaMeta; item: { contact?: { full_name?: string; first_name?: string; phone_number?: string }; action?: string } }
  | { field: 'template_status'; wabaId: string; value: { event?: string; message_template_id?: number | string; reason?: string } }
  | { field: 'account_update'; wabaId: string; value: { event?: string } };
type WaMeta = { display_phone_number?: string; phone_number_id?: string };
interface WaStatus { id: string; status: 'sent' | 'delivered' | 'read' | 'failed'; timestamp?: string; recipient_id?: string; recipient_user_id?: string; errors?: { code?: number; title?: string; message?: string }[] }

const digits = (value: string | undefined | null) => (value ?? '').replace(/\D/g, '');
const tsMs = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) * 1000 : now());

export function mediaUrlFor(mediaId: string) {
  return `${env.appBaseUrl()}/api/v1/media/${encodeURIComponent(mediaId)}`;
}

/** Text, attachments and interaction details for any WhatsApp message type. */
export function normaliseWaMessage(m: WaMessage): { kind: string; text: string | null; attachments: ForwardAttachment[]; postback: { title: string | null; payload: string | null } | null } {
  const type = m.type ?? 'unknown';
  const media = (m as unknown as Record<string, WaMedia | undefined>)[type];
  switch (type) {
    case 'text':
      return { kind: 'text', text: m.text?.body ?? null, attachments: [], postback: null };
    case 'image': case 'video': case 'audio': case 'document': case 'sticker':
      return {
        kind: type,
        text: media?.caption ?? null,
        attachments: [{ type, url: null, mediaId: media?.id, mediaUrl: media?.id ? mediaUrlFor(media.id) : undefined, mimeType: media?.mime_type ?? null, filename: media?.filename ?? null }],
        postback: null,
      };
    case 'location': {
      const l = m.location ?? {};
      const label = [l.name, l.address].filter(Boolean).join(', ');
      return { kind: 'location', text: `${label ? `${label} · ` : ''}https://maps.google.com/?q=${l.latitude},${l.longitude}`, attachments: [], postback: null };
    }
    case 'contacts': {
      const list = (m.contacts ?? []).map((c) => [c.name?.formatted_name, c.phones?.[0]?.phone].filter(Boolean).join(' ')).join('; ');
      return { kind: 'contacts', text: `Shared contact: ${list}`, attachments: [], postback: null };
    }
    case 'interactive': {
      const reply = m.interactive?.button_reply ?? m.interactive?.list_reply;
      return { kind: 'interactive', text: reply?.title ?? null, attachments: [], postback: { title: reply?.title ?? null, payload: reply?.id ?? null } };
    }
    case 'button':
      return { kind: 'button', text: m.button?.text ?? null, attachments: [], postback: { title: m.button?.text ?? null, payload: m.button?.payload ?? null } };
    case 'reaction':
      return { kind: 'reaction', text: m.reaction?.emoji ? `Reacted ${m.reaction.emoji}` : 'Removed a reaction', attachments: [], postback: null };
    default:
      return { kind: type, text: `[${type} message not supported]`, attachments: [], postback: null };
  }
}

/**
 * Finds the conversation for a WhatsApp user. Live messages identify people by
 * BSUID (and phone when WhatsApp shares it); Business-app echoes and history
 * only carry phone numbers — so match on either and upgrade the key to BSUID.
 */
export function findOrCreateWaConversation(db: Db, number: WaNumber, who: { bsuid?: string | null; phone?: string | null; name?: string | null; username?: string | null }, ts: number): number {
  const phone = digits(who.phone) || null;
  let row: { id: number; participant_id: string } | undefined;
  if (who.bsuid) row = db.prepare('SELECT id, participant_id FROM conversations WHERE wa_number_id = ? AND participant_id = ?').get(number.id, who.bsuid) as typeof row;
  if (!row && phone) row = db.prepare('SELECT id, participant_id FROM conversations WHERE wa_number_id = ? AND (participant_phone = ? OR participant_id = ?)').get(number.id, phone, phone) as typeof row;

  const contactName = phone ? (db.prepare('SELECT name FROM wa_contacts WHERE wa_number_id = ? AND phone = ?').get(number.id, phone) as { name: string | null } | undefined)?.name : null;
  if (!row) {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO conversations (workspace_id, wa_number_id, channel, participant_id, participant_phone, participant_username, participant_name, last_message_at, created_at)
      VALUES (?, ?, 'whatsapp', ?, ?, ?, ?, ?, ?)
    `).run(number.workspace_id, number.id, who.bsuid ?? phone ?? 'unknown', phone, who.username ?? null, who.name ?? contactName ?? null, ts, now());
    return Number(lastInsertRowid);
  }
  db.prepare(`
    UPDATE conversations SET
      participant_id = CASE WHEN @bsuid IS NOT NULL AND participant_id != @bsuid
                            AND NOT EXISTS (SELECT 1 FROM conversations c2 WHERE c2.wa_number_id = @numberId AND c2.participant_id = @bsuid) THEN @bsuid ELSE participant_id END,
      participant_phone = COALESCE(@phone, participant_phone),
      participant_username = COALESCE(@username, participant_username),
      participant_name = COALESCE(@name, participant_name, @contactName)
    WHERE id = @id
  `).run({ bsuid: who.bsuid ?? null, numberId: number.id, phone, username: who.username ?? null, name: who.name ?? null, contactName: contactName ?? null, id: row.id });
  return row.id;
}

function touchConversation(db: Db, conversationId: number, ts: number, preview: string, inbound: boolean) {
  db.prepare(`
    UPDATE conversations SET
      last_message_at = MAX(last_message_at, @ts),
      last_message_preview = CASE WHEN @ts >= last_message_at THEN @preview ELSE last_message_preview END,
      last_inbound_at = CASE WHEN @inbound THEN MAX(COALESCE(last_inbound_at, 0), @ts) ELSE last_inbound_at END
    WHERE id = @id
  `).run({ ts, preview, inbound: inbound ? 1 : 0, id: conversationId });
}

function forward(db: Db, number: WaNumber, messageRowId: number | null, partial: Omit<ForwardEvent, 'id' | 'clientId' | 'channel' | 'pageId' | 'igAccountId' | 'whatsapp'>) {
  const forwardUrl = (db.prepare('SELECT forward_url FROM workspaces WHERE id = ?').get(number.workspace_id) as { forward_url: string | null }).forward_url;
  if (!forwardUrl) return;
  const event: ForwardEvent = {
    id: newEventId(),
    clientId: String(number.workspace_id),
    channel: 'whatsapp',
    pageId: null,
    igAccountId: null,
    whatsapp: { phoneNumberId: number.phone_number_id, wabaId: number.waba_id, displayPhoneNumber: number.display_phone_number },
    ...partial,
  };
  enqueueDelivery(db, number.workspace_id, messageRowId as number, event);
}

function storeMessage(db: Db, number: WaNumber, args: {
  message: WaMessage; conversationId: number; direction: 'inbound' | 'outbound'; source: 'customer' | 'business_app' | 'history'; ts: number;
}): { rowId: number; publicId: string; normalised: ReturnType<typeof normaliseWaMessage> } | null {
  const normalised = normaliseWaMessage(args.message);
  const publicId = `msg_${randomToken(12)}`;
  const status = args.direction === 'inbound' ? 'received' : 'sent';
  // Imported history keeps its original date so retention treats it by age.
  const createdAt = args.source === 'history' ? args.ts : now();
  const { changes, lastInsertRowid } = db.prepare(`
    INSERT OR IGNORE INTO messages (public_id, workspace_id, conversation_id, direction, source, kind, mid, text, attachments, postback, status, meta_timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(publicId, number.workspace_id, args.conversationId, args.direction, args.source, normalised.kind, args.message.id, normalised.text,
    JSON.stringify(normalised.attachments), normalised.postback ? JSON.stringify(normalised.postback) : null, status, args.ts, createdAt);
  if (!changes) return null;
  touchConversation(db, args.conversationId, args.ts, previewText(normalised.text, normalised.attachments.map((a) => ({ type: a.type, url: null }))), args.direction === 'inbound');
  return { rowId: Number(lastInsertRowid), publicId, normalised };
}

export async function processWhatsAppEvent(row: { account_id: string; payload: string }): Promise<'done' | 'ignored'> {
  const payload = JSON.parse(row.payload) as Payload;
  const db = getDb();

  if (payload.field === 'template_status') {
    const v = payload.value;
    db.prepare('UPDATE wa_templates SET status = ?, rejected_reason = ?, updated_at = ? WHERE template_id = ?')
      .run(v.event ?? 'UNKNOWN', v.reason && v.reason !== 'NONE' ? v.reason : null, now(), String(v.message_template_id));
    return 'done';
  }
  if (payload.field === 'account_update') {
    if (payload.value.event === 'PARTNER_REMOVED' || payload.value.event === 'ACCOUNT_DELETED') {
      db.prepare(`UPDATE wa_numbers SET status = 'disconnected', status_detail = 'Removed in WhatsApp Manager', token_enc = NULL, updated_at = ? WHERE waba_id = ?`).run(now(), payload.wabaId);
      log.info('whatsapp.partner_removed', { wabaId: payload.wabaId });
    }
    return 'done';
  }

  const number = waNumberByPhoneId(row.account_id);
  if (!number || number.status === 'disconnected') return 'ignored';
  const retentionCutoff = now() - env.messageRetentionDays() * DAY;

  switch (payload.field) {
    case 'messages': {
      const m = payload.message;
      const contact = payload.contacts?.[0] ?? {};
      const bsuid = m.from_user_id ?? contact.user_id ?? null;
      const phone = m.from ?? contact.wa_id ?? null;
      const ts = tsMs(m.timestamp);
      const conversationId = db.transaction(() =>
        findOrCreateWaConversation(db, number, { bsuid, phone, name: contact.profile?.name, username: contact.profile?.username }, ts))();
      const stored = storeMessage(db, number, { message: m, conversationId, direction: 'inbound', source: 'customer', ts });
      if (!stored) return 'done';
      forward(db, number, stored.rowId, {
        type: 'message.received', direction: 'inbound', senderId: bsuid ?? digits(phone), senderName: contact.profile?.name ?? null,
        senderPhone: digits(phone) || null, senderUsername: contact.profile?.username ?? null, messageId: stored.publicId, mid: m.id,
        kind: stored.normalised.kind, text: stored.normalised.text, attachments: stored.normalised.attachments, postback: stored.normalised.postback,
        timestamp: new Date(ts).toISOString(), raw: { message: m, contacts: payload.contacts },
      });
      return 'done';
    }

    case 'echo':
    case 'history': {
      const m = payload.message;
      const ts = tsMs(m.timestamp);
      if (payload.field === 'history' && ts < retentionCutoff) return 'ignored'; // older than we keep
      const business = digits(number.display_phone_number);
      const fromBusiness = payload.field === 'echo' || digits(m.from) === business;
      const customerPhone = payload.field === 'echo' ? m.to : (payload.threadId || (fromBusiness ? m.to : m.from));
      const conversationId = db.transaction(() => findOrCreateWaConversation(db, number, { phone: customerPhone }, ts))();
      const stored = storeMessage(db, number, {
        message: m, conversationId, direction: fromBusiness ? 'outbound' : 'inbound',
        source: payload.field === 'echo' ? 'business_app' : 'history', ts,
      });
      if (!stored) return 'done';
      const conversation = db.prepare('SELECT participant_id, participant_name FROM conversations WHERE id = ?').get(conversationId) as { participant_id: string; participant_name: string | null };
      forward(db, number, stored.rowId, {
        type: payload.field === 'echo' ? 'message.echo' : 'message.history', direction: fromBusiness ? 'outbound' : 'inbound',
        senderId: conversation.participant_id, senderName: conversation.participant_name, senderPhone: digits(customerPhone) || null, senderUsername: null,
        messageId: stored.publicId, mid: m.id, kind: stored.normalised.kind, text: stored.normalised.text, attachments: stored.normalised.attachments,
        postback: stored.normalised.postback, timestamp: new Date(ts).toISOString(), raw: m,
      });
      return 'done';
    }

    case 'statuses': {
      const s = payload.status;
      const message = db.prepare('SELECT id, public_id, status, conversation_id FROM messages WHERE mid = ? AND workspace_id = ?').get(s.id, number.workspace_id) as
        { id: number; public_id: string; status: string; conversation_id: number } | undefined;
      if (!message) return 'ignored';
      if ((STATUS_RANK[s.status] ?? 0) <= (STATUS_RANK[message.status] ?? 0) && s.status !== 'failed') return 'done';
      const error = s.errors?.[0] ? `${s.errors[0].code ?? ''} ${s.errors[0].title ?? s.errors[0].message ?? ''}`.trim() : null;
      db.prepare('UPDATE messages SET status = ?, error = COALESCE(?, error) WHERE id = ?').run(s.status, error, message.id);
      if (s.recipient_user_id) {
        db.prepare(`UPDATE conversations SET participant_id = ? WHERE id = ? AND participant_id != ?
          AND NOT EXISTS (SELECT 1 FROM conversations c2 WHERE c2.wa_number_id = ? AND c2.participant_id = ?)`)
          .run(s.recipient_user_id, message.conversation_id, s.recipient_user_id, number.id, s.recipient_user_id);
      }
      const conversation = db.prepare('SELECT participant_id, participant_phone FROM conversations WHERE id = ?').get(message.conversation_id) as { participant_id: string; participant_phone: string | null };
      forward(db, number, message.id, {
        type: 'message.status', direction: 'outbound', senderId: conversation.participant_id, senderName: null, senderPhone: conversation.participant_phone,
        messageId: message.public_id, mid: s.id, text: null, attachments: [], postback: null,
        status: { value: s.status, errors: s.errors ?? [] }, timestamp: new Date(tsMs(s.timestamp)).toISOString(), raw: s,
      });
      return 'done';
    }

    case 'contact': {
      const c = payload.item.contact ?? {};
      const phone = digits(c.phone_number);
      if (!phone) return 'ignored';
      if (payload.item.action === 'remove') {
        db.prepare('DELETE FROM wa_contacts WHERE wa_number_id = ? AND phone = ?').run(number.id, phone);
      } else {
        const name = c.full_name || c.first_name || null;
        db.prepare(`INSERT INTO wa_contacts (wa_number_id, phone, name, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(wa_number_id, phone) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`).run(number.id, phone, name, now());
        if (name) db.prepare('UPDATE conversations SET participant_name = ? WHERE wa_number_id = ? AND participant_phone = ? AND participant_name IS NULL').run(name, number.id, phone);
      }
      return 'done';
    }

    case 'history_progress': {
      const progress = payload.progress ?? null;
      db.prepare(`UPDATE wa_numbers SET history_status = ?, history_progress = ?, updated_at = ? WHERE id = ? AND COALESCE(history_status, '') != 'declined'`)
        .run(progress !== null && progress >= 100 ? 'complete' : 'in_progress', progress, now(), number.id);
      return 'done';
    }

    case 'history_error':
      db.prepare(`UPDATE wa_numbers SET history_status = ?, updated_at = ? WHERE id = ?`)
        .run(payload.errors?.[0]?.code === 2593109 ? 'declined' : 'failed', now(), number.id);
      return 'done';
  }
  return 'ignored';
}

export { getWaNumber };
