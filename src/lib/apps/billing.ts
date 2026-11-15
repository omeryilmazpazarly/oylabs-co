import 'server-only';
import { stripe } from '@/lib/billing/stripe';
import { env } from '@/lib/messaging/env';
import { errorSummary, log } from '@/lib/log';
import { getDb } from '@/lib/messaging/db';
import { sendAccountEmail } from '@/lib/email';
import { getApp, markSetupPaid, setCareSubscription, type MobileApp } from './apps';
import { appPlanById, isAppPlanId, SETUP_ADDON_USD, type AppPlanId } from './plans';

/**
 * Mobile app billing, kept apart from the messaging plan:
 * - plan: the self-serve monthly app plan (Starter / Growth / Pro), optionally with the
 *   done-for-you setup added to the first invoice;
 * - setup: the done-for-you setup bought on its own later (one-time payment);
 * - care: the legacy $200/month plan of apps sold before self-serve.
 * All carry `metadata.kind`, which the shared Stripe webhook uses to route them here
 * instead of to the messaging subscription sync.
 */

export const SETUP_FEE_CENTS = SETUP_ADDON_USD * 100;
export const PLAN_KIND = 'mobile_app_plan';
export const SETUP_FEE_CURRENCY = 'usd';
const KIND = 'mobile_app_setup';
export const CARE_CENTS = 20_000;
export const CARE_KIND = 'mobile_app_care';

export async function createSetupCheckout(app: MobileApp, email: string, customerId: string | null): Promise<string> {
  const base = env.appBaseUrl();
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    ...(customerId ? { customer: customerId } : { customer_email: email, customer_creation: 'always' }),
    client_reference_id: String(app.workspace_id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: SETUP_FEE_CURRENCY,
          unit_amount: SETUP_FEE_CENTS,
          product_data: { name: `Done-for-you app setup (${app.name})`, description: 'We connect your store, design your app and publish it for you.' },
        },
      },
    ],
    metadata: { kind: KIND, app_id: String(app.id), workspace_id: String(app.workspace_id) },
    payment_intent_data: { metadata: { kind: KIND, app_id: String(app.id) } },
    invoice_creation: { enabled: true },
    billing_address_collection: 'auto',
    success_url: `${base}/app/mobile/${app.id}?paid=1`,
    cancel_url: `${base}/app/mobile/${app.id}`,
  });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  log.info('mobile_app.setup_checkout.created', { appId: app.id });
  return session.url;
}

/** From checkout.session.completed: true when it was a setup-fee payment (and it's now recorded). */
export async function handleSetupPayment(session: {
  mode?: string | null;
  payment_status?: string | null;
  id: string;
  customer?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
}): Promise<boolean> {
  if (session.mode !== 'payment' || session.metadata?.kind !== KIND) return false;
  const app = getApp(Number(session.metadata.app_id));
  if (app && session.payment_status === 'paid') {
    const first = !app.setup_paid_at;
    markSetupPaid(app.id, session.id);
    rememberCustomer(app.workspace_id, session.customer);
    log.info('mobile_app.setup_paid', { appId: app.id });
    if (first) await notifySetupPurchase(app);
  }
  return true;
}

/** Monthly plan checkout; `withSetup` adds the one-time done-for-you setup to the first invoice. */
export async function createPlanCheckout(app: MobileApp, plan: AppPlanId, withSetup: boolean, email: string, customerId: string | null): Promise<string> {
  const base = env.appBaseUrl();
  const chosen = appPlanById(plan)!;
  const setup = withSetup && !app.setup_paid_at;
  const metadata = { kind: PLAN_KIND, plan, setup: setup ? '1' : '0', app_id: String(app.id), workspace_id: String(app.workspace_id) };
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    client_reference_id: String(app.workspace_id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: SETUP_FEE_CURRENCY,
          unit_amount: chosen.monthlyUsd * 100,
          recurring: { interval: 'month' },
          product_data: { name: `OY Labs App · ${chosen.name}`, description: chosen.blurb },
        },
      },
      ...(setup
        ? [{
            quantity: 1,
            price_data: {
              currency: SETUP_FEE_CURRENCY,
              unit_amount: SETUP_FEE_CENTS,
              product_data: { name: 'Done-for-you setup (one time)', description: 'We connect your store, design your app and publish it for you.' },
            },
          }]
        : []),
    ],
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    success_url: `${base}/app/mobile/${app.id}?subscribed=1`,
    cancel_url: `${base}/app/mobile/${app.id}?checkout=cancelled`,
  });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  log.info('mobile_app.plan_checkout.created', { appId: app.id, plan, setup });
  return session.url;
}

