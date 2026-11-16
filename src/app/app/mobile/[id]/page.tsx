import Link from 'next/link';
import { Card, Notice, Stat } from '@/components/console/ui';
import { SecretField } from '@/components/console/client';
import { deviceStats } from '@/lib/apps/push';
import { listBanners } from '@/lib/apps/apps';
import { formatDate } from '@/components/console/ui';
import { loadApp } from './load';
import { DEFAULT_SETTINGS } from '@/lib/apps/settings';
import { manageCarePlanAction, paySetupFeeAction, startAppPlanAction } from '../actions';
import { APP_PLANS, appPlanById, SETUP_ADDON_USD } from '@/lib/apps/plans';
import { primaryBtn } from '@/components/console/ui';
import { shopifyPricingUrl } from '@/lib/apps/shopify-billing';

export default async function MobileOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; care?: string; subscribed?: string; checkout?: string; error?: string }> }) {
  const { app, settings, isOwner } = await loadApp(params);
  const { paid, care, subscribed, checkout, error } = await searchParams;
  const careLive = app.care_status === 'active' || app.care_status === 'trialing' || app.care_status === 'past_due';
  // Self-serve apps keep their monthly plan in the same subscription columns as the legacy care plan.
  const plan = appPlanById(app.plan);
  const planLive = careLive && !!plan;
  const devices = deviceStats(app.id);
  const banners = listBanners(app.id).filter((b) => b.active).length;
  const steps = [
    { done: !!app.store_domain, label: 'Link your Shopify store', href: 'store' },
    { done: !!settings.branding.logoUrl || JSON.stringify(settings.branding.colors) !== JSON.stringify(DEFAULT_SETTINGS.branding.colors), label: 'Set your logo and colours', href: 'branding' },
    { done: banners > 0, label: 'Add home banners', href: 'home' },
    { done: !!settings.contact.whatsapp, label: 'Add your WhatsApp number', href: 'content' },
  ];
  return (
    <div className="space-y-6">
      {care && <Notice tone="green">Your care plan is active. Thank you!</Notice>}
      {subscribed && <Notice tone="green">You&apos;re subscribed to {plan?.name ?? 'your plan'}. Thank you! Follow the steps below to finish your app.</Notice>}
      {paid && <Notice tone="green">Thank you, your done-for-you setup is paid. We&apos;ll email you within one business day to connect and publish your app.</Notice>}
      {app.setup_paid_at && !paid && !app.store_domain && <Notice>Your done-for-you setup is paid. We&apos;ll email you within one business day to connect and publish your app.</Notice>}
      {checkout === 'cancelled' && <Notice>Payment was cancelled, nothing was charged. Pick a plan below when you&apos;re ready.</Notice>}
      {error === 'billing' && <Notice tone="red">Online payment isn&apos;t available right now. Please try again in a few minutes.</Notice>}
      {!planLive && !careLive && app.billing_source === 'shopify' && app.store_domain && (
        <Card title="Choose your plan" description="Your plan is billed by Shopify, on your Shopify invoice. Cancel any time; your settings stay saved.">
          <a href={shopifyPricingUrl(app.store_domain)} className={primaryBtn}>Choose a plan in Shopify</a>
        </Card>
      )}
      {!planLive && !careLive && app.billing_source !== 'shopify' && (
        <Card title="Choose your plan" description="Monthly, no setup fee, cancel any time. Your settings stay saved if you stop.">
          {isOwner ? (
            <form action={startAppPlanAction} className="space-y-4">
              <input type="hidden" name="appId" value={app.id} />
              <div className="grid gap-3 sm:grid-cols-3">
                {APP_PLANS.map((p) => (
                  <label key={p.id} className="flex cursor-pointer flex-col gap-1 rounded-xl border border-line p-4 has-[:checked]:border-ink">
                    <span className="flex items-center gap-2">
                      <input type="radio" name="plan" value={p.id} defaultChecked={p.id === (app.plan ?? 'app-growth')} />
                      <span className="font-semibold text-ink">{p.name}</span>
                    </span>
                    <span className="text-lg font-semibold text-ink">${p.monthlyUsd}<span className="text-xs font-normal text-ink-dim">/month</span></span>
                    <span className="text-xs leading-relaxed text-ink-dim">{p.blurb}</span>
                  </label>
                ))}
              </div>
              {!app.setup_paid_at && (
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input type="checkbox" name="setup" value="1" className="mt-0.5" />
                  <span>Add done-for-you setup, ${SETUP_ADDON_USD} once: we connect your store, design your app and publish it for you.</span>
                </label>
              )}
              <button className={primaryBtn}>Continue to payment</button>
            </form>
          ) : (
            <p className="text-sm text-ink-dim">The workspace owner can choose a plan here.</p>
          )}
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Phones with notifications" value={devices.total ?? 0} hint={`${devices.offers ?? 0} accept offers`} />
        <Stat label="Live home sections" value={banners} href={`/app/mobile/${app.id}/home`} />
        <Stat label="Last change" value={formatDate(app.updated_at)} hint={`Config version ${app.config_version}`} />
      </div>
      {planLive && (
        <Card title={`Plan: ${plan?.name ?? 'App'}`} description={`$${plan?.monthlyUsd ?? ''}/month. Cancel any time; your settings stay saved.`}>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={app.care_status === 'past_due' ? 'text-red-600' : 'text-emerald-600'}>
              {app.care_status === 'past_due' ? (app.billing_source === 'shopify' ? 'Shopify could not collect the payment. Check your Shopify billing.' : 'Payment failed: please update your card.') : 'Active'}
            </span>
            {isOwner && app.billing_source === 'shopify' && app.store_domain && (
              <a href={shopifyPricingUrl(app.store_domain)} className="text-ink underline">Change or cancel in Shopify</a>
            )}
            {isOwner && app.billing_source !== 'shopify' && (
              <form action={manageCarePlanAction}>
                <input type="hidden" name="appId" value={app.id} />
                <button className="text-ink underline">Manage card, invoices or cancel</button>
              </form>
            )}
          </div>
        </Card>
      )}
      {planLive && !app.setup_paid_at && isOwner && app.billing_source !== 'shopify' && (
        <Card title="Rather we do it for you?" description={`Done-for-you setup, $${SETUP_ADDON_USD} once: we connect your store, design your app and publish it on Google Play and the App Store.`}>
          <form action={paySetupFeeAction}>
            <input type="hidden" name="appId" value={app.id} />
            <button className={primaryBtn}>Add done-for-you setup · ${SETUP_ADDON_USD}</button>
          </form>
        </Card>
      )}
      {careLive && !app.plan && (
        <Card title="Care plan" description="App and Shopify updates, store releases, new features and priority support.">
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
        </Card>
      )}
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
