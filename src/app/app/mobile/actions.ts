'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { stripeConfigured } from '@/lib/billing/stripe';
import { createCareCheckout, createSetupCheckout } from '@/lib/apps/billing';
import { createPortalSession } from '@/lib/billing/subscriptions';
import { assertClient } from '@/lib/auth/client-session';
import {
  AppError,
  createBanner,
  deleteBanner,
  getWorkspaceApp,
  linkStore,
  moveBanner,
  updateBanner,
  updateSettings,
  updateStoreConnection,
  type BannerInput,
  type BannerKind,
} from '@/lib/apps/apps';
import { sendCampaign, type Audience } from '@/lib/apps/push';
import { lookupStore, registerWebhooks } from '@/lib/apps/shopify';
import { autofillApp } from '@/lib/apps/autofill';
import { errorSummary, log } from '@/lib/log';

type Result = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };

/** The app, if it belongs to the signed-in client's current workspace. */
async function ownedApp(fd: FormData, owner = false) {
  const ctx = await assertClient(owner ? { owner: true } : {});
  const app = getWorkspaceApp(ctx.workspace.id, Number(fd.get('appId')));
  if (!app) throw new AppError('App not found.');
  return { ctx, app };
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '');

/** Turns dotted field names ("branding.colors.primary", "content.trust.0.title.en") into a nested object. */
function nested(fd: FormData, prefixes: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (typeof value !== 'string' || !prefixes.some((p) => key.startsWith(`${p}.`))) continue;
    const parts = key.split('.');
    let node: Record<string, unknown> = out;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = value === 'true' ? true : value === 'false' ? false : value;
      } else {
        const nextIsIndex = /^\d+$/.test(parts[i + 1]);
        node[part] ??= nextIsIndex ? [] : {};
        node = node[part] as Record<string, unknown>;
      }
    });
  }
  return out;
}

function fail(err: unknown): Result {
  if (err instanceof AppError) return { status: 'error', message: err.message };
  log.error('mobile_portal_action_failed', { error: errorSummary(err) });
  return { status: 'error', message: 'Something went wrong. Try again.' };
}

function done(appId: number, message: string): Result {
  revalidatePath(`/app/mobile/${appId}`, 'layout');
  return { status: 'ok', message };
}

export async function saveSettingsAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { app } = await ownedApp(fd);
    const patch = nested(fd, ['branding', 'content', 'contact', 'integrations', 'features']);
    if (fd.has('layout')) patch.layout = str(fd, 'layout');
    // Unchecked checkboxes send nothing; the form lists which booleans it shows.
    for (const key of str(fd, 'booleans').split(',').filter(Boolean)) {
      const [group, field] = key.split('.');
      const g = (patch[group] ??= {}) as Record<string, unknown>;
      g[field] = fd.get(key) === 'on' || fd.get(key) === 'true';
    }
    updateSettings(app.id, patch);
    return done(app.id, 'Saved. The app picks this up the next time it opens.');
  } catch (err) {
    return fail(err);
  }
}

export async function connectStoreAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { app } = await ownedApp(fd, true);
    const store = await lookupStore(str(fd, 'address'));
    linkStore(app.id, store.domain);
    log.info('mobile_app.store_linked', { appId: app.id, domain: store.domain });
    // Fill logo, colours, contacts, copy and home sections from the store; edits stay the owner's.
    const { filled } = await autofillApp(app.id, store.domain).catch((err) => {
      log.error('mobile_app.autofill.failed', { appId: app.id, error: errorSummary(err) });
      return { filled: [] as string[] };
    });
    return done(app.id, filled.length
      ? `Connected to ${store.name}. We filled your logo, colours, contacts and home page from your store; check them in the other tabs.`
      : `Connected to ${store.name}. Your app now shows its products.`);
  } catch (err) {
    return fail(err);
  }
}

export async function saveStoreAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { app } = await ownedApp(fd, true);
    updateStoreConnection(app.id, {
      storeDomain: str(fd, 'storeDomain'),
      storefrontToken: str(fd, 'storefrontToken'),
      customerShopId: str(fd, 'customerShopId'),
      customerClientId: str(fd, 'customerClientId'),
      customerApiEndpoint: str(fd, 'customerApiEndpoint'),
      customerAuthEndpoint: str(fd, 'customerAuthEndpoint'),
      adminToken: str(fd, 'adminToken'),
      webhookSecret: str(fd, 'webhookSecret'),
    });
    return done(app.id, 'Store connection saved.');
  } catch (err) {
    return fail(err);
  }
}

export async function connectWebhooksAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { app } = await ownedApp(fd, true);
    const created = await registerWebhooks(app);
    return done(app.id, created ? `Connected ${created} Shopify notifications.` : 'Already connected.');
  } catch (err) {
    return fail(err);
  }
}

