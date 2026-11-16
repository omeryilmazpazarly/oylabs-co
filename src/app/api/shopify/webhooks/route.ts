import { NextResponse, type NextRequest } from 'next/server';
import { forgetShop, normalizeShop, verifyAppWebhook } from '@/lib/apps/shopify-oauth';
import { log } from '@/lib/log';

/**
 * POST /api/shopify/webhooks — app-level webhooks: app/uninstalled and the mandatory
 * privacy webhooks. We hold no shopper personal data beyond push device ids, which are
 * removed with the app, so customer requests need no action beyond acknowledging.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyAppWebhook(raw, request.headers.get('x-shopify-hmac-sha256'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const topic = request.headers.get('x-shopify-topic') ?? '';
  const shop = normalizeShop(request.headers.get('x-shopify-shop-domain'));
  log.info('shopify_app.webhook', { topic, shop });
  if (shop && (topic === 'app/uninstalled' || topic === 'shop/redact')) forgetShop(shop);
  return NextResponse.json({ ok: true });
}
