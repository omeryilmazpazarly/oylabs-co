import { NextResponse, type NextRequest } from 'next/server';
import { metaConfigured } from '@/lib/messaging/env';
import { authenticateClient, rateLimit } from '@/lib/api/client-auth';
import { sendMessage, SendError, type SendInput } from '@/lib/messaging/send';
import { errorSummary, log } from '@/lib/log';

const MAX_BODY_BYTES = 64 * 1024;

/** Client Send API — see docs/client-integration.md. */
export async function POST(request: NextRequest) {
  if (!metaConfigured()) return error(503, 'not_configured', 'Messaging is not configured on this server.');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return error(413, 'payload_too_large', 'Request body is too large.');

  const auth = authenticateClient(request.headers, raw);
  if (!auth.ok) return error(auth.status, auth.error, 'Authentication failed.');

  const limit = rateLimit(auth.workspaceId);
  if (!limit.allowed) {
    return NextResponse.json({ error: { code: 'rate_limited', message: 'Too many requests.' } }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
  }

  let body: Partial<SendInput>;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, 'invalid_request', 'Body must be JSON.');
  }

  try {
    const result = await sendMessage({
      workspaceId: auth.workspaceId,
      channel: body.channel as SendInput['channel'],
      recipientId: body.recipientId as string,
      pageId: typeof body.pageId === 'string' ? body.pageId : undefined,
      text: body.text,
      attachment: body.attachment,
      tag: body.tag,
      idempotencyKey: request.headers.get('idempotency-key')?.slice(0, 200) || undefined,
      source: 'api',
    });
    return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
  } catch (err) {
    if (err instanceof SendError) return error(err.status, err.code, err.message, err.metaCode);
    log.error('api.messages.failed', { workspaceId: auth.workspaceId, error: errorSummary(err) });
    return error(500, 'internal_error', 'Unexpected error.');
  }
}

function error(status: number, code: string, message: string, metaCode?: number) {
  return NextResponse.json({ error: { code, message, ...(metaCode ? { metaCode } : {}) } }, { status });
}
