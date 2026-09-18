import { planById } from '@/lib/billing/plans';
import { serviceState, pageLimit, type BillingFields } from '@/lib/billing/entitlements';
import { Badge, formatDate, type Tone } from './ui';

/** One-line billing status used in the console and the portal. */
export function BillingBadge({ w, nowMs }: { w: BillingFields; nowMs: number }) {
  const state = serviceState(w, nowMs);
  const plan = planById(w.plan)?.name;
  const labels: Record<string, [string, Tone]> = {
    complimentary: ['Complimentary', 'blue'],
    trialing: [`Trial${plan ? ` · ${plan}` : ''}`, 'blue'],
    active: [plan ?? 'Active', 'green'],
    grace: ['Payment failed', 'amber'],
    paused_unpaid: ['Paused — unpaid', 'red'],
    canceled: ['Cancelled', 'gray'],
    incomplete: ['Checkout incomplete', 'amber'],
    no_subscription: ['No plan', 'gray'],
  };
  const [label, tone] = labels[state.kind];
  return <Badge tone={tone}>{label}</Badge>;
}

export function billingSummary(w: BillingFields, nowMs: number): string {
  const state = serviceState(w, nowMs);
  switch (state.kind) {
    case 'complimentary': return `Complimentary account · up to ${pageLimit(w)} channel${pageLimit(w) === 1 ? '' : 's'}.`;
    case 'trialing': return `Free trial${w.trial_ends_at ? ` until ${formatDate(w.trial_ends_at)}` : ''}${w.cancel_at_period_end ? ' · set to cancel' : ''}.`;
    case 'active': return w.cancel_at_period_end && w.current_period_end ? `Cancels on ${formatDate(w.current_period_end)}.` : w.current_period_end ? `Renews on ${formatDate(w.current_period_end)}.` : 'Active.';
    case 'grace': return `The last payment failed. Service pauses on ${formatDate(state.pausesAt)} unless the card is updated.`;
    case 'paused_unpaid': return 'Service is paused because payment failed. Messages are still being saved and will be delivered once billing is updated.';
    case 'canceled': return 'The subscription has ended. Choose a plan to resume the service.';
    case 'incomplete': return 'Checkout was not completed. Choose a plan to try again.';
    default: return 'No plan yet. Choose a plan to start your free trial.';
  }
}
