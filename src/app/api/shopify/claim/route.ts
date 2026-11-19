import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/messaging/env';
import { getClient } from '@/lib/auth/client-session';
import { autofillApp } from '@/lib/apps/autofill';
import { appForShop, attachInstall, CLAIM_COOKIE, claimedShop, getInstall, readSigned, signValue } from '@/lib/apps/shopify-oauth';
import { enableShopifyBilling, shopifyPricingUrl } from '@/lib/apps/shopify-billing';
import { errorSummary, log } from '@/lib/log';

/**
 * GET /api/shopify/claim — after installing from Shopify. Signed-in owners get the
 * store on their app; everyone else picks a plan with the store already filled in.
 */
export async function GET(request: NextRequest) {
  // From "Open the App Builder" in the Shopify admin: a signed 15-minute link (the
  // admin iframe can't set our cookie), turned into the usual claim cookie.
  const link = readSigned(request.nextUrl.searchParams.get('t'));
  if (link) {
    const [linkShop, expires, purpose] = link;
    if (purpose === 'claim' && Number(expires) > Date.now() && getInstall(linkShop)) {
      const res = NextResponse.redirect(new URL('/api/shopify/claim', env.appBaseUrl()));
      res.cookies.set(CLAIM_COOKIE, signValue([linkShop, Date.now() + 24 * 3600_000]), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 24 * 3600, path: '/' });
      return res;
    }
  }
  const shop = claimedShop(request.cookies.get(CLAIM_COOKIE)?.value);
  if (!shop) return NextResponse.redirect(new URL('/shopify-app/', env.appBaseUrl()));
  const ctx = await getClient();
  if (!ctx?.workspace || ctx.role !== 'owner') {
    // Plans are paid in Shopify afterwards; the plan here only opens the App Builder sign-up.
    return NextResponse.redirect(new URL(`/signup?plan=app-growth&source=shopify&store=${encodeURIComponent(shop)}`, env.appBaseUrl()));
  }
  const app = appForShop(ctx.workspace.id, ctx.workspace.name, shop);
  try {
    const first = app.store_domain !== shop;
    await attachInstall(app.id, shop);
    if (first) void autofillApp(app.id, shop).catch(() => undefined);
    // Installed from Shopify: the plan is paid through Shopify, not Stripe.
    const live = await enableShopifyBilling(app.id, shop);
    if (!live && !(app.care_status === 'active' && app.billing_source === 'shopify')) {
      const res = NextResponse.redirect(shopifyPricingUrl(shop));
      res.cookies.delete(CLAIM_COOKIE);
      return res;
    }
  } catch (err) {
    log.error('shopify_oauth.claim_failed', { appId: app.id, shop, error: errorSummary(err) });
    return NextResponse.redirect(new URL(`/app/mobile/${app.id}/store?shopify=failed`, env.appBaseUrl()));
  }
  const res = NextResponse.redirect(new URL(`/app/mobile/${app.id}${app.plan ? '/store?shopify=connected' : ''}`, env.appBaseUrl()));
  res.cookies.delete(CLAIM_COOKIE);
  return res;
}
