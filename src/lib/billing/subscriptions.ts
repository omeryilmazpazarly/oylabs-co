import 'server-only';
import type Stripe from 'stripe';
import { getDb, now } from '@/lib/messaging/db';
import { env } from '@/lib/messaging/env';
import type { Workspace } from '@/lib/messaging/workspaces';
import { errorSummary, log } from '@/lib/log';
import { lookupKey, parseLookupKey, TRIAL_DAYS, type BillingInterval, type PlanId } from './plans';
import { PORTAL_CONFIG_METADATA, stripe } from './stripe';

/**
 * Stripe Checkout, Customer Portal and subscription sync. The workspace row
 * mirrors the Stripe subscription; Stripe stays the source of truth and
 * webhooks keep the mirror current.
 */

const LIVE_STATUSES = new Set(['trialing', 'active', 'past_due', 'unpaid', 'incomplete', 'paused']);

export function hasLiveSubscription(w: Pick<Workspace, 'stripe_subscription_id' | 'subscription_status'>): boolean {
  return Boolean(w.stripe_subscription_id && w.subscription_status && LIVE_STATUSES.has(w.subscription_status));
}

/* ── Prices & portal configuration (cached lookups) ──────────────────── */

const priceCache = new Map<string, { id: string; at: number }>();
const CACHE_MS = 10 * 60 * 1000;

export async function priceIdFor(plan: PlanId, interval: BillingInterval): Promise<string> {
  const key = lookupKey(plan, interval);
  const cached = priceCache.get(key);
  if (cached && now() - cached.at < CACHE_MS) return cached.id;
  const { data } = await stripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (!data[0]) throw new Error(`No active Stripe price with lookup key ${key}. Run scripts/stripe-setup.mjs.`);
  priceCache.set(key, { id: data[0].id, at: now() });
  return data[0].id;
}

let portalConfig: { id: string | null; at: number } | null = null;

async function portalConfigurationId(): Promise<string | undefined> {
  if (portalConfig && now() - portalConfig.at < CACHE_MS) return portalConfig.id ?? undefined;
  const { data } = await stripe().billingPortal.configurations.list({ active: true, limit: 100 });
  const match = data.find((c) => c.metadata?.oylabs === PORTAL_CONFIG_METADATA.oylabs);
  portalConfig = { id: match?.id ?? null, at: now() };
  return match?.id;
}

/* ── Checkout & portal ───────────────────────────────────────────────── */

async function ensureCustomer(workspace: Workspace, ownerEmail: string): Promise<string> {
  if (workspace.stripe_customer_id) return workspace.stripe_customer_id;
  const customer = await stripe().customers.create({
    email: ownerEmail,
    name: workspace.name,
    metadata: { workspace_id: String(workspace.id) },
  }, { idempotencyKey: `oylabs-customer-${workspace.id}` });
  getDb().prepare('UPDATE workspaces SET stripe_customer_id = ?, updated_at = ? WHERE id = ?').run(customer.id, now(), workspace.id);
  return customer.id;
}

/** Returns the Stripe-hosted URL to send the owner to. */
export async function createCheckout(workspace: Workspace, ownerEmail: string, plan: PlanId, interval: BillingInterval): Promise<string> {
  if (hasLiveSubscription(workspace)) {
    // Plan changes for existing subscribers happen in the Customer Portal, never as a second subscription.
    return createPortalSession(workspace, '/app/billing', true);
  }
  const base = env.appBaseUrl();
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: await ensureCustomer(workspace, ownerEmail),
    client_reference_id: String(workspace.id),
    line_items: [{ price: await priceIdFor(plan, interval), quantity: 1 }],
    payment_method_collection: 'always',
    subscription_data: {
      metadata: { workspace_id: String(workspace.id) },
      ...(workspace.trial_used ? {} : {
        trial_period_days: TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      }),
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: { name: 'auto', address: 'auto' },
    success_url: `${base}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/app/billing?checkout=cancelled`,
  });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  log.info('billing.checkout.created', { workspaceId: workspace.id, plan, interval, trial: !workspace.trial_used });
  return session.url;
}

