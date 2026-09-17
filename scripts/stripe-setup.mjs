#!/usr/bin/env node
/**
 * Creates (or updates) the OY Labs Messaging products, prices and Customer
 * Portal configuration in Stripe. Safe to run repeatedly.
 *
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 *   STRIPE_SECRET_KEY=sk_test_... APP_BASE_URL=https://oylabs.co node scripts/stripe-setup.mjs
 *
 * Prices are found by lookup key (oylabs_messaging_<plan>_<month|year>), so the
 * app needs no price IDs in its environment. Amounts must match src/lib/billing/plans.ts.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY (use a test key first).');
  process.exit(1);
}
const base = (process.env.APP_BASE_URL || 'https://oylabs.co').replace(/\/+$/, '');
const stripe = new Stripe(key);
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'test';

const PLANS = [
  { id: 'starter', name: 'Starter', pages: 1, month: 2900, year: 29000 },
  { id: 'growth', name: 'Growth', pages: 3, month: 7900, year: 79000 },
  { id: 'scale', name: 'Scale', pages: 10, month: 19900, year: 199000 },
];

async function findProduct(planId) {
  const { data } = await stripe.products.search({ query: `metadata['oylabs_plan']:'${planId}'` }).catch(() => ({ data: [] }));
  if (data[0]) return data[0];
  // Search can lag right after creation; fall back to listing.
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.metadata?.oylabs_plan === planId) return product;
  }
  return null;
}

async function ensurePrice(product, plan, interval, amount) {
  const lookup_key = `oylabs_messaging_${plan.id}_${interval}`;
  const { data } = await stripe.prices.list({ lookup_keys: [lookup_key], limit: 1 });
  const existing = data[0];
  if (existing && existing.active && existing.unit_amount === amount && existing.currency === 'usd' && existing.product === product.id) return existing;
  // Prices are immutable: create a new one and move the lookup key to it.
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: amount,
    recurring: { interval },
    lookup_key,
    transfer_lookup_key: true,
    nickname: `${plan.name} ${interval === 'month' ? 'monthly' : 'yearly'}`,
    tax_behavior: 'exclusive',
  });
  if (existing) await stripe.prices.update(existing.id, { active: false });
  return price;
}

console.log(`Stripe ${mode} mode — setting up OY Labs Messaging plans\n`);
const portalProducts = [];
for (const plan of PLANS) {
  let product = await findProduct(plan.id);
  const fields = {
    name: `OY Labs Messaging — ${plan.name}`,
    description: `Messenger & Instagram integration for up to ${plan.pages} Facebook Page${plan.pages === 1 ? '' : 's'}.`,
    metadata: { oylabs_plan: plan.id, pages: String(plan.pages) },
  };
  product = product ? await stripe.products.update(product.id, fields) : await stripe.products.create(fields);
  const monthly = await ensurePrice(product, plan, 'month', plan.month);
  const yearly = await ensurePrice(product, plan, 'year', plan.year);
  portalProducts.push({ product: product.id, prices: [monthly.id, yearly.id] });
  console.log(`  ${plan.name.padEnd(8)} ${product.id}  month ${monthly.id}  year ${yearly.id}`);
}

const portalFields = {
  business_profile: {
    headline: 'OY Labs — manage your Messaging subscription',
    privacy_policy_url: `${base}/privacy`,
    terms_of_service_url: `${base}/terms`,
  },
  default_return_url: `${base}/app/billing`,
  features: {
    customer_update: { enabled: true, allowed_updates: ['email', 'address', 'name', 'tax_id'] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: 'at_period_end', cancellation_reason: { enabled: true, options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other'] } },
    subscription_update: { enabled: true, default_allowed_updates: ['price'], products: portalProducts, proration_behavior: 'create_prorations' },
  },
  metadata: { oylabs: 'messaging' },
};

let portal = null;
for await (const config of stripe.billingPortal.configurations.list({ limit: 100 })) {
  if (config.metadata?.oylabs === 'messaging') { portal = config; break; }
}
portal = portal ? await stripe.billingPortal.configurations.update(portal.id, portalFields) : await stripe.billingPortal.configurations.create(portalFields);
console.log(`\n  Customer Portal configuration ${portal.id}`);

console.log(`
Done. Next:
  1. Stripe Dashboard → Developers → Webhooks → Add endpoint: ${base}/api/stripe/webhook
     Events: checkout.session.completed, customer.subscription.created, customer.subscription.updated,
             customer.subscription.deleted, customer.subscription.paused, customer.subscription.resumed,
             customer.subscription.trial_will_end, invoice.paid, invoice.payment_failed
     Copy the signing secret into STRIPE_WEBHOOK_SECRET.
  2. Settings → Billing → Subscriptions and emails: turn on emails for trial ending, failed payments and receipts,
     and Smart Retries for failed payments.
  3. Settings → Public details: business name "OY Labs Ltd", support email hi@oylabs.co, statement descriptor "OYLABS".`);
