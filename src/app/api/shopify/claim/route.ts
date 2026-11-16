import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/messaging/env';
import { getClient } from '@/lib/auth/client-session';
import { createSignupApp, listApps } from '@/lib/apps/apps';
import { autofillApp } from '@/lib/apps/autofill';
import { attachInstall, CLAIM_COOKIE, claimedShop } from '@/lib/apps/shopify-oauth';
import { enableShopifyBilling, shopifyPricingUrl } from '@/lib/apps/shopify-billing';
import { errorSummary, log } from '@/lib/log';

/**
 * GET /api/shopify/claim — after installing from Shopify. Signed-in owners get the
 * store on their app; everyone else picks a plan with the store already filled in.
 */
export async function GET(request: NextRequest) {
  const shop = claimedShop(request.cookies.get(CLAIM_COOKIE)?.value);
  if (!shop) return NextResponse.redirect(new URL('/shopify-app/', env.appBaseUrl()));
  const ctx = await getClient();
  if (!ctx?.workspace || ctx.role !== 'owner') {
    // Plans are paid in Shopify afterwards; the plan here only opens the App Builder sign-up.
    return NextResponse.redirect(new URL(`/signup?plan=app-growth&source=shopify&store=${encodeURIComponent(shop)}`, env.appBaseUrl()));
  }
  const apps = listApps(ctx.workspace.id);
  const app = apps.find((a) => a.store_domain === shop) ?? apps[0] ?? createSignupApp(ctx.workspace.id, ctx.workspace.name);
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
