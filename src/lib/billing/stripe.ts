import 'server-only';
import Stripe from 'stripe';

let client: Stripe | null = null;

/** Lazily created: builds run without Stripe keys. */
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  client ??= new Stripe(key, { appInfo: { name: 'OY Labs Messaging', url: 'https://oylabs.co' } });
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export const PORTAL_CONFIG_METADATA = { oylabs: 'messaging' };
