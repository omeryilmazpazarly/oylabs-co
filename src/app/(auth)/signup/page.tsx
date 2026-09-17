import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/auth/client-session';
import { isInterval, isPlanId, planById, TRIAL_DAYS } from '@/lib/billing/plans';
import AuthShell from '../AuthShell';
import { SignupForm } from '../forms';

export const metadata = { title: 'Start your free trial — OY Labs', description: 'Connect your Facebook Page and Instagram to your inbox. 14-day free trial.' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  const { plan, interval } = await searchParams;
  const ctx = await getClient();
  if (ctx?.workspace) redirect(`/app/billing${plan ? `?plan=${plan}&interval=${interval ?? 'month'}` : ''}`);
  const chosen = isPlanId(plan) ? planById(plan) : undefined;
  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle={chosen ? `${chosen.name} plan · ${TRIAL_DAYS}-day free trial` : `${TRIAL_DAYS}-day free trial on every plan`}
      footer={<>Already have an account?{' '}<Link href="/login" className="text-ink underline">Sign in</Link></>}
    >
      <SignupForm plan={chosen?.id} interval={isInterval(interval) ? interval : undefined} />
    </AuthShell>
  );
}