function bannerInput(fd: FormData): BannerInput {
  const date = (key: string) => {
    const v = str(fd, key);
    const ms = v ? Date.parse(v) : NaN;
    return Number.isFinite(ms) ? ms : null;
  };
  return {
    kind: str(fd, 'kind') as BannerKind,
    titleEn: str(fd, 'titleEn'),
    titleAr: str(fd, 'titleAr'),
    subtitleEn: str(fd, 'subtitleEn'),
    subtitleAr: str(fd, 'subtitleAr'),
    ctaEn: str(fd, 'ctaEn'),
    ctaAr: str(fd, 'ctaAr'),
    imageUrl: str(fd, 'imageUrl'),
    link: str(fd, 'link'),
    collectionHandle: str(fd, 'collectionHandle'),
    active: fd.get('active') === 'on',
    startsAt: date('startsAt'),
    endsAt: date('endsAt'),
  };
}

export async function saveBannerAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { app } = await ownedApp(fd);
    const bannerId = Number(fd.get('bannerId'));
    if (bannerId) updateBanner(app.id, bannerId, bannerInput(fd));
    else createBanner(app.id, bannerInput(fd));
    return done(app.id, bannerId ? 'Section saved.' : 'Section added.');
  } catch (err) {
    return fail(err);
  }
}

export async function deleteBannerAction(fd: FormData): Promise<void> {
  const { app } = await ownedApp(fd);
  deleteBanner(app.id, Number(fd.get('bannerId')));
  revalidatePath(`/app/mobile/${app.id}/home`);
}

export async function moveBannerAction(fd: FormData): Promise<void> {
  const { app } = await ownedApp(fd);
  moveBanner(app.id, Number(fd.get('bannerId')), fd.get('direction') === 'up' ? 'up' : 'down');
  revalidatePath(`/app/mobile/${app.id}/home`);
}

export async function sendPushAction(_prev: Result, fd: FormData): Promise<Result> {
  try {
    const { ctx, app } = await ownedApp(fd);
    const audience = (str(fd, 'audience') === 'all' ? 'all' : 'topic:offers') as Audience;
    const { sent } = await sendCampaign({
      appId: app.id,
      title: str(fd, 'title'),
      body: str(fd, 'body'),
      link: str(fd, 'link'),
      audience,
      userId: ctx.user.id,
    });
    return done(app.id, sent ? `Sent to ${sent} phone${sent === 1 ? '' : 's'}.` : 'Sent, but no phones are subscribed yet.');
  } catch (err) {
    return fail(err);
  }
}

/** Owner pays the one-time setup fee through Stripe Checkout. */
export async function paySetupFeeAction(fd: FormData): Promise<void> {
  const { ctx, app } = await ownedApp(fd, true);
  if (app.setup_paid_at) redirect(`/app/mobile/${app.id}`);
  if (!stripeConfigured()) redirect(`/app/mobile/${app.id}?error=billing`);
  let url: string;
  try {
    url = await createSetupCheckout(app, ctx.user.email, ctx.workspace.stripe_customer_id ?? null);
  } catch (err) {
    log.error('mobile_setup_checkout_failed', { appId: app.id, error: errorSummary(err) });
    redirect(`/app/mobile/${app.id}?error=billing`);
  }
  redirect(url);
}

export async function startCarePlanAction(fd: FormData): Promise<void> {
  const { ctx, app } = await ownedApp(fd, true);
  if (app.care_status === 'active' || app.care_status === 'trialing') redirect(`/app/mobile/${app.id}`);
  if (!stripeConfigured()) redirect(`/app/mobile/${app.id}?error=billing`);
  let url: string;
  try {
    url = await createCareCheckout(app, ctx.user.email, ctx.workspace.stripe_customer_id ?? null);
  } catch (err) {
    log.error('mobile_care_checkout_failed', { appId: app.id, error: errorSummary(err) });
    redirect(`/app/mobile/${app.id}?error=billing`);
  }
  redirect(url);
}

/** Stripe's billing portal: card, invoices and cancelling the care plan. */
export async function manageCarePlanAction(fd: FormData): Promise<void> {
  const { ctx, app } = await ownedApp(fd, true);
  if (!stripeConfigured() || !ctx.workspace.stripe_customer_id) redirect(`/app/mobile/${app.id}?error=billing`);
  let url: string;
  try {
    url = await createPortalSession(ctx.workspace, `/app/mobile/${app.id}`);
  } catch (err) {
    log.error('mobile_care_portal_failed', { appId: app.id, error: errorSummary(err) });
    redirect(`/app/mobile/${app.id}?error=billing`);
  }
  redirect(url);
}

/** Choose (or re-choose after cancelling) a monthly app plan from the app overview. */
export async function startAppPlanAction(fd: FormData): Promise<void> {
  await ownedApp(fd, true);
  redirect(`/app/mobile/start?plan=${encodeURIComponent(str(fd, 'plan'))}${fd.get('setup') === '1' ? '&setup=1' : ''}`);
}
