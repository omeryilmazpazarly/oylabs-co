'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { PLANS, TRIAL_DAYS, type BillingInterval, type PlanId } from '@/lib/billing/plans';

const FEATURES = [
  'Messenger and Instagram Direct in one place',
  'Shared inbox with 24-hour window guidance',
  'Signed webhooks + Send API for your own CRM',
  'Unlimited team members',
];

/**
 * Plan cards with a monthly/yearly switch. `renderAction` supplies the button,
 * so the same picker drives the public pricing page and in-app checkout.
 */
export default function PlanPicker({ initialInterval = 'month', highlight = 'growth', renderAction }: {
  initialInterval?: BillingInterval;
  highlight?: PlanId;
  renderAction: (plan: PlanId, interval: BillingInterval, featured: boolean) => ReactNode;
}) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-panel p-1 text-sm">
          {(['month', 'year'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={interval === value}
              onClick={() => setInterval(value)}
              className={`rounded-full px-4 py-1.5 transition-colors ${interval === value ? 'bg-cta text-cta-fg' : 'text-ink-dim hover:text-ink'}`}
            >
              {value === 'month' ? 'Monthly' : <>Yearly <span className={interval === value ? 'opacity-70' : 'text-emerald-500'}>· 2 months free</span></>}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const featured = plan.id === highlight;
          const price = interval === 'month' ? plan.monthlyUsd : plan.yearlyUsd;
          return (
            <div key={plan.id} className={`relative flex flex-col rounded-2xl border bg-panel p-6 ${featured ? 'border-line-hi shadow-[0_0_0_1px_var(--_line-hi)]' : 'border-line'}`}>
              {featured && <span className="absolute -top-3 left-6 rounded-full bg-cta px-2.5 py-0.5 text-[11px] font-semibold text-cta-fg">Most popular</span>}
              <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-dim">{plan.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-ink">${price}</span>
                <span className="text-sm text-ink-dim">/ {interval === 'month' ? 'month' : 'year'}</span>
              </div>
              {interval === 'year' && <p className="mt-1 text-xs text-ink-dull">${(plan.yearlyUsd / 12).toFixed(2)} per month, billed yearly</p>}
              <ul className="mt-6 space-y-2.5 text-sm text-ink">
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /><strong className="font-semibold">{plan.pages} Facebook Page{plan.pages === 1 ? '' : 's'}</strong>{' '}+ linked Instagram</li>
                {FEATURES.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{f}</li>)}
              </ul>
              <div className="mt-auto pt-6">{renderAction(plan.id, interval, featured)}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-ink-dim">
        {TRIAL_DAYS}-day free trial on every plan. Card required; cancel before the trial ends and you won&rsquo;t be charged. Prices in USD.{' '}
        <Link href="/terms#subscriptions" className="underline">Subscription terms</Link>
      </p>
    </div>
  );
}
