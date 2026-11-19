import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/messaging/env';
import {
  authorizeUrl,
  getInstall,
  installToken,
  NONCE_COOKIE,
  needsScopes,
  normalizeShop,
  shopifyAppConfigured,
  signValue,
  verifyShopifyQuery,
} from '@/lib/apps/shopify-oauth';
import { exchangeIdToken, publishedCount, setUpStore, verifyIdToken } from '@/lib/apps/shopify-channel';
import { homeHtml } from '@/lib/apps/shopify-home';
import { errorSummary, log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shopify/install — the Shopify app's URL. Inside the admin (embedded, with an
 * ID token) it sets the store up as a sales channel and shows the app home. Opened
 * anywhere else it sends the merchant into the admin, or through approval if the store
 * has never installed the app.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const shop = normalizeShop(q.get('shop'));
  if (!shopifyAppConfigured() || !shop || !verifyShopifyQuery(q)) {
    return NextResponse.redirect(new URL('/shopify-app/', env.appBaseUrl()));
  }
  const idToken = q.get('id_token');
  if (!idToken || q.get('embedded') !== '1') {
    if (getInstall(shop)) {
      return NextResponse.redirect(`https://admin.shopify.com/store/${shop.replace(/\.myshopify\.com$/, '')}/apps/${process.env.SHOPIFY_API_KEY}`);
    }
    const { url, nonce } = authorizeUrl(shop, 0);
    const res = NextResponse.redirect(url);
    res.cookies.set(NONCE_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 15 * 60, path: '/api/shopify' });
    return res;
  }
  if (verifyIdToken(idToken) !== shop) return new NextResponse('This link has expired. Open the app again from your Shopify admin.', { status: 401 });

  let products: number | null = null;
  let connected = false;
  let privacyUrl: string | null = null;
  try {
    const existing = getInstall(shop);
    if (!existing || needsScopes(existing)) await exchangeIdToken(shop, idToken);
    const install = await setUpStore(shop);
    connected = Boolean(install?.channel_id);
    privacyUrl = install?.privacy_url ?? null;
    if (install) products = await publishedCount(shop, installToken(install)).catch(() => null);
  } catch (err) {
    log.error('shopify_channel.home_failed', { shop, error: errorSummary(err) });
  }

  const claim = signValue([shop, Date.now() + 15 * 60_000, 'claim']);
  const html = homeHtml({
    apiKey: process.env.SHOPIFY_API_KEY!,
    shop,
    builderUrl: `${env.appBaseUrl()}/api/shopify/claim?t=${encodeURIComponent(claim)}`,
    connected,
    products,
    privacyUrl,
  });
  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `frame-ancestors https://${shop} https://admin.shopify.com;`,
      'cache-control': 'no-store',
    },
  });
}
