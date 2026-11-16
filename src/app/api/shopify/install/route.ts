import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/messaging/env';
import {
  authorizeUrl,
  CLAIM_COOKIE,
  getInstall,
  NONCE_COOKIE,
  normalizeShop,
  shopifyAppConfigured,
  signValue,
  verifyShopifyQuery,
} from '@/lib/apps/shopify-oauth';

/**
 * GET /api/shopify/install — the Shopify app's URL. Shopify opens it (signed) when a
 * merchant installs the app or opens it from their admin. New stores approve the
 * scopes; installed stores go on to their OY Labs account.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const shop = normalizeShop(q.get('shop'));
  if (!shopifyAppConfigured() || !shop || !verifyShopifyQuery(q)) {
    return NextResponse.redirect(new URL('/shopify-app/', env.appBaseUrl()));
  }
  if (getInstall(shop)) {
    const res = NextResponse.redirect(new URL('/api/shopify/claim', env.appBaseUrl()));
    res.cookies.set(CLAIM_COOKIE, signValue([shop, Date.now() + 24 * 3600_000]), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 24 * 3600, path: '/' });
    return res;
  }
  const { url, nonce } = authorizeUrl(shop, 0);
  const res = NextResponse.redirect(url);
  res.cookies.set(NONCE_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 15 * 60, path: '/api/shopify' });
  return res;
}
