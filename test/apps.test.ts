import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, mockFetch, seedWorkspace } from './helpers';
import type { Db } from '@/lib/messaging/db';
import {
  AppError,
  buildPublicConfig,
  createApp,
  createBanner,
  getApp,
  listBanners,
  moveBanner,
  updateSettings,
  updateStoreConnection,
} from '@/lib/apps/apps';
import { DEFAULT_SETTINGS, sanitizeSettings } from '@/lib/apps/settings';
import { claimStockAlerts, registerDevice, sendCampaign, subscribeStockAlert } from '@/lib/apps/push';
import { verifyWebhook } from '@/lib/apps/shopify';

let db: Db;
let ws: number;

beforeEach(() => {
  db = freshDb();
  ws = seedWorkspace(db, { name: 'Leyla' });
});
afterEach(() => vi.unstubAllGlobals());

const TOKEN = 'ExponentPushToken[abcdefghijklmnop]';

describe('settings', () => {
  it('drops invalid colours, URLs and contacts but keeps valid ones', () => {
    const s = sanitizeSettings({
      branding: { colors: { primary: '#123abc', sale: 'red' }, radius: 99, logoUrl: 'javascript:alert(1)' },
      contact: { whatsapp: '+20 101 234 5678', email: 'not-an-email' },
      content: { announcement: { en: '  Free returns  ', ar: '' }, trust: [{ title: { en: 'A' } }, {}, {}, { title: { en: 'D' } }] },
    });
    expect(s.branding.colors.primary).toBe('#123ABC');
    expect(s.branding.colors.sale).toBe(DEFAULT_SETTINGS.branding.colors.sale);
    expect(s.branding.radius).toBe(20);
    expect(s.branding.logoUrl).toBeNull();
    expect(s.contact.whatsapp).toBe('+201012345678');
    expect(s.contact.email).toBeNull();
    expect(s.content.announcement).toEqual({ en: 'Free returns' });
    // Max three items, empty ones dropped.
    expect(s.content.trust.map((t) => t.title.en)).toEqual(['A']);
  });

  it('a partial update keeps everything it does not mention', () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    updateSettings(app.id, { contact: { whatsapp: '+201012345678' } });
    const next = updateSettings(app.id, { branding: { colors: { primary: '#000000' } } });
    expect(next.contact.whatsapp).toBe('+201012345678');
    expect(next.branding.wordmark).toBe('LEYLA');
    expect(getApp(app.id)!.config_version).toBe(3);
  });
});

describe('apps', () => {
  it('rejects bad slugs, duplicates and private tokens', () => {
    expect(() => createApp({ workspaceId: ws, name: 'X', slug: 'Bad Slug' })).toThrow(AppError);
    createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    expect(() => createApp({ workspaceId: ws, name: 'Leyla 2', slug: 'leyla' })).toThrow(/already used/);
    const app = createApp({ workspaceId: ws, name: 'Other', slug: 'other' });
    expect(() => updateStoreConnection(app.id, { storeDomain: 'leyla.com', storefrontToken: '5d55f3849a974f0861026e0979d51b6e' })).toThrow(/myshopify/);
    expect(() => updateStoreConnection(app.id, { storeDomain: 'x.myshopify.com', storefrontToken: 'shpat_abc' })).toThrow(AppError);
  });

  it('serves only active, in-window sections in order with absolute image URLs', () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    updateStoreConnection(app.id, { storeDomain: 'https://yptr3e-u2.myshopify.com/', storefrontToken: '5d55f3849a974f0861026e0979d51b6e' });
    const a = createBanner(app.id, { kind: 'hero', titleEn: 'Summer', imageUrl: '/uploads/hero.jpg' });
    const b = createBanner(app.id, { kind: 'collection_row', collectionHandle: 'sets' });
    createBanner(app.id, { kind: 'text', titleEn: 'Hidden', active: false });
    createBanner(app.id, { kind: 'text', titleEn: 'Ended', endsAt: 1000 });
    moveBanner(app.id, b, 'up');
    const config = buildPublicConfig(getApp(app.id)!, 'https://oylabs.test', 5000);
    expect(config.store.domain).toBe('yptr3e-u2.myshopify.com');
    expect(config.home.map((s) => s.id)).toEqual([String(b), String(a)]);
    expect(config.home[1].image).toBe('https://oylabs.test/uploads/hero.jpg');
    expect(listBanners(app.id)).toHaveLength(4);
  });

  it('requires a collection for product rows', () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    expect(() => createBanner(app.id, { kind: 'product_grid' })).toThrow(/collection/);
  });
});