/** From checkout.session.completed of a plan checkout: records a setup add-on paid with the first invoice. */
export async function handlePlanCheckout(session: { mode?: string | null; id: string; payment_status?: string | null; metadata?: Record<string, string> | null }): Promise<void> {
  if (session.mode !== 'subscription' || session.metadata?.kind !== PLAN_KIND || session.metadata.setup !== '1') return;
  if (session.payment_status !== 'paid') return;
  const app = getApp(Number(session.metadata.app_id));
  if (!app || app.setup_paid_at) return;
  markSetupPaid(app.id, session.id);
  log.info('mobile_app.setup_paid', { appId: app.id, withPlan: true });
  await notifySetupPurchase(getApp(app.id) ?? app);
}

/** The only manual step in self-serve: OY Labs is told when someone buys the done-for-you setup. */
async function notifySetupPurchase(app: MobileApp): Promise<void> {
  const to = process.env.SETUP_ALERT_EMAIL || 'hi@oylabs.co';
  const owner = getDb()
    .prepare(`SELECT u.email, u.name, w.name AS company FROM workspace_members m JOIN client_users u ON u.id = m.user_id JOIN workspaces w ON w.id = m.workspace_id WHERE m.workspace_id = ? AND m.role = 'owner' ORDER BY m.created_at LIMIT 1`)
    .get(app.workspace_id) as { email: string; name: string; company: string } | undefined;
  try {
    await sendAccountEmail({
      to,
      subject: `New done-for-you setup: ${owner?.company ?? app.name}`,
      heading: 'Someone paid for done-for-you setup',
      intro: `${owner?.name ?? 'A client'} (${owner?.email ?? 'no email'}) from ${owner?.company ?? app.name} paid $${SETUP_ADDON_USD}. Plan: ${appPlanById(app.plan)?.name ?? 'none yet'}. Store: ${app.store_domain ?? 'not connected yet'}. Contact them to connect and publish their app.`,
      ctaLabel: 'Open the app in the console',
      ctaUrl: `${env.appBaseUrl()}/console/apps/${app.id}`,
      footnote: 'Sent automatically by oylabs.co when a setup payment succeeds.',
    });
    log.info('mobile_app.setup_alert_sent', { appId: app.id });
  } catch (err) {
    // The payment is recorded either way; the console still shows it.
    log.error('mobile_app.setup_alert_failed', { appId: app.id, error: errorSummary(err) });
  }
}

/** Stores the Stripe customer on the workspace (when it has none) so the billing portal can manage the care plan. */
function rememberCustomer(workspaceId: number, customer: string | { id: string } | null | undefined): void {
  const id = typeof customer === 'string' ? customer : customer?.id;
  if (!id) return;
  getDb().prepare('UPDATE workspaces SET stripe_customer_id = COALESCE(stripe_customer_id, ?) WHERE id = ?').run(id, workspaceId);
}

export async function createCareCheckout(app: MobileApp, email: string, customerId: string | null): Promise<string> {
  const base = env.appBaseUrl();
  const metadata = { kind: CARE_KIND, app_id: String(app.id), workspace_id: String(app.workspace_id) };
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    ...(customerId ? { customer: customerId } : { customer_email: email }),
    client_reference_id: String(app.workspace_id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: SETUP_FEE_CURRENCY,
          unit_amount: CARE_CENTS,
          recurring: { interval: 'month' },
          product_data: { name: `Shopify mobile app — care plan (${app.name})` },
        },
      },
    ],
    metadata,
    subscription_data: { metadata },
    billing_address_collection: 'auto',
    success_url: `${base}/app/mobile/${app.id}?care=1`,
    cancel_url: `${base}/app/mobile/${app.id}`,
  });
  if (!session.url) throw new Error('Stripe did not return a Checkout URL');
  log.info('mobile_app.care_checkout.created', { appId: app.id });
  return session.url;
}

type CareSubscription = {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata?: Record<string, string> | null;
};

/** From any subscription event: true when it's an app plan or care plan (and the app now reflects it). */
export function handleCareSubscription(sub: CareSubscription): boolean {
  const kind = sub.metadata?.kind;
  if (kind !== CARE_KIND && kind !== PLAN_KIND) return false;
  const app = getApp(Number(sub.metadata!.app_id));
  if (app) {
    const plan = kind === PLAN_KIND && isAppPlanId(sub.metadata!.plan) ? sub.metadata!.plan : undefined;
    setCareSubscription(app.id, sub.id, sub.status, plan);
    rememberCustomer(app.workspace_id, sub.customer);
    log.info('mobile_app.care_synced', { appId: app.id, status: sub.status });
  }
  return true;
}
