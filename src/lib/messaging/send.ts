import 'server-only';
import { getDb, now } from './db';
import { randomToken } from './crypto';
import { env } from './env';
import * as graph from './graph';
import { markReconnectNeeded, pageTokenFor } from './connections';
import { messagingWindow, previewText, type Attachment, type Channel } from './conversations';
import { errorSummary, log } from '@/lib/log';
import { getWorkspace } from './workspaces';
import { serviceState } from '@/lib/billing/entitlements';
import { SendError } from './send-errors';
import { sendWhatsApp } from '@/lib/whatsapp/send';

export { SendError, type SendErrorCode } from './send-errors';

/**
 * The one path for outbound messages — used by the client Send API and the
 * console reply box alike, so window rules can't be bypassed from either.
 */

export interface SendInput {
  workspaceId: number;
  channel: Channel;
  recipientId: string;
  pageId?: string;
  text?: string;
  attachment?: { type: string; url: string; filename?: string; caption?: string };
  /** WhatsApp only: an approved template, in Meta's shape ({ name, language: { code }, components }). */
  template?: { name: string; language: { code: string } | string; components?: unknown[] };
  /** WhatsApp only: which connected number to send from, when the workspace has several. */
  phoneNumberId?: string;
  tag?: 'HUMAN_AGENT';
  idempotencyKey?: string;
  source: 'api' | 'console';
  staffId?: number;
  userId?: number;
}

export interface SendResult {
  id: string;
  mid: string;
  conversationId: number;
  channel: Channel;
  recipientId: string;
  sentAt: string;
  replayed: boolean;
}

const ATTACHMENT_TYPES = new Set(['image', 'video', 'audio', 'file']);

const WA_MEDIA_TYPES = new Set(['image', 'video', 'audio', 'document', 'sticker']);

