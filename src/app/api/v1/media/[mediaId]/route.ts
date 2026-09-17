import { type NextRequest } from 'next/server';
import { authenticateClient } from '@/lib/api/client-auth';
import { streamWhatsAppMedia } from '@/lib/whatsapp/media';

/**
 * Client API: download a WhatsApp media file by the mediaId given in a
 * forwarded event. Signed like every other client API call (over an empty body).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const auth = authenticateClient(request.headers, '');
  if (!auth.ok) return Response.json({ error: { code: auth.error, message: 'Authentication failed.' } }, { status: auth.status });
  const { mediaId } = await params;
  return streamWhatsAppMedia(auth.workspaceId, mediaId);
}
