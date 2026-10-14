import 'server-only';
import { stripe } from '@/lib/billing/stripe';
import { env } from '@/lib/messaging/env';
import { log } from '@/lib/log';
import { getApp, markSetupPaid, type MobileApp } from './apps';

/**
 * Mobile app billing: a one-time setup fee paid through Stripe Checkout. It's a
 * separate one-off payment, so it never touches the messaging subscription. The
 * optional monthly care plan is added once its price is set.
 */

export const SETUP_FEE_CENTS = 140_000;
export const SETUP_FEE_CURRENCY = 'usd';
const KIND = 'mobile_app_setup';

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
export function handleSetupPayment(session: { mode?: string | null; payment_status?: string | null; id: string; metadata?: Record<string, string> | null }): boolean {
  if (session.mode !== 'payment' || session.metadata?.kind !== KIND) return false;
  const app = getApp(Number(session.metadata.app_id));
  if (app && session.payment_status === 'paid') {
    markSetupPaid(app.id, session.id);
    log.info('mobile_app.setup_paid', { appId: app.id });
  }
  return true;
}
