import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/auth/client-session';
import { isInterval, isPlanId, planById, TRIAL_DAYS } from '@/lib/billing/plans';
import { appPlanById, SETUP_ADDON_USD } from '@/lib/apps/plans';
import AuthShell from '../AuthShell';
import { SignupForm } from '../forms';

export const metadata = { title: 'Create your account — OY Labs', description: 'Start your OY Labs plan.' };

type Params = { plan?: string; interval?: string; setup?: string };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { plan, interval, setup } = await searchParams;
  const appPlan = appPlanById(plan);
  const withSetup = Boolean(appPlan && setup === '1');
  const ctx = await getClient();
  if (ctx?.workspace) {
    if (appPlan) redirect(`/app/mobile/start?plan=${appPlan.id}${withSetup ? '&setup=1' : ''}`);
    redirect(`/app/billing${plan ? `?plan=${plan}&interval=${interval ?? 'month'}` : ''}`);
  }
  const chosen = isPlanId(plan) ? planById(plan) : undefined;
  const subtitle = appPlan
    ? `App ${appPlan.name} · $${appPlan.monthlyUsd}/month${withSetup ? ` + $${SETUP_ADDON_USD} done-for-you setup` : ''}. Cancel any time.`
    : chosen ? `${chosen.name} plan · ${TRIAL_DAYS}-day free trial` : `${TRIAL_DAYS}-day free trial on every plan`;
  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle={subtitle}
      footer={<>Already have an account?{' '}<Link href={appPlan ? `/login?next=${encodeURIComponent(`/app/mobile/start?plan=${appPlan.id}${withSetup ? '&setup=1' : ''}`)}` : '/login'} className="text-ink underline">Sign in</Link></>}
    >
      <SignupForm plan={appPlan?.id ?? chosen?.id} interval={isInterval(interval) ? interval : undefined} setup={withSetup} />
    </AuthShell>
  );
}
