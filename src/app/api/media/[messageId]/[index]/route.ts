import { type NextRequest } from 'next/server';
import { getClient } from '@/lib/auth/client-session';
import { getStaff } from '@/lib/auth/session';
import { membership } from '@/lib/accounts/accounts';
import { getDb } from '@/lib/messaging/db';
import { streamWhatsAppMedia } from '@/lib/whatsapp/media';

/**
 * Inbox media for signed-in people: staff, or a member of the workspace the
 * message belongs to. Nothing is stored — it is fetched from Meta on demand.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ messageId: string; index: string }> }) {
  const { messageId, index } = await params;
  const message = getDb().prepare('SELECT workspace_id, attachments FROM messages WHERE public_id = ?').get(messageId) as { workspace_id: number; attachments: string } | undefined;
  if (!message) return new Response('Not found', { status: 404 });

  const staff = await getStaff();
  if (!staff) {
    const client = await getClient();
    if (!client || !membership(message.workspace_id, client.user.id)) return new Response('Not found', { status: 404 });
  }

  const attachment = (JSON.parse(message.attachments) as { mediaId?: string }[])[Number(index)];
  if (!attachment?.mediaId) return new Response('Not found', { status: 404 });
  return streamWhatsAppMedia(message.workspace_id, attachment.mediaId);
}