describe('push', () => {
  it('registers devices once per token and sends campaigns to opted-in devices', async () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    registerDevice({ appId: app.id, pushToken: TOKEN, platform: 'android', topics: ['offers'] });
    registerDevice({ appId: app.id, pushToken: TOKEN, platform: 'android', topics: ['offers', 'orderUpdates'] });
    registerDevice({ appId: app.id, pushToken: 'ExponentPushToken[zzzzzzzzzzzzzzz]', platform: 'ios', topics: [] });
    expect(() => registerDevice({ appId: app.id, pushToken: 'nope', platform: 'android' })).toThrow(AppError);

    const calls = mockFetch({ 'POST exp.host/--/api/v2/push/send': () => ({ body: { data: [{ status: 'ok' }] } }) });
    const result = await sendCampaign({ appId: app.id, title: 'New in', body: 'Summer pieces', audience: 'topic:offers' });
    expect(result.sent).toBe(1);
    expect((calls[0].body as { to: string }[]).map((m) => m.to)).toEqual([TOKEN]);
  });

  it('drops devices Expo reports as unregistered', async () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    registerDevice({ appId: app.id, pushToken: TOKEN, platform: 'android' });
    mockFetch({ 'POST exp.host/--/api/v2/push/send': () => ({ body: { data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] } }) });
    await sendCampaign({ appId: app.id, title: 'Hi', body: 'There', audience: 'all' });
    expect(db.prepare('SELECT COUNT(*) AS n FROM mobile_app_devices').get()).toEqual({ n: 0 });
  });

  it('claims back-in-stock alerts only once', () => {
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    registerDevice({ appId: app.id, pushToken: TOKEN, platform: 'android' });
    subscribeStockAlert(app.id, TOKEN, 'gid://shopify/ProductVariant/42', 'pleated-skirt', 'Pleated Skirt');
    expect(claimStockAlerts(app.id, ['gid://shopify/ProductVariant/42'])).toHaveLength(1);
    expect(claimStockAlerts(app.id, ['gid://shopify/ProductVariant/42'])).toHaveLength(0);
  });
});

describe('webhooks', () => {
  it('verifies Shopify HMAC signatures', () => {
    const body = '{"id":1}';
    const sig = createHmac('sha256', 'shh').update(body).digest('base64');
    expect(verifyWebhook(body, sig, 'shh')).toBe(true);
    expect(verifyWebhook(body, sig, 'other')).toBe(false);
    expect(verifyWebhook(body, null, 'shh')).toBe(false);
  });
});

describe('setup fee', () => {
  it('marks the app paid from a completed setup checkout and leaves messaging billing alone', async () => {
    const { handleStripeEvent } = await import('@/lib/billing/subscriptions');
    const app = createApp({ workspaceId: ws, name: 'Leyla', slug: 'leyla' });
    const event = {
      id: 'evt_setup_1',
      type: 'checkout.session.completed',
      created: 1,
      data: { object: { id: 'cs_1', mode: 'payment', payment_status: 'paid', metadata: { kind: 'mobile_app_setup', app_id: String(app.id) } } },
    } as unknown as import('stripe').Stripe.Event;
    expect(await handleStripeEvent(event)).toBe('processed');
    expect(getApp(app.id)!.setup_paid_at).toBeTypeOf('number');
    expect(getApp(app.id)!.setup_checkout_id).toBe('cs_1');
    const w = db.prepare('SELECT subscription_status FROM workspaces WHERE id = ?').get(ws) as { subscription_status: string | null };
    expect(w.subscription_status).toBeNull();
    expect(await handleStripeEvent(event)).toBe('duplicate');
  });

  it('routes care-plan subscription events to the app, not the messaging plan', async () => {
    const { handleStripeEvent } = await import('@/lib/billing/subscriptions');
    const app = createApp({ workspaceId: ws, name: 'Care', slug: 'care-co' });
    const event = {
      id: 'evt_care_1',
      type: 'customer.subscription.updated',
      created: 2,
      data: { object: { id: 'sub_care', status: 'active', customer: 'cus_1', items: { data: [] }, metadata: { kind: 'mobile_app_care', app_id: String(app.id) } } },
    } as unknown as import('stripe').Stripe.Event;
    expect(await handleStripeEvent(event)).toBe('processed');
    expect(getApp(app.id)!.care_status).toBe('active');
    expect(getApp(app.id)!.care_subscription_id).toBe('sub_care');
    const w = db.prepare('SELECT subscription_status, stripe_customer_id FROM workspaces WHERE id = ?').get(ws) as { subscription_status: string | null; stripe_customer_id: string | null };
    expect(w.subscription_status).toBeNull();
    expect(w.stripe_customer_id).toBe('cus_1');
  });
});
