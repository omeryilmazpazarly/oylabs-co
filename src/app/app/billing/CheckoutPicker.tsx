'use client';

import type { BillingInterval, PlanId } from '@/lib/billing/plans';
import PlanPicker from '@/components/billing/PlanPicker';
import { SubmitButton } from '@/components/console/client';
import { primaryBtn, secondaryBtn } from '@/components/console/ui';

export default function CheckoutPicker({ action, initialInterval, highlight, trialAvailable, disabled }: {
  action: (formData: FormData) => Promise<void>;
  initialInterval: BillingInterval;
  highlight: PlanId;
  trialAvailable: boolean;
  disabled: boolean;
}) {
  return (
    <PlanPicker
      initialInterval={initialInterval}
      highlight={highlight}
      renderAction={(plan, interval, featured) => (
        <form action={action}>
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="interval" value={interval} />
          <SubmitButton className={`${featured ? primaryBtn : secondaryBtn} w-full py-2.5`} pendingText="Opening Stripe…">
            {disabled ? 'Unavailable' : trialAvailable ? 'Start free trial' : 'Subscribe'}
          </SubmitButton>
        </form>
      )}
    />
  );
}
