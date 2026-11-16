import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { createSignupApp, listApps } from '@/lib/apps/apps';
import { createPlanCheckout } from '@/lib/apps/billing';
import { setUpAppFromStore } from '@/lib/apps/autofill';
import { isLayoutId } from '@/lib/apps/layouts';
import { isAppPlanId } from '@/lib/apps/plans';
import { stripeConfigured } from '@/lib/billing/stripe';
import { attachInstall, CLAIM_COOKIE, claimedShop } from '@/lib/apps/shopify-oauth';
import { errorSummary, log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * `/app/mobile/start?plan=app-growth[&setup=1]`: where App Builder sign-ups land after
 * confirming their email. Sends the owner straight to Stripe Checkout for the plan.
 */
export default async function StartAppPlan({ searchParams }: { searchParams: Promise<{ plan?: string; setup?: string; store?: string; layout?: string }> }) {
  const { plan, setup, store, layout } = await searchParams;
  const ctx = await requireClient({ owner: true });
  const app = listApps(ctx.workspace.id)[0] ?? createSignupApp(ctx.workspace.id, ctx.workspace.name);
  // A store picked on the landing page fills the app while the owner pays.
  if (store && !app.store_domain) void setUpAppFromStore(app.id, store.slice(0, 200), isLayoutId(layout) ? layout : 'classic');
  // Installed from Shopify in this browser: the same store gets its one-click connection.
  const claimed = claimedShop((await cookies()).get(CLAIM_COOKIE)?.value);
  if (claimed && (!store || store === claimed)) {
    await attachInstall(app.id, claimed).catch((err) => log.error('shopify_oauth.claim_failed', { appId: app.id, error: errorSummary(err) }));
  }
  const live = app.care_status === 'active' || app.care_status === 'trialing' || app.care_status === 'past_due';
  if (!isAppPlanId(plan) || (live && app.plan)) redirect(`/app/mobile/${app.id}`);
  if (!stripeConfigured()) redirect(`/app/mobile/${app.id}?error=billing`);
  let url: string;
  try {
    url = await createPlanCheckout(app, plan, setup === '1', ctx.user.email, ctx.workspace.stripe_customer_id ?? null);
  } catch (err) {
    log.error('mobile_plan_checkout_failed', { appId: app.id, error: errorSummary(err) });
    redirect(`/app/mobile/${app.id}?error=billing`);
  }
  redirect(url);
}
