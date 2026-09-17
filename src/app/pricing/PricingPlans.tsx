'use client';

import Link from 'next/link';
import PlanPicker from '@/components/billing/PlanPicker';

export default function PricingPlans({ signedIn }: { signedIn: boolean }) {
  return (
    <PlanPicker
      renderAction={(plan, interval, featured) => (
        <Link
          href={signedIn ? `/app/billing?plan=${plan}&interval=${interval}` : `/signup?plan=${plan}&interval=${interval}`}
          className={`flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${featured ? 'bg-cta text-cta-fg hover:opacity-85' : 'border border-line text-ink hover:border-line-hi'}`}
        >
          Start free trial
        </Link>
      )}
    />
  );
}
