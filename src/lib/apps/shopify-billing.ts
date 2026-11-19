import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { decryptSecret } from '@/lib/messaging/crypto';
import { errorSummary, log } from '@/lib/log';
import { APP_PLANS, type AppPlanId } from './plans';
import { getInstall } from './shopify-oauth';

/**
 * Shopify managed pricing for merchants who install from the Shopify App Store.
 * The plans (same names and prices as APP_PLANS) are set up in the Partner Dashboard;
 * Shopify shows them, takes the payment and tells us through app_subscriptions/update.
 */

const API_VERSION = '2026-07';

export function shopifyPricingUrl(shop: string): string {
  const handle = process.env.SHOPIFY_APP_HANDLE || 'oy-labs-mobile-app-builder';
  return `https://admin.shopify.com/store/${shop.replace(/\.myshopify\.com$/, '')}/charges/${handle}/pricing_plans`;
}

/** "Growth", "OY Labs Growth", "growth plan" → app-growth. */
export function planFromName(name: string | null | undefined): AppPlanId | null {
  const n = (name ?? '').toLowerCase();
  return APP_PLANS.find((p) => n.includes(p.name.toLowerCase()))?.id ?? null;
}

/** Shopify subscription status → the care_status values the dashboard understands. */
export function statusFromShopify(status: string | null | undefined): string | null {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'FROZEN':
      return 'past_due';
    case 'CANCELLED':
    case 'DECLINED':
    case 'EXPIRED':
      return 'canceled';
    default:
      return null; // PENDING: not decided yet
  }
}

export function applyShopifySubscription(shop: string, sub: { id: string | null; name: string | null; status: string | null }): number {
  const status = statusFromShopify(sub.status);
  if (!status) return 0;
  const plan = planFromName(sub.name);
  const res = getDb()
    .prepare(
      `UPDATE mobile_apps SET care_subscription_id = @id, care_status = @status, plan = COALESCE(@plan, plan), updated_at = @at
       WHERE store_domain = @shop AND billing_source = 'shopify'`,
    )
    .run({ id: sub.id, status, plan, at: now(), shop });
  log.info('shopify_billing.subscription', { shop, status, plan, apps: res.changes });
  return res.changes;
}

/** Marks the app as billed by Shopify and reads any plan the store already has. */
export async function enableShopifyBilling(appId: number, shop: string): Promise<boolean> {
  getDb().prepare("UPDATE mobile_apps SET billing_source = 'shopify' WHERE id = ?").run(appId);
  const install = getInstall(shop);
  if (!install) return false;
  try {
    const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-shopify-access-token': decryptSecret(install.token_enc) },
      body: JSON.stringify({ query: '{ currentAppInstallation { activeSubscriptions { id name status } } }' }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as { data?: { currentAppInstallation?: { activeSubscriptions?: { id: string; name: string; status: string }[] } } };
    const sub = json.data?.currentAppInstallation?.activeSubscriptions?.[0];
    if (!sub) return false;
    return applyShopifySubscription(shop, sub) > 0;
  } catch (err) {
    log.error('shopify_billing.read_failed', { shop, error: errorSummary(err) });
    return false;
  }
}
