import { redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { createSignupApp, listApps } from '@/lib/apps/apps';
import { createPlanCheckout } from '@/lib/apps/billing';
import { isAppPlanId } from '@/lib/apps/plans';
import { stripeConfigured } from '@/lib/billing/stripe';
import { errorSummary, log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * `/app/mobile/start?plan=app-growth[&setup=1]`: where App Builder sign-ups land after
 * confirming their email. Sends the owner straight to Stripe Checkout for the plan.
 */
export default async function StartAppPlan({ searchParams }: { searchParams: Promise<{ plan?: string; setup?: string }> }) {
  const { plan, setup } = await searchParams;
  const ctx = await requireClient({ owner: true });
  const app = listApps(ctx.workspace.id)[0] ?? createSignupApp(ctx.workspace.id, ctx.workspace.name);
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
