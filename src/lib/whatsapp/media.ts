import 'server-only';
import { getDb } from '@/lib/messaging/db';
import { errorSummary, log } from '@/lib/log';
import { waTokenFor } from './numbers';
import { downloadMedia, getMedia } from './graph';

/**
 * Streams a WhatsApp media file from Meta. OY Labs never stores the file —
 * Meta's own links need the access token and expire after five minutes.
 */
export async function streamWhatsAppMedia(workspaceId: number, mediaId: string): Promise<Response> {
  if (!/^\d{5,40}$/.test(mediaId)) return new Response('Not found', { status: 404 });
  const numbers = getDb().prepare(`SELECT id, phone_number_id FROM wa_numbers WHERE workspace_id = ? AND status != 'disconnected' AND token_enc IS NOT NULL`).all(workspaceId) as { id: number; phone_number_id: string }[];

  for (const number of numbers) {
    const token = waTokenFor(number.id);
    if (!token) continue;
    try {
      const media = await getMedia(mediaId, token, number.phone_number_id);
      const file = await downloadMedia(media.url, token);
      return new Response(file.body, {
        headers: {
          'Content-Type': media.mime_type || 'application/octet-stream',
          'Cache-Control': 'private, max-age=300',
          'Content-Disposition': 'inline',
          'Content-Security-Policy': "default-src 'none'; sandbox",
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (err) {
      log.warn('whatsapp.media.failed', { workspaceId, numberId: number.id, error: errorSummary(err) });
    }
  }
  return new Response('Not found', { status: 404 });
}
