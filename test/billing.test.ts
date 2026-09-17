import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { freshDb, mockFetch, seedConnection, seedWorkspace } from './helpers';
import { GRACE_MS, pageLimit, SERVICE_ACTIVE_SQL, serviceState, type BillingFields } from '@/lib/billing/entitlements';
import { constructStripeEvent, handleStripeEvent, syncSubscription } from '@/lib/billing/subscriptions';
import { stripe } from '@/lib/billing/stripe';
import { deliverDue, enqueueDelivery, type ForwardEvent } from '@/lib/messaging/deliveries';
import { sendMessage, SendError } from '@/lib/messaging/send';
import { assertCanConnect, ConnectError } from '@/lib/messaging/connections';
import type { Db } from '@/lib/messaging/db';

const NOW = 1_800_000_000_000;
let db: Db;
beforeEach(() => { db = freshDb(); });
afterEach(() => { vi.unstubAllGlobals(); });

const base: BillingFields = { plan: null, subscription_status: null, past_due_since: null, complimentary: 0, page_limit_override: null, trial_ends_at: null, current_period_end: null, cancel_at_period_end: 0 };

describe('serviceState and its SQL twin', () => {
  const cases: [string, Partial<BillingFields>, boolean][] = [
    ['complimentary', { complimentary: 1 }, true],
    ['trialing', { subscription_status: 'trialing' }, true],
    ['active', { subscription_status: 'active' }, true],
    ['past due within grace', { subscription_status: 'past_due', past_due_since: NOW - GRACE_MS + 1000 }, true],
    ['past due beyond grace', { subscription_status: 'past_due', past_due_since: NOW - GRACE_MS - 1000 }, false],
    ['unpaid', { subscription_status: 'unpaid' }, false],
    ['canceled', { subscription_status: 'canceled' }, false],
    ['incomplete', { subscription_status: 'incomplete' }, false],
    ['never subscribed', {}, false],
  ];

  it.each(cases)('%s', (_label, fields, expected) => {
    const w = { ...base, ...fields };
    expect(serviceState(w, NOW).active).toBe(expected);
    const row = db.prepare(`
      SELECT ${SERVICE_ACTIVE_SQL('w')} AS active FROM (SELECT @complimentary AS complimentary, @status AS subscription_status, @since AS past_due_since) w
    `).get({ complimentary: w.complimentary, status: w.subscription_status, since: w.past_due_since, graceCutoff: NOW - GRACE_MS }) as { active: number };
    expect(Boolean(row.active)).toBe(expected);
  });

  it('reports when a grace period will pause the service', () => {
    const state = serviceState({ ...base, subscription_status: 'past_due', past_due_since: NOW - 1000 }, NOW);
    expect(state).toEqual({ active: true, kind: 'grace', pausesAt: NOW - 1000 + GRACE_MS });
  });

  it('derives page limits from the plan, with staff overrides winning', () => {
    expect(pageLimit({ ...base, plan: 'starter' })).toBe(1);
    expect(pageLimit({ ...base, plan: 'growth' })).toBe(3);
    expect(pageLimit({ ...base, plan: 'scale' })).toBe(10);
    expect(pageLimit({ ...base })).toBe(0);
    expect(pageLimit({ ...base, complimentary: 1, page_limit_override: 25 })).toBe(25);
  });
});

function subscription(overrides: Partial<Stripe.Subscription> & { lookup?: string; periodEnd?: number } = {}): Stripe.Subscription {
  const { lookup = 'oylabs_messaging_growth_month', periodEnd = 1_900_000_000, ...rest } = overrides;
  return {
    id: 'sub_1',
    object: 'subscription',
    customer: 'cus_1',
    status: 'trialing',
    metadata: { workspace_id: '1' },
    trial_end: 1_801_000_000,
    cancel_at_period_end: false,
    cancel_at: null,
    items: { object: 'list', data: [{ current_period_end: periodEnd, price: { lookup_key: lookup, recurring: { interval: 'month' } } }] },
    ...rest,
  } as unknown as Stripe.Subscription;
}

function row(id: number) {
  return db.prepare('SELECT plan, billing_interval, subscription_status, trial_ends_at, current_period_end, past_due_since, trial_used, stripe_subscription_id, cancel_at_period_end FROM workspaces WHERE id = ?').get(id);
}

describe('syncSubscription', () => {
  it('mirrors a trialing subscription with plan, interval, trial end and renewal date', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) } }));
    expect(row(ws)).toMatchObject({ plan: 'growth', billing_interval: 'month', subscription_status: 'trialing', trial_ends_at: 1_801_000_000_000, current_period_end: 1_900_000_000_000, trial_used: 1, stripe_subscription_id: 'sub_1' });
  });

  it('records when payment first failed and keeps that date across repeated failures', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'past_due' }), 1_800_000_000);
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'past_due' }), 1_800_100_000);
    expect(row(ws)).toMatchObject({ subscription_status: 'past_due', past_due_since: 1_800_000_000_000 });
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'active' }), 1_800_200_000);
    expect(row(ws)).toMatchObject({ subscription_status: 'active', past_due_since: null });
  });

  it('ignores events older than the state already applied', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'active' }), 1_800_000_100);
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'trialing' }), 1_800_000_000);
    expect(row(ws)).toMatchObject({ subscription_status: 'active' });
  });

  it('does not let an old subscription ending overwrite the current one', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    syncSubscription(subscription({ id: 'sub_new', metadata: { workspace_id: String(ws) }, status: 'active' }), 1_800_000_000);
    syncSubscription(subscription({ id: 'sub_old', metadata: { workspace_id: String(ws) }, status: 'canceled' }), 1_800_000_500);
    expect(row(ws)).toMatchObject({ stripe_subscription_id: 'sub_new', subscription_status: 'active' });
  });

  it('flags scheduled cancellations and picks up plan changes', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    syncSubscription(subscription({ metadata: { workspace_id: String(ws) }, status: 'active', cancel_at_period_end: true, lookup: 'oylabs_messaging_scale_year' }));
    expect(row(ws)).toMatchObject({ plan: 'scale', billing_interval: 'year', cancel_at_period_end: 1 });
  });
});

