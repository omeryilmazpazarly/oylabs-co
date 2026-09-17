import { CreditCard, ExternalLink, Lock } from 'lucide-react';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { activeChannelCount } from '@/lib/messaging/workspaces';
import { hasLiveSubscription, syncCheckoutSession } from '@/lib/billing/subscriptions';
import { stripeConfigured } from '@/lib/billing/stripe';
import { isInterval, isPlanId, planById } from '@/lib/billing/plans';
import { pageLimit } from '@/lib/billing/entitlements';
import { errorSummary, log } from '@/lib/log';
import { Card, Notice, PageHeader, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import { BillingBadge, billingSummary } from '@/components/console/billing';
import { openBillingPortalAction, startCheckoutAction } from '../actions';
import CheckoutPicker from './CheckoutPicker';

type Search = { plan?: string; interval?: string; checkout?: string; session_id?: string; error?: string };

const ERRORS: Record<string, string> = {
  plan: 'Choose a plan to continue.',
  unavailable: 'Online payments are not available right now. Please contact hi@oylabs.co.',
  stripe: 'We could not reach Stripe. Please try again in a moment.',
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  let ctx = await requireClient({ owner: true });

  if (params.checkout === 'success' && params.session_id) {
    try {
      await syncCheckoutSession(ctx.workspace.id, params.session_id);
      ctx = await requireClient({ owner: true });
    } catch (err) {
      log.warn('billing.checkout_sync.failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    }
  }

  const w = ctx.workspace;
  const nowMs = now();
  const live = hasLiveSubscription(w);
  const plan = planById(w.plan);
  const used = activeChannelCount(w.id);
  const limit = pageLimit(w);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Billing" title={live || w.complimentary ? 'Your plan' : 'Choose a plan'} description="Payments are handled securely by Stripe. OY Labs never sees your card details." />

      {params.error && <div className="mb-6"><Notice tone="red">{ERRORS[params.error] ?? ERRORS.stripe}</Notice></div>}
      {params.checkout === 'success' && <div className="mb-6"><Notice tone="green">Thanks — your subscription is set up. You can connect your Facebook Page or WhatsApp number now.</Notice></div>}
      {params.checkout === 'cancelled' && <div className="mb-6"><Notice>Checkout was cancelled. No charge was made.</Notice></div>}

      {w.complimentary ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3"><BillingBadge w={w} nowMs={nowMs} /><span className="text-sm text-ink-dim">{billingSummary(w, nowMs)}</span></div>
        </Card>
      ) : live ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2" title="Subscription">
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-bold tracking-tight text-ink">{plan?.name ?? 'Plan'}</span>
                {plan && <span className="text-sm text-ink-dim">${w.billing_interval === 'year' ? `${plan.yearlyUsd} / year` : `${plan.monthlyUsd} / month`}</span>}
                <BillingBadge w={w} nowMs={nowMs} />
              </div>
              <p className="text-sm text-ink-dim">{billingSummary(w, nowMs)}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <form action={openBillingPortalAction}>
                  <SubmitButton className={primaryBtn} pendingText="Opening Stripe…"><CreditCard size={15} /> Manage billing</SubmitButton>
                </form>
                <form action={openBillingPortalAction}>
                  <input type="hidden" name="flow" value="update" />
                  <SubmitButton className={secondaryBtn} pendingText="Opening Stripe…">Change plan</SubmitButton>
                </form>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-dull"><ExternalLink size={12} /> Update your card, download invoices, switch monthly/yearly or cancel in Stripe&rsquo;s secure portal.</p>
            </div>
          </Card>
          <Card title="Usage">
            <div className="text-3xl font-bold tabular-nums text-ink">{used}<span className="text-lg text-ink-dim"> / {limit}</span></div>
            <p className="mt-1 text-sm text-ink-dim">Channels connected</p>
            {used > limit && <p className="mt-3 text-xs text-amber-500">You have more channels than your plan allows. The existing ones keep working; upgrade to add more.</p>}
          </Card>
        </div>
      ) : (
        <>
          {!stripeConfigured() && <div className="mb-6"><Notice tone="amber">Online payments aren&rsquo;t available yet. Please contact hi@oylabs.co to get started.</Notice></div>}
          <CheckoutPicker
            action={startCheckoutAction}
            initialInterval={isInterval(params.interval) ? params.interval : 'month'}
            highlight={isPlanId(params.plan) ? params.plan : 'growth'}
            trialAvailable={!w.trial_used}
            disabled={!stripeConfigured()}
          />
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-dull"><Lock size={12} /> Secure checkout by Stripe</p>
        </>
      )}
    </div>
  );
}