export function validateSendInput(input: Partial<SendInput>): void {
  if (input.channel === 'whatsapp') return validateWhatsAppInput(input);
  if (input.channel !== 'messenger' && input.channel !== 'instagram') throw new SendError('invalid_request', 'channel must be "messenger", "instagram" or "whatsapp".');
  if (input.template) throw new SendError('invalid_request', 'Templates are only available on WhatsApp.');
  if (!input.recipientId || typeof input.recipientId !== 'string') throw new SendError('invalid_request', 'recipientId is required.');
  const hasText = typeof input.text === 'string' && input.text.trim().length > 0;
  const hasAttachment = Boolean(input.attachment);
  if (hasText === hasAttachment) throw new SendError('invalid_request', 'Provide exactly one of text or attachment.');
  if (hasText) {
    if (input.channel === 'messenger' && input.text!.length > 2000) throw new SendError('invalid_request', 'Messenger text is limited to 2000 characters.');
    if (input.channel === 'instagram' && Buffer.byteLength(input.text!, 'utf8') > 1000) throw new SendError('invalid_request', 'Instagram text is limited to 1000 bytes.');
  }
  if (hasAttachment) {
    const { type, url } = input.attachment as { type?: string; url?: string };
    if (!type || !ATTACHMENT_TYPES.has(type)) throw new SendError('invalid_request', 'attachment.type must be image, video, audio or file.');
    if (!url || !/^https:\/\//.test(url)) throw new SendError('invalid_request', 'attachment.url must be an https URL.');
  }
  if (input.tag !== undefined && input.tag !== 'HUMAN_AGENT') throw new SendError('invalid_request', 'The only supported tag is HUMAN_AGENT.');
}

function validateWhatsAppInput(input: Partial<SendInput>): void {
  if (!input.recipientId || typeof input.recipientId !== 'string') throw new SendError('invalid_request', 'recipientId is required (BSUID or phone number).');
  const count = [typeof input.text === 'string' && input.text.trim().length > 0, Boolean(input.attachment), Boolean(input.template)].filter(Boolean).length;
  if (count !== 1) throw new SendError('invalid_request', 'Provide exactly one of text, attachment or template.');
  if (input.tag) throw new SendError('invalid_request', 'Message tags are not used on WhatsApp; send an approved template instead.');
  if (input.text && input.text.length > 4096) throw new SendError('invalid_request', 'WhatsApp text is limited to 4096 characters.');
  if (input.attachment) {
    const { type, url } = input.attachment;
    if (!WA_MEDIA_TYPES.has(type)) throw new SendError('invalid_request', 'attachment.type must be image, video, audio, document or sticker.');
    if (!url || !/^https:\/\//.test(url)) throw new SendError('invalid_request', 'attachment.url must be an https URL.');
  }
  if (input.template) {
    const { name, language } = input.template;
    const code = typeof language === 'string' ? language : language?.code;
    if (!name || !/^[a-z0-9_]{1,512}$/.test(name)) throw new SendError('template_invalid', 'template.name must be the approved template name.');
    if (!code || !/^[a-z]{2,3}(_[A-Za-z]{2,4})?$/.test(code)) throw new SendError('template_invalid', 'template.language must be a language code such as "en_US".');
    if (input.template.components !== undefined && !Array.isArray(input.template.components)) throw new SendError('template_invalid', 'template.components must be an array.');
  }
}

export async function sendMessage(input: SendInput, nowMs: number = now()): Promise<SendResult> {
  validateSendInput(input);
  const db = getDb();

  const billing = getWorkspace(input.workspaceId);
  if (!billing) throw new SendError('connection_not_found', 'Workspace not found.');
  if (!serviceState(billing, nowMs).active) {
    throw new SendError('subscription_inactive', 'This workspace has no active subscription. Update billing to resume sending.');
  }

  if (input.idempotencyKey) {
    const prior = db.prepare(`
      SELECT m.public_id, m.mid, m.conversation_id, m.meta_timestamp, v.channel, v.participant_id
      FROM messages m JOIN conversations v ON v.id = m.conversation_id
      WHERE m.workspace_id = ? AND m.idempotency_key = ?
    `).get(input.workspaceId, input.idempotencyKey) as { public_id: string; mid: string; conversation_id: number; meta_timestamp: number; channel: Channel; participant_id: string } | undefined;
    if (prior) {
      return { id: prior.public_id, mid: prior.mid, conversationId: prior.conversation_id, channel: prior.channel, recipientId: prior.participant_id, sentAt: new Date(prior.meta_timestamp).toISOString(), replayed: true };
    }
  }

  if (input.channel === 'whatsapp') return sendWhatsApp(input, nowMs);

  const connections = db.prepare(`
    SELECT id, page_id, ig_account_id, status FROM connections
    WHERE workspace_id = ? AND status != 'disconnected' ${input.pageId ? 'AND page_id = ?' : ''}
  `).all(...(input.pageId ? [input.workspaceId, input.pageId] : [input.workspaceId])) as { id: number; page_id: string; ig_account_id: string | null; status: string }[];
  const usable = connections.filter((c) => input.channel === 'messenger' || c.ig_account_id);
  if (usable.length === 0) throw new SendError('connection_not_found', `No connected ${input.channel === 'instagram' ? 'Instagram account' : 'Page'} for this workspace.`);
  if (usable.length > 1) throw new SendError('page_id_required', 'This workspace has several connected Pages; pass pageId.');
  const connection = usable[0];
  if (connection.status === 'reconnect_needed') throw new SendError('reconnect_needed', 'The Page connection needs to be reconnected before messages can be sent.');

  const conversation = db.prepare('SELECT id, last_inbound_at FROM conversations WHERE connection_id = ? AND channel = ? AND participant_id = ?')
    .get(connection.id, input.channel, input.recipientId) as { id: number; last_inbound_at: number | null } | undefined;
  if (!conversation) throw new SendError('conversation_not_found', 'This person has not messaged the business, so Meta does not allow sending to them.');

  const window = messagingWindow(conversation.last_inbound_at, nowMs, env.humanAgentApproved());
  if (window.kind === 'closed') {
    throw new SendError(input.tag === 'HUMAN_AGENT' && !env.humanAgentApproved() ? 'human_agent_not_approved' : 'outside_messaging_window',
      'The 24-hour messaging window for this conversation has closed.');
  }
  if (window.kind === 'human_agent' && input.tag !== 'HUMAN_AGENT') {
    throw new SendError('outside_messaging_window', 'The 24-hour window has closed. A human agent may reply within 7 days by sending tag HUMAN_AGENT.');
  }
  if (input.tag === 'HUMAN_AGENT' && !env.humanAgentApproved()) {
    throw new SendError('human_agent_not_approved', 'The HUMAN_AGENT tag is not enabled for this app.');
  }

  const token = pageTokenFor(connection.id);
  if (!token) throw new SendError('reconnect_needed', 'No access token is stored for this Page.');

  const useTag = window.kind === 'human_agent';
  const body: graph.SendBody = {
    recipient: { id: input.recipientId },
    messaging_type: useTag ? 'MESSAGE_TAG' : 'RESPONSE',
    ...(useTag ? { tag: 'HUMAN_AGENT' as const } : {}),
    message: input.text
      ? { text: input.text }
      : { attachment: { type: input.attachment!.type, payload: { url: input.attachment!.url, is_reusable: false } } },
  };

  let response: { message_id: string };
  try {
    response = await graph.sendPageMessage(connection.page_id, token, body);
  } catch (err) {
    if (err instanceof graph.GraphError) {
      if (err.tokenInvalid) {
        markReconnectNeeded(connection.id, 'Meta rejected the Page token when sending');
        throw new SendError('reconnect_needed', 'Meta rejected the stored token. The Page must be reconnected.', err.code);
      }
      if (err.outsideWindow) throw new SendError('outside_messaging_window', 'Meta reports this message is outside the allowed window.', err.code);
      if (err.rateLimited) throw new SendError('meta_rate_limited', 'Meta rate limit reached. Retry later.', err.code);
      log.warn('send.meta_error', { connectionId: connection.id, code: err.code, subcode: err.subcode });
      throw new SendError('meta_error', err.message, err.code);
    }
    log.error('send.failed', { connectionId: connection.id, error: errorSummary(err) });
    throw new SendError('meta_error', 'Could not reach Meta.');
  }

  const publicId = `msg_${randomToken(12)}`;
  const attachments: Attachment[] = input.attachment ? [{ type: input.attachment.type, url: input.attachment.url }] : [];
  const sentAt = now();
  db.transaction(() => {
    db.prepare(`
      INSERT INTO messages (public_id, workspace_id, conversation_id, direction, source, mid, text, attachments, status, idempotency_key, sent_by_staff_id, meta_timestamp, created_at)
      VALUES (?, ?, ?, 'outbound', ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
    `).run(publicId, input.workspaceId, conversation.id, input.source, response.message_id, input.text ?? null, JSON.stringify(attachments),
      input.idempotencyKey ?? null, input.staffId ?? null, sentAt, sentAt);
    db.prepare('UPDATE conversations SET last_message_at = ?, last_message_preview = ? WHERE id = ?')
      .run(sentAt, previewText(input.text ?? null, attachments), conversation.id);
  })();

  log.info('send.succeeded', { workspaceId: input.workspaceId, connectionId: connection.id, channel: input.channel, source: input.source, tagged: useTag });
  return { id: publicId, mid: response.message_id, conversationId: conversation.id, channel: input.channel, recipientId: input.recipientId, sentAt: new Date(sentAt).toISOString(), replayed: false };
}
