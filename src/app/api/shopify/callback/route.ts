import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/messaging/env';
import { getClient } from '@/lib/auth/client-session';
import { getWorkspaceApp } from '@/lib/apps/apps';
import { autofillApp } from '@/lib/apps/autofill';
import {
  attachInstall,
  CLAIM_COOKIE,
  completeInstall,
  NONCE_COOKIE,
  normalizeShop,
  readState,
  shopifyAppConfigured,
  signValue,
  verifyShopifyQuery,
} from '@/lib/apps/shopify-oauth';
import { errorSummary, log } from '@/lib/log';

/** GET /api/shopify/callback — Shopify returns here after the owner approves the app. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const shop = normalizeShop(q.get('shop'));
  const state = readState(q.get('state'), request.cookies.get(NONCE_COOKIE)?.value);
  const code = q.get('code');
  if (!shopifyAppConfigured() || !shop || !code || !state || !verifyShopifyQuery(q)) {
    log.warn('shopify_oauth.callback_rejected', { shop });
    return NextResponse.redirect(new URL('/app/mobile?shopify=failed', env.appBaseUrl()));
  }
  try {
    await completeInstall(shop, code);
  } catch (err) {
    log.error('shopify_oauth.install_failed', { shop, error: errorSummary(err) });
    return NextResponse.redirect(new URL(`/app/mobile${state.target ? `/${state.target}/store` : ''}?shopify=failed`, env.appBaseUrl()));
  }
  log.info('shopify_oauth.installed', { shop, target: state.target });

  // Started from the dashboard: give that app the connection straight away.
  if (state.target) {
    const ctx = await getClient();
    const app = ctx?.workspace && ctx.role === 'owner' ? getWorkspaceApp(ctx.workspace.id, state.target) : null;
    if (app) {
      const first = app.store_domain !== shop;
      await attachInstall(app.id, shop);
      if (first) void autofillApp(app.id, shop).catch(() => undefined);
      const res = NextResponse.redirect(new URL(`/app/mobile/${app.id}/store?shopify=connected`, env.appBaseUrl()));
      res.cookies.delete({ name: NONCE_COOKIE, path: '/api/shopify' });
      return res;
    }
  }

  // Started in Shopify: the browser that approved may claim the store for its account.
  const res = NextResponse.redirect(new URL('/api/shopify/claim', env.appBaseUrl()));
  res.cookies.set(CLAIM_COOKIE, signValue([shop, Date.now() + 24 * 3600_000]), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 24 * 3600, path: '/' });
  res.cookies.delete({ name: NONCE_COOKIE, path: '/api/shopify' });
  return res;
}
