import Link from 'next/link';
import type { ServiceState } from '@/lib/billing/entitlements';
import { Notice, formatDate } from '@/components/console/ui';
import { now } from '@/lib/messaging/db';

const DAY = 24 * 60 * 60 * 1000;

export default function BillingBanner({ state, isOwner, trialEndsAt }: { state: ServiceState; isOwner: boolean; trialEndsAt: number | null }) {
  const cta = (label: string) => isOwner
    ? <>{' '}<Link href="/app/billing" className="font-medium underline">{label}</Link></>
    : ' Ask a workspace owner to update billing.';

  if (state.kind === 'trialing' && trialEndsAt && trialEndsAt - now() < 3 * DAY) {
    return <div className="mb-6"><Notice>Your free trial ends on {formatDate(trialEndsAt)}. Your plan starts automatically unless you cancel.{cta('Manage billing')}</Notice></div>;
  }
  if (state.kind === 'grace') {
    return <div className="mb-6"><Notice tone="amber">Your last payment failed. Service pauses on {formatDate(state.pausesAt)} unless the card is updated.{cta('Update payment method')}</Notice></div>;
  }
  if (!state.active) {
    const message = state.kind === 'paused_unpaid'
      ? 'Service is paused because payment failed. Incoming messages are still saved and will be delivered when billing is updated.'
      : state.kind === 'canceled'
        ? 'Your subscription has ended. Messages are being saved but not delivered or replied to.'
        : 'Choose a plan to start your 14-day free trial and connect your Facebook Page.';
    return <div className="mb-6"><Notice tone={state.kind === 'no_subscription' ? 'gray' : 'red'}>{message}{cta(state.kind === 'no_subscription' ? 'Choose a plan' : 'Go to billing')}</Notice></div>;
  }
  return null;
}
