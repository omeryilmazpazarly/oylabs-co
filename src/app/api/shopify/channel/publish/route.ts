import { NextResponse, type NextRequest } from 'next/server';
import { getInstall, installToken } from '@/lib/apps/shopify-oauth';
import { publishAll, verifyIdToken } from '@/lib/apps/shopify-channel';
import { errorSummary, log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/** POST /api/shopify/channel/publish — "Add all products to the app" on the admin home. */
export async function POST(request: NextRequest) {
  const shop = verifyIdToken(request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''));
  if (!shop) {
    // App Bridge fetches a fresh ID token and retries once.
    return NextResponse.json({ error: 'Session expired.' }, { status: 401, headers: { 'X-Shopify-Retry-Invalid-Session-Request': '1' } });
  }
  const install = getInstall(shop);
  if (!install) return NextResponse.json({ error: 'Open the app from your Shopify admin first.' }, { status: 409 });
  try {
    const products = await publishAll(shop, installToken(install));
    return NextResponse.json({ products });
  } catch (err) {
    log.error('shopify_channel.publish_failed', { shop, error: errorSummary(err) });
    return NextResponse.json({ error: 'Could not add products.' }, { status: 502 });
  }
}
