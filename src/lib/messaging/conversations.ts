import 'server-only';
import { getDb } from './db';

export type Channel = 'messenger' | 'instagram' | 'whatsapp';

export interface Attachment {
  type: string;
  url: string | null;
}

export interface ConversationRow {
  id: number;
  workspace_id: number;
  connection_id: number | null;
  wa_number_id: number | null;
  channel: Channel;
  participant_id: string;
  participant_phone: string | null;
  participant_username: string | null;
  participant_name: string | null;
  participant_picture: string | null;
  last_inbound_at: number | null;
  last_message_at: number;
  last_message_preview: string | null;
  /** Page name, or the WhatsApp number's verified name / display number. */
  page_name: string;
  ig_username: string | null;
  wa_display_phone: string | null;
  connection_status: string;
}

export interface MessageRow {
  id: number;
  public_id: string;
  direction: 'inbound' | 'outbound';
  source: 'customer' | 'api' | 'console' | 'page_inbox' | 'business_app' | 'history';
  kind: string;
  text: string | null;
  attachments: (Attachment & { mediaId?: string; mimeType?: string | null; filename?: string | null })[];
  postback: { title?: string; payload?: string } | null;
  template: { name: string; language: { code: string } | string; components?: unknown[] } | null;
  status: 'received' | 'sent' | 'delivered' | 'read' | 'failed';
  error: string | null;
  meta_timestamp: number;
  sent_by_name: string | null;
}

export const STANDARD_WINDOW_MS = 24 * 60 * 60 * 1000;
export const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type WindowState =
  | { kind: 'open'; closesAt: number }
  | { kind: 'human_agent'; closesAt: number }
  | { kind: 'closed' };

/** Which replies Meta allows for a conversation right now. */
export function messagingWindow(lastInboundAt: number | null, nowMs: number, humanAgentApproved: boolean): WindowState {
  if (lastInboundAt === null) return { kind: 'closed' };
  if (nowMs - lastInboundAt < STANDARD_WINDOW_MS) return { kind: 'open', closesAt: lastInboundAt + STANDARD_WINDOW_MS };
  if (humanAgentApproved && nowMs - lastInboundAt < HUMAN_AGENT_WINDOW_MS) {
    return { kind: 'human_agent', closesAt: lastInboundAt + HUMAN_AGENT_WINDOW_MS };
  }
  return { kind: 'closed' };
}

const CONVERSATION_SELECT = `
  SELECT v.id, v.workspace_id, v.connection_id, v.wa_number_id, v.channel, v.participant_id, v.participant_phone, v.participant_username,
         v.participant_name, v.participant_picture, v.last_inbound_at, v.last_message_at, v.last_message_preview,
         COALESCE(c.page_name, n.verified_name, n.display_phone_number) AS page_name, c.ig_username, n.display_phone_number AS wa_display_phone,
         COALESCE(c.status, n.status) AS connection_status
  FROM conversations v
  LEFT JOIN connections c ON c.id = v.connection_id
  LEFT JOIN wa_numbers n ON n.id = v.wa_number_id
`;

export function listConversations(workspaceId: number, limit = 100): ConversationRow[] {
  return getDb().prepare(`${CONVERSATION_SELECT} WHERE v.workspace_id = ? ORDER BY v.last_message_at DESC LIMIT ?`)
    .all(workspaceId, limit) as ConversationRow[];
}

export function getConversation(id: number): ConversationRow | null {
  return (getDb().prepare(`${CONVERSATION_SELECT} WHERE v.id = ?`).get(id) as ConversationRow | undefined) ?? null;
}

export function listMessages(conversationId: number, limit = 200): MessageRow[] {
  const rows = getDb().prepare(`
    SELECT * FROM (
      SELECT m.id, m.public_id, m.direction, m.source, m.kind, m.text, m.attachments, m.postback, m.template, m.status, m.error, m.meta_timestamp,
             COALESCE(u.name, s.name) AS sent_by_name
      FROM messages m LEFT JOIN staff_users s ON s.id = m.sent_by_staff_id LEFT JOIN client_users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ? ORDER BY m.meta_timestamp DESC, m.id DESC LIMIT ?
    ) ORDER BY meta_timestamp ASC, id ASC
  `).all(conversationId, limit) as (Omit<MessageRow, 'attachments' | 'postback' | 'template'> & { attachments: string; postback: string | null; template: string | null })[];
  return rows.map((r) => ({ ...r, attachments: JSON.parse(r.attachments), postback: r.postback ? JSON.parse(r.postback) : null, template: r.template ? JSON.parse(r.template) : null }));
}

export function previewText(text: string | null, attachments: Attachment[]): string {
  if (text) return text.slice(0, 120);
  if (attachments.length) return `[${attachments[0].type}]`;
  return '';
}
