/**
 * Subscription plans. Prices live in Stripe (created by scripts/stripe-setup.mjs)
 * and are found by lookup key, so changing an amount never needs a deploy —
 * but the numbers here must match for the pricing page.
 */

export type PlanId = 'starter' | 'growth' | 'scale';
export type BillingInterval = 'month' | 'year';

export interface Plan {
  id: PlanId;
  name: string;
  pages: number;
  monthlyUsd: number;
  yearlyUsd: number;
  blurb: string;
}

export const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', pages: 1, monthlyUsd: 29, yearlyUsd: 290, blurb: 'One Facebook Page and its Instagram account.' },
  { id: 'growth', name: 'Growth', pages: 3, monthlyUsd: 79, yearlyUsd: 790, blurb: 'Up to three brands or locations.' },
  { id: 'scale', name: 'Scale', pages: 10, monthlyUsd: 199, yearlyUsd: 1990, blurb: 'Up to ten Pages for multi-brand teams.' },
];

export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 7;

export const planById = (id: string | null | undefined): Plan | undefined => PLANS.find((p) => p.id === id);

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && PLANS.some((p) => p.id === value);
}

export function isInterval(value: unknown): value is BillingInterval {
  return value === 'month' || value === 'year';
}

/** Stripe price lookup key, e.g. "oylabs_messaging_growth_year". */
export const lookupKey = (plan: PlanId, interval: BillingInterval) => `oylabs_messaging_${plan}_${interval}`;

export function parseLookupKey(key: string | null | undefined): { plan: PlanId; interval: BillingInterval } | null {
  const match = /^oylabs_messaging_(starter|growth|scale)_(month|year)$/.exec(key ?? '');
  return match ? { plan: match[1] as PlanId, interval: match[2] as BillingInterval } : null;
}