describe('handleStripeEvent', () => {
  function event(type: string, object: object, id = 'evt_1'): Stripe.Event {
    return { id, type, created: 1_800_000_000, data: { object } } as unknown as Stripe.Event;
  }

  it('applies each event once', async () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    const sub = subscription({ metadata: { workspace_id: String(ws) }, status: 'active' });
    expect(await handleStripeEvent(event('customer.subscription.updated', sub))).toBe('processed');
    expect(await handleStripeEvent(event('customer.subscription.updated', sub))).toBe('duplicate');
  });

  it('refreshes the subscription from Stripe when an invoice fails', async () => {
    const ws = seedWorkspace(db, { complimentary: false, status: null });
    const retrieveSubscription = vi.fn(async () => subscription({ metadata: { workspace_id: String(ws) }, status: 'past_due' }));
    const invoice = { parent: { subscription_details: { subscription: 'sub_1' } } };
    await handleStripeEvent(event('invoice.payment_failed', invoice), { retrieveSubscription });
    expect(retrieveSubscription).toHaveBeenCalledWith('sub_1');
    expect(row(ws)).toMatchObject({ subscription_status: 'past_due' });
  });

  it('leaves the event retryable when processing fails', async () => {
    const retrieveSubscription = vi.fn(async () => { throw new Error('Stripe down'); });
    const invoice = { parent: { subscription_details: { subscription: 'sub_1' } } };
    await expect(handleStripeEvent(event('invoice.paid', invoice, 'evt_retry'), { retrieveSubscription })).rejects.toThrow('Stripe down');
    expect(db.prepare('SELECT processed_at, error FROM stripe_events WHERE id = ?').get('evt_retry')).toEqual({ processed_at: null, error: 'Stripe down' });
  });

  it('verifies Stripe webhook signatures', () => {
    const payload = JSON.stringify({ id: 'evt_sig', object: 'event', type: 'invoice.paid', created: 1, data: { object: {} } });
    const header = stripe().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    expect(constructStripeEvent(payload, header).id).toBe('evt_sig');
    expect(() => constructStripeEvent(payload.replace('evt_sig', 'evt_forged'), header)).toThrow();
    expect(() => constructStripeEvent(payload, null)).toThrow();
  });
});

describe('billing enforcement', () => {
  it('holds forwarding while unpaid and delivers once the subscription is active again', async () => {
    const ws = seedWorkspace(db, { complimentary: false, status: 'unpaid' });
    enqueueDelivery(db, ws, null as unknown as number, { id: 'evt_hold' } as ForwardEvent);
    const calls = mockFetch({ 'POST client.example': () => ({ body: {} }) });

    expect(await deliverDue()).toBe(0);
    expect(db.prepare('SELECT status, attempts FROM deliveries').get()).toEqual({ status: 'pending', attempts: 0 });

    db.prepare(`UPDATE workspaces SET subscription_status = 'active' WHERE id = ?`).run(ws);
    await deliverDue();
    expect(calls).toHaveLength(1);
    expect(db.prepare('SELECT status FROM deliveries').get()).toEqual({ status: 'delivered' });
  });

  it('refuses to send for a workspace whose grace period has ended', async () => {
    const ws = seedWorkspace(db, { complimentary: false, status: 'past_due', pastDueSince: Date.now() - GRACE_MS - 60_000 });
    await expect(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'P', text: 'hi', source: 'api' }))
      .rejects.toSatisfy((e: unknown) => e instanceof SendError && e.code === 'subscription_inactive' && e.status === 402);
  });

  it('enforces the plan Page limit but always allows reconnecting an existing Page', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: 'active', plan: 'starter' });
    seedConnection(db, ws, { pageId: 'PAGE1', igId: 'IG1' });
    expect(() => assertCanConnect(ws, 'PAGE2')).toThrow(ConnectError);
    try { assertCanConnect(ws, 'PAGE2'); } catch (e) { expect((e as ConnectError).reason).toBe('limit'); }
    expect(() => assertCanConnect(ws, 'PAGE1')).not.toThrow();
  });

  it('refuses new connections without an active subscription', () => {
    const ws = seedWorkspace(db, { complimentary: false, status: 'canceled', plan: 'scale' });
    try { assertCanConnect(ws, 'PAGE9'); expect.unreachable(); } catch (e) { expect((e as ConnectError).reason).toBe('billing'); }
  });
});
