import 'server-only';
import { stripe } from '@/lib/billing/stripe';
import { env } from '@/lib/messaging/env';
import { log } from '@/lib/log';
import { getDb } from '@/lib/messaging/db';
import { getApp, markSetupPaid, setCareSubscription, type MobileApp } from './apps';

/**
 * Mobile app billing, kept apart from the messaging plan:
 * - setup: a one-time $1,400 Stripe Checkout payment;
 * - care: an optional $200/month subscription (updates, store releases, support).
 * Both carry `metadata.kind`, which the shared Stripe webhook uses to route them here
 * instead of to the messaging subscription sync.
 */

export const SETUP_FEE_CENTS = 140_000;
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
          product_data: { name: `Shopify mobile app — setup (${app.name})`, description: 'Design, build and publication of your branded iPhone and Android app.' },
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
export function handleSetupPayment(session: {
  mode?: string | null;
  payment_status?: string | null;
  id: string;
  customer?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
}): boolean {
  if (session.mode !== 'payment' || session.metadata?.kind !== KIND) return false;
  const app = getApp(Number(session.metadata.app_id));
  if (app && session.payment_status === 'paid') {
    markSetupPaid(app.id, session.id);
    rememberCustomer(app.workspace_id, session.customer);
    log.info('mobile_app.setup_paid', { appId: app.id });
  }
  return true;
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

/** From any subscription event: true when it's a care plan (and the app now reflects it). */
export function handleCareSubscription(sub: CareSubscription): boolean {
  if (sub.metadata?.kind !== CARE_KIND) return false;
  const app = getApp(Number(sub.metadata.app_id));
  if (app) {
    setCareSubscription(app.id, sub.id, sub.status);
    rememberCustomer(app.workspace_id, sub.customer);
    log.info('mobile_app.care_synced', { appId: app.id, status: sub.status });
  }
  return true;
}
