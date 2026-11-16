import { NextResponse, type NextRequest } from 'next/server';
import { getClient } from '@/lib/auth/client-session';
import { getWorkspaceApp } from '@/lib/apps/apps';
import { authorizeUrl, NONCE_COOKIE, normalizeShop, shopifyAppConfigured } from '@/lib/apps/shopify-oauth';

/** GET /api/shopify/connect?appId=1&shop=x.myshopify.com — "Connect with Shopify" from the dashboard. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const appId = Number(q.get('appId'));
  const back = (error: string) => NextResponse.redirect(new URL(`/app/mobile/${appId || ''}${appId ? '/store' : ''}?shopify=${error}`, request.url));
  const ctx = await getClient();
  if (!ctx?.workspace) return NextResponse.redirect(new URL('/login', request.url));
  if (ctx.role !== 'owner') return back('owner_only');
  const app = getWorkspaceApp(ctx.workspace.id, appId);
  if (!app) return back('not_found');
  if (!shopifyAppConfigured()) return back('not_configured');
  const shop = normalizeShop(q.get('shop')) ?? normalizeShop(app.store_domain);
  if (!shop) return back('shop');
  const { url, nonce } = authorizeUrl(shop, app.id);
  const res = NextResponse.redirect(url);
  res.cookies.set(NONCE_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 15 * 60, path: '/api/shopify' });
  return res;
}
