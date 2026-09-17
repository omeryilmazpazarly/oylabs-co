import 'server-only';
import { getDb } from './db';

export type Channel = 'messenger' | 'instagram';

export interface Attachment {
  type: string;
  url: string | null;
}

export interface ConversationRow {
  id: number;
  workspace_id: number;
  connection_id: number;
  channel: Channel;
  participant_id: string;
  participant_name: string | null;
  participant_picture: string | null;
  last_inbound_at: number | null;
  last_message_at: number;
  last_message_preview: string | null;
  page_name: string;
  ig_username: string | null;
  connection_status: string;
}

export interface MessageRow {
  id: number;
  public_id: string;
  direction: 'inbound' | 'outbound';
  source: 'customer' | 'api' | 'console' | 'page_inbox';
  text: string | null;
  attachments: Attachment[];
  postback: { title?: string; payload?: string } | null;
  status: 'received' | 'sent' | 'failed';
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
  SELECT v.id, v.workspace_id, v.connection_id, v.channel, v.participant_id, v.participant_name, v.participant_picture,
         v.last_inbound_at, v.last_message_at, v.last_message_preview,
         c.page_name, c.ig_username, c.status AS connection_status
  FROM conversations v JOIN connections c ON c.id = v.connection_id
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
      SELECT m.id, m.public_id, m.direction, m.source, m.text, m.attachments, m.postback, m.status, m.error, m.meta_timestamp,
             s.name AS sent_by_name
      FROM messages m LEFT JOIN staff_users s ON s.id = m.sent_by_staff_id
      WHERE m.conversation_id = ? ORDER BY m.meta_timestamp DESC, m.id DESC LIMIT ?
    ) ORDER BY meta_timestamp ASC, id ASC
  `).all(conversationId, limit) as (Omit<MessageRow, 'attachments' | 'postback'> & { attachments: string; postback: string | null })[];
  return rows.map((r) => ({ ...r, attachments: JSON.parse(r.attachments), postback: r.postback ? JSON.parse(r.postback) : null }));
}

export function previewText(text: string | null, attachments: Attachment[]): string {
  if (text) return text.slice(0, 120);
  if (attachments.length) return `[${attachments[0].type}]`;
  return '';
}
