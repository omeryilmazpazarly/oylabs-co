import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { randomToken } from '@/lib/messaging/crypto';
import { GraphError } from '@/lib/messaging/graph';
import { messagingWindow } from '@/lib/messaging/conversations';
import { SendError } from '@/lib/messaging/send-errors';
import type { SendInput, SendResult } from '@/lib/messaging/send';
import { errorSummary, log } from '@/lib/log';
import { findOrCreateWaConversation } from './processor';
import { getWaNumber, markWaReconnectNeeded, waTokenFor } from './numbers';
import { sendWhatsApp as graphSend, type WaSendBody } from './graph';

/**
 * WhatsApp sends. Free-form text and media need the 24-hour customer service
 * window; approved templates can be sent at any time, including to a phone
 * number that has never messaged the business.
 */

const digits = (value: string) => value.replace(/\D/g, '');
const looksLikePhone = (value: string) => /^\+?\d{7,15}$/.test(value.replace(/[\s-]/g, ''));

export function buildWhatsAppBody(input: Pick<SendInput, 'text' | 'attachment' | 'template'>, target: { phone: string | null; bsuid: string | null }): WaSendBody {
  const body: WaSendBody = { messaging_product: 'whatsapp', recipient_type: 'individual' };
  if (target.phone) body.to = target.phone;
  if (target.bsuid) body.recipient = target.bsuid;
  if (input.template) {
    const { name, language, components } = input.template;
    body.type = 'template';
    body.template = { name, language: typeof language === 'string' ? { code: language } : language, ...(components?.length ? { components } : {}) };
  } else if (input.attachment) {
    const { type, url, caption, filename } = input.attachment;
    body.type = type;
    body[type] = {
      link: url,
      ...(caption && type !== 'audio' && type !== 'sticker' ? { caption } : {}),
      ...(filename && type === 'document' ? { filename } : {}),
    };
  } else {
    body.type = 'text';
    body.text = { body: input.text, preview_url: /https?:\/\//.test(input.text ?? '') };
  }
  return body;
}

function mapGraphError(err: GraphError, numberId: number): SendError {
  if (err.tokenInvalid) {
    markWaReconnectNeeded(numberId, 'Meta rejected the WhatsApp token when sending');
    return new SendError('reconnect_needed', 'Meta rejected the stored token. The WhatsApp number must be reconnected.', err.code);
  }
  if (err.code === 131047) return new SendError('outside_messaging_window', 'More than 24 hours have passed since the customer last replied. Send an approved template.', err.code);
  if (err.code === 130429 || err.code === 131056 || err.code === 80007 || err.rateLimited) return new SendError('meta_rate_limited', 'WhatsApp rate limit reached. Retry later.', err.code);
  if (err.code && err.code >= 132000 && err.code < 133000) return new SendError('template_invalid', err.message, err.code);
  return new SendError('meta_error', err.message, err.code);
}

export async function sendWhatsApp(input: SendInput, nowMs: number): Promise<SendResult> {
  const db = getDb();
  const candidates = db.prepare(`
    SELECT id, status FROM wa_numbers
    WHERE workspace_id = ? AND status != 'disconnected' ${input.phoneNumberId ? 'AND phone_number_id = ?' : ''}
  `).all(...(input.phoneNumberId ? [input.workspaceId, input.phoneNumberId] : [input.workspaceId])) as { id: number; status: string }[];
  if (candidates.length === 0) throw new SendError('connection_not_found', 'No connected WhatsApp number for this workspace.');
  if (candidates.length > 1) throw new SendError('page_id_required', 'This workspace has several WhatsApp numbers; pass phoneNumberId.');
  const number = getWaNumber(candidates[0].id)!;
  if (number.status === 'reconnect_needed') throw new SendError('reconnect_needed', 'The WhatsApp number needs to be reconnected before messages can be sent.');

  const recipient = input.recipientId.trim();
  const recipientDigits = digits(recipient);
  const conversation = db.prepare(`
    SELECT id, participant_id, participant_phone, last_inbound_at FROM conversations
    WHERE wa_number_id = ? AND (participant_id = ? OR (? != '' AND participant_phone = ?))
  `).get(number.id, recipient, recipientDigits, recipientDigits) as { id: number; participant_id: string; participant_phone: string | null; last_inbound_at: number | null } | undefined;

  if (!input.template) {
    if (!conversation) throw new SendError('conversation_not_found', 'This person has not messaged the business. Send an approved template to start a WhatsApp conversation.');
    if (messagingWindow(conversation.last_inbound_at, nowMs, false).kind !== 'open') {
      throw new SendError('outside_messaging_window', 'More than 24 hours have passed since the customer last replied. Send an approved template.');
    }
  } else if (!conversation && !looksLikePhone(recipient)) {
    throw new SendError('conversation_not_found', 'To start a new WhatsApp conversation, recipientId must be a phone number in international format.');
  }

  const token = waTokenFor(number.id);
  if (!token) throw new SendError('reconnect_needed', 'No access token is stored for this WhatsApp number.');

  const phone = conversation?.participant_phone ?? (looksLikePhone(recipient) ? recipientDigits : null);
  const bsuid = conversation && !looksLikePhone(conversation.participant_id) ? conversation.participant_id : null;
  const body = buildWhatsAppBody(input, { phone, bsuid });

  let response: Awaited<ReturnType<typeof graphSend>>;
  try {
    response = await graphSend(number.phone_number_id, token, body);
  } catch (err) {
    if (err instanceof GraphError) {
      log.warn('whatsapp.send.meta_error', { numberId: number.id, code: err.code });
      throw mapGraphError(err, number.id);
    }
    log.error('whatsapp.send.failed', { numberId: number.id, error: errorSummary(err) });
    throw new SendError('meta_error', 'Could not reach WhatsApp.');
  }

  const mid = response.messages?.[0]?.id;
  if (!mid) throw new SendError('meta_error', 'WhatsApp did not return a message ID.');
  const sentAt = now();
  const kind = input.template ? 'template' : input.attachment ? input.attachment.type : 'text';
  const text = input.text ?? input.attachment?.caption ?? null;
  const attachments = input.attachment ? [{ type: input.attachment.type, url: input.attachment.url, filename: input.attachment.filename ?? null }] : [];
  const preview = input.template ? `Template: ${input.template.name}` : text ?? `[${kind}]`;
  const publicId = `msg_${randomToken(12)}`;

  const conversationId = db.transaction(() => {
    const contact = response.contacts?.[0];
    const id = conversation?.id ?? findOrCreateWaConversation(db, number, { bsuid: contact?.user_id ?? null, phone: contact?.wa_id ?? phone }, sentAt);
    db.prepare(`
      INSERT INTO messages (public_id, workspace_id, conversation_id, direction, source, kind, mid, text, attachments, template, status, idempotency_key, sent_by_staff_id, sent_by_user_id, meta_timestamp, created_at)
      VALUES (?, ?, ?, 'outbound', ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?, ?, ?)
    `).run(publicId, input.workspaceId, id, input.source, kind, mid, text, JSON.stringify(attachments), input.template ? JSON.stringify(input.template) : null,
      input.idempotencyKey ?? null, input.staffId ?? null, input.userId ?? null, sentAt, sentAt);
    db.prepare('UPDATE conversations SET last_message_at = ?, last_message_preview = ? WHERE id = ?').run(sentAt, preview.slice(0, 120), id);
    return id;
  })();

  const participant = db.prepare('SELECT participant_id FROM conversations WHERE id = ?').get(conversationId) as { participant_id: string };
  log.info('whatsapp.send.succeeded', { workspaceId: input.workspaceId, numberId: number.id, kind, source: input.source });
  return { id: publicId, mid, conversationId, channel: 'whatsapp', recipientId: participant.participant_id, sentAt: new Date(sentAt).toISOString(), replayed: false };
}
