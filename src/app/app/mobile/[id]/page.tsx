import Link from 'next/link';
import { Card, Notice, Stat } from '@/components/console/ui';
import { SecretField } from '@/components/console/client';
import { deviceStats } from '@/lib/apps/push';
import { listBanners } from '@/lib/apps/apps';
import { formatDate } from '@/components/console/ui';
import { loadApp } from './load';
import { manageCarePlanAction, paySetupFeeAction, startCarePlanAction } from '../actions';
import { primaryBtn } from '@/components/console/ui';

export default async function MobileOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; care?: string; error?: string }> }) {
  const { app, settings, isOwner } = await loadApp(params);
  const { paid, care, error } = await searchParams;
  const careLive = app.care_status === 'active' || app.care_status === 'trialing' || app.care_status === 'past_due';
  const devices = deviceStats(app.id);
  const banners = listBanners(app.id).filter((b) => b.active).length;
  const steps = [
    { done: !!app.store_domain, label: 'Link your Shopify store', href: 'store' },
    { done: !!(settings.branding.logoUrl || settings.branding.wordmark !== 'STORE'), label: 'Set your logo and colours', href: 'branding' },
    { done: banners > 0, label: 'Add home banners', href: 'home' },
    { done: !!settings.contact.whatsapp, label: 'Add your WhatsApp number', href: 'content' },
  ];
  return (
    <div className="space-y-6">
      {care && <Notice tone="green">Your care plan is active. Thank you!</Notice>}
      {paid && <Notice tone="green">Thank you, your payment went through. We&apos;ll start building your app.</Notice>}
      {error === 'billing' && <Notice tone="red">Online payment isn&apos;t available right now. Email hi@oylabs.co and we&apos;ll send an invoice.</Notice>}
      {!app.setup_paid_at && !paid && (
        <Card title="Setup fee" description="One-time $1,400: design, build and publication on Google Play and the App Store.">
          {isOwner ? (
            <form action={paySetupFeeAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="appId" value={app.id} />
              <button className={primaryBtn}>Pay $1,400 securely</button>
              <span className="text-xs text-ink-dim">Card payment by Stripe. Prefer a bank transfer? Email hi@oylabs.co.</span>
            </form>
          ) : (
            <p className="text-sm text-ink-dim">The workspace owner can pay the setup fee here.</p>
          )}
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Phones with notifications" value={devices.total ?? 0} hint={`${devices.offers ?? 0} accept offers`} />
        <Stat label="Live home sections" value={banners} href={`/app/mobile/${app.id}/home`} />
        <Stat label="Last change" value={formatDate(app.updated_at)} hint={`Config version ${app.config_version}`} />
      </div>
      <Card
        title="Care plan"
        description="Optional, $200/month: app and Shopify updates, Google Play and App Store releases, new features as they ship, and priority WhatsApp support. Cancel any time."
      >
        {careLive ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={app.care_status === 'past_due' ? 'text-red-600' : 'text-emerald-600'}>
              {app.care_status === 'past_due' ? 'Payment failed: please update your card.' : 'Active'}
            </span>
            {isOwner && (
              <form action={manageCarePlanAction}>
                <input type="hidden" name="appId" value={app.id} />
                <button className="text-ink underline">Manage card, invoices or cancel</button>
              </form>
            )}
          </div>
        ) : isOwner ? (
          <form action={startCarePlanAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="appId" value={app.id} />
            <button className={primaryBtn}>Start care plan · $200/month</button>
          </form>
        ) : (
          <p className="text-sm text-ink-dim">The workspace owner can start the care plan here.</p>
        )}
      </Card>
      <Card title="Getting started">
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.href} className="flex items-center gap-3 text-sm">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${s.done ? 'bg-emerald-500 text-white' : 'border border-line text-ink-dim'}`}>{s.done ? '✓' : ''}</span>
              <Link href={`/app/mobile/${app.id}/${s.href}`} className={s.done ? 'text-ink-dim line-through' : 'text-ink underline'}>{s.label}</Link>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="App details" description="Your app reads its live settings with this key.">
        <div className="space-y-4">
          <SecretField label="App key" value={app.public_key} note="Built into your app. It only reads public settings, so it isn't a secret." />
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-ink-dim">Android package</dt><dd className="text-ink">{app.android_package ?? '—'}</dd></div>
            <div><dt className="text-xs text-ink-dim">iOS bundle</dt><dd className="text-ink">{app.ios_bundle_id ?? '—'}</dd></div>
          </dl>
        </div>
      </Card>
    </div>
  );
}
