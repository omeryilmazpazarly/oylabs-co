import { NextResponse, type NextRequest } from 'next/server';
import { getApp, webhookSecret } from '@/lib/apps/apps';
import { handleWebhook, verifyWebhook } from '@/lib/apps/shopify';

/** POST /api/mobile/v1/shopify/:appId — Shopify webhooks for one store app (HMAC-verified). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  const app = getApp(Number((await params).appId));
  const secret = app ? webhookSecret(app) : null;
  const raw = await request.text();
  if (!app || !secret || !verifyWebhook(raw, request.headers.get('x-shopify-hmac-sha256'), secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const topic = request.headers.get('x-shopify-topic') ?? '';
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  // Shopify retries anything slower than 5s; answer first, push afterwards.
  void handleWebhook(app, topic, payload);
  return NextResponse.json({ ok: true });
}
