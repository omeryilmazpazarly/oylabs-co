import { NextResponse, type NextRequest } from 'next/server';
import { env, metaConfigured } from '@/lib/messaging/env';
import { verifyMetaSignature } from '@/lib/messaging/signatures';
import { ingestWebhook } from '@/lib/messaging/events';
import { kickWorker } from '@/lib/messaging/worker';
import { errorSummary, log } from '@/lib/log';

const MAX_BODY_BYTES = 1024 * 1024;

/** Meta's subscription handshake. */
export async function GET(request: NextRequest) {
  if (!metaConfigured()) return new NextResponse('Not configured', { status: 503 });
  const params = request.nextUrl.searchParams;
  if (params.get('hub.mode') === 'subscribe' && params.get('hub.verify_token') === env.metaVerifyToken()) {
    return new NextResponse(params.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

/** Event notifications: verify, store, acknowledge. Processing happens in the background worker. */
export async function POST(request: NextRequest) {
  if (!metaConfigured()) return new NextResponse('Not configured', { status: 503 });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return new NextResponse('Payload too large', { status: 413 });

  const raw = await request.text();
  if (!verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'), env.metaAppSecret())) {
    log.warn('webhook.signature.invalid');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  try {
    const result = ingestWebhook(body);
    log.info('webhook.received', { object: (body as { object?: string }).object ?? 'unknown', ...result });
  } catch (err) {
    // Returning non-2xx makes Meta retry, which is what we want if storage failed.
    log.error('webhook.store.failed', { error: errorSummary(err) });
    return new NextResponse('Temporarily unavailable', { status: 500 });
  }

  kickWorker();
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
