import { GRACE_DAYS, planById } from './plans';

/**
 * Whether a workspace may use the service right now, and how many Pages it
 * may connect. The TypeScript function and the SQL predicate below must agree
 * (test/billing.test.ts checks both against the same cases).
 */

export const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

export interface BillingFields {
  plan: string | null;
  subscription_status: string | null;
  past_due_since: number | null;
  complimentary: number;
  page_limit_override: number | null;
  trial_ends_at: number | null;
  current_period_end: number | null;
  cancel_at_period_end: number;
}

export type ServiceState =
  | { active: true; kind: 'complimentary' | 'trialing' | 'active' }
  | { active: true; kind: 'grace'; pausesAt: number }
  | { active: false; kind: 'no_subscription' | 'paused_unpaid' | 'canceled' | 'incomplete' };

export function serviceState(w: BillingFields, nowMs: number): ServiceState {
  if (w.complimentary) return { active: true, kind: 'complimentary' };
  switch (w.subscription_status) {
    case 'trialing':
      return { active: true, kind: 'trialing' };
    case 'active':
      return { active: true, kind: 'active' };
    case 'past_due': {
      const since = w.past_due_since ?? nowMs;
      return nowMs - since <= GRACE_MS ? { active: true, kind: 'grace', pausesAt: since + GRACE_MS } : { active: false, kind: 'paused_unpaid' };
    }
    case 'unpaid':
    case 'paused':
      return { active: false, kind: 'paused_unpaid' };
    case 'canceled':
    case 'incomplete_expired':
      return { active: false, kind: 'canceled' };
    case 'incomplete':
      return { active: false, kind: 'incomplete' };
    default:
      return { active: false, kind: 'no_subscription' };
  }
}

/** SQL equivalent of serviceState(...).active for a `workspaces` alias; bind @graceCutoff = now - GRACE_MS. */
export const SERVICE_ACTIVE_SQL = (alias: string) => `(
  ${alias}.complimentary = 1
  OR ${alias}.subscription_status IN ('trialing', 'active')
  OR (${alias}.subscription_status = 'past_due' AND COALESCE(${alias}.past_due_since, @graceCutoff) >= @graceCutoff)
)`;

export function pageLimit(w: BillingFields): number {
  if (w.page_limit_override !== null && w.page_limit_override !== undefined) return w.page_limit_override;
  if (w.complimentary) return 1;
  return planById(w.plan)?.pages ?? 0;
}
