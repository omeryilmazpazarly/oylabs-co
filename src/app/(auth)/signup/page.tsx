import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/auth/client-session';
import { isInterval, isPlanId, planById, TRIAL_DAYS } from '@/lib/billing/plans';
import { appPlanById, SETUP_ADDON_USD } from '@/lib/apps/plans';
import { isLayoutId, LAYOUTS } from '@/lib/apps/layouts';
import { PhonePreview } from '@/components/apps/PhonePreview';
import { storePreviewUrl } from '@/lib/apps/preview-urls';
import AuthShell from '../AuthShell';
import { SignupForm } from '../forms';

export const metadata = { title: 'Create your account — OY Labs', description: 'Start your OY Labs plan.' };

type Params = { plan?: string; interval?: string; setup?: string; store?: string; layout?: string };

const cleanStore = (v?: string) => {
  const host = (v ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : undefined;
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { plan, interval, setup, store: storeParam, layout: layoutParam } = await searchParams;
  const appPlan = appPlanById(plan);
  const withSetup = Boolean(appPlan && setup === '1');
  const store = appPlan ? cleanStore(storeParam) : undefined;
  const layout = isLayoutId(layoutParam) ? layoutParam : 'classic';
  const carry = appPlan ? `plan=${appPlan.id}${withSetup ? '&setup=1' : ''}${store ? `&store=${store}&layout=${layout}` : ''}` : '';
  const ctx = await getClient();
  if (ctx?.workspace) {
    if (appPlan) redirect(`/app/mobile/start?${carry}`);
    redirect(`/app/billing${plan ? `?plan=${plan}&interval=${interval ?? 'month'}` : ''}`);
  }
  const chosen = isPlanId(plan) ? planById(plan) : undefined;
  const subtitle = appPlan
    ? `${store ? `Your ${LAYOUTS[layout].name.en} app for ${store}. ` : ''}${appPlan.name} · $${appPlan.monthlyUsd}/month${withSetup ? ` + $${SETUP_ADDON_USD} done-for-you setup` : ''}. Cancel any time.`
    : chosen ? `${chosen.name} plan · ${TRIAL_DAYS}-day free trial` : `${TRIAL_DAYS}-day free trial on every plan`;
  return (
    <AuthShell
      wide
      title={store ? 'Your app is ready. Create your account' : 'Create your account'}
      subtitle={subtitle}
      aside={store ? <PhonePreview src={storePreviewUrl(store, layout)} /> : undefined}
      footer={<>Already have an account?{' '}<Link href={appPlan ? `/login?next=${encodeURIComponent(`/app/mobile/start?${carry}`)}` : '/login'} className="text-ink underline">Sign in</Link></>}
    >
      <SignupForm plan={appPlan?.id ?? chosen?.id} interval={isInterval(interval) ? interval : undefined} setup={withSetup} store={store} layout={store ? layout : undefined} />
    </AuthShell>
  );
}