export async function createPortalSession(workspace: Workspace, returnPath: string, updatePlan = false): Promise<string> {
  if (!workspace.stripe_customer_id) throw new Error('This workspace has no Stripe customer yet.');
  const configuration = await portalConfigurationId();
  const session = await stripe().billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${env.appBaseUrl()}${returnPath}`,
    ...(configuration ? { configuration } : {}),
    ...(updatePlan && workspace.stripe_subscription_id ? { flow_data: { type: 'subscription_update', subscription_update: { subscription: workspace.stripe_subscription_id } } } : {}),
  });
  return session.url;
}

/** Called from the Checkout success redirect so the page is correct before the webhook lands. */
export async function syncCheckoutSession(workspaceId: number, sessionId: string): Promise<void> {
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  if (session.client_reference_id !== String(workspaceId)) return; // not this workspace's checkout
  if (session.subscription && typeof session.subscription !== 'string') syncSubscription(session.subscription);
}

/* ── Sync ────────────────────────────────────────────────────────────── */

/**
 * Mirrors a Stripe subscription onto its workspace.
 * `eventCreatedSec` guards against out-of-order webhook deliveries.
 */
export function syncSubscription(sub: Stripe.Subscription, eventCreatedSec?: number): { workspaceId: number } | null {
  const db = getDb();
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const byMetadata = Number(sub.metadata?.workspace_id);
  const row = (byMetadata ? db.prepare('SELECT * FROM workspaces WHERE id = ?').get(byMetadata) : undefined)
    ?? db.prepare('SELECT * FROM workspaces WHERE stripe_customer_id = ?').get(customerId);
  const workspace = row as (Workspace & { stripe_synced_at: number | null }) | undefined;
  if (!workspace) {
    log.warn('billing.sync.unknown_workspace', { subscription: sub.id });
    return null;
  }

  const syncedAt = eventCreatedSec ? eventCreatedSec * 1000 : now();
  const sameSubscription = workspace.stripe_subscription_id === sub.id;
  if (sameSubscription && eventCreatedSec && workspace.stripe_synced_at && syncedAt < workspace.stripe_synced_at) {
    return { workspaceId: workspace.id }; // older event than what we already applied
  }
  const ended = sub.status === 'canceled' || sub.status === 'incomplete_expired';
  if (!sameSubscription && workspace.stripe_subscription_id && ended && hasLiveSubscription(workspace)) {
    return { workspaceId: workspace.id }; // an old subscription ending must not overwrite the current one
  }

  const item = sub.items?.data?.[0];
  const parsed = parseLookupKey(item?.price?.lookup_key);
  const pastDueSince = sub.status === 'past_due' ? (workspace.subscription_status === 'past_due' && workspace.past_due_since ? workspace.past_due_since : syncedAt) : null;

  db.prepare(`
    UPDATE workspaces SET
      stripe_customer_id = @customerId, stripe_subscription_id = @subscriptionId,
      plan = @plan, billing_interval = @interval, subscription_status = @status,
      trial_ends_at = @trialEnds, current_period_end = @periodEnd, cancel_at_period_end = @cancelling,
      past_due_since = @pastDueSince, trial_used = MAX(trial_used, @trialUsed), stripe_synced_at = @syncedAt, updated_at = @now
    WHERE id = @id
  `).run({
    customerId,
    subscriptionId: sub.id,
    plan: parsed?.plan ?? workspace.plan,
    interval: parsed?.interval ?? item?.price?.recurring?.interval ?? workspace.billing_interval,
    status: sub.status,
    trialEnds: sub.trial_end ? sub.trial_end * 1000 : null,
    periodEnd: item?.current_period_end ? item.current_period_end * 1000 : null,
    cancelling: sub.cancel_at_period_end || sub.cancel_at ? 1 : 0,
    pastDueSince,
    trialUsed: sub.trial_end ? 1 : 0,
    syncedAt,
    now: now(),
    id: workspace.id,
  });
  log.info('billing.subscription.synced', { workspaceId: workspace.id, status: sub.status, plan: parsed?.plan ?? null });
  return { workspaceId: workspace.id };
}

export interface StripeDeps {
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription>;
}

const defaultDeps: StripeDeps = {
  retrieveSubscription: (id) => stripe().subscriptions.retrieve(id),
};

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const ref = invoice.parent?.subscription_details?.subscription;
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

/** Idempotent: each Stripe event id is applied once; failures are retried by Stripe. */
export async function handleStripeEvent(event: Stripe.Event, deps: StripeDeps = defaultDeps): Promise<'processed' | 'duplicate' | 'ignored'> {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO stripe_events (id, type, received_at) VALUES (?, ?, ?)').run(event.id, event.type, now());
  const existing = db.prepare('SELECT processed_at FROM stripe_events WHERE id = ?').get(event.id) as { processed_at: number | null };
  if (existing.processed_at) return 'duplicate';

  let outcome: 'processed' | 'ignored' = 'processed';
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (session.mode === 'subscription' && subId) syncSubscription(await deps.retrieveSubscription(subId));
        else outcome = 'ignored';
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'customer.subscription.trial_will_end':
        syncSubscription(event.data.object, event.created);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const subId = invoiceSubscriptionId(event.data.object);
        if (subId) syncSubscription(await deps.retrieveSubscription(subId));
        else outcome = 'ignored';
        break;
      }
      default:
        outcome = 'ignored';
    }
  } catch (err) {
    db.prepare('UPDATE stripe_events SET error = ? WHERE id = ?').run(errorSummary(err), event.id);
    throw err;
  }
  db.prepare('UPDATE stripe_events SET processed_at = ?, error = NULL WHERE id = ?').run(now(), event.id);
  return outcome;
}

export function constructStripeEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error('Missing Stripe-Signature header');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  return stripe().webhooks.constructEvent(rawBody, signature, secret);
}

