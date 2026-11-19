import { createHmac } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb } from './helpers';
import {
  authorizeUrl,
  claimedShop,
  completeInstall,
  forgetShop,
  getInstall,
  normalizeShop,
  readState,
  signValue,
  verifyAppWebhook,
  verifyShopifyQuery,
} from '@/lib/apps/shopify-oauth';

const SECRET = 'test-shopify-secret';
beforeEach(() => {
  freshDb();
  process.env.SHOPIFY_API_KEY = 'key123';
  process.env.SHOPIFY_API_SECRET = SECRET;
});

const signedQuery = (params: Record<string, string>) => {
  const message = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return new URLSearchParams({ ...params, hmac: createHmac('sha256', SECRET).update(message).digest('hex') });
};

describe('Shopify OAuth', () => {
  it('accepts only shop domains', () => {
    expect(normalizeShop('https://My-Store.myshopify.com/admin')).toBe('my-store.myshopify.com');
    expect(normalizeShop('evil.com')).toBeNull();
    expect(normalizeShop('x.myshopify.com.evil.com')).toBeNull();
  });

  it('verifies the query signature Shopify sends', () => {
    const q = signedQuery({ shop: 'a.myshopify.com', timestamp: '1700000000', code: 'abc' });
    expect(verifyShopifyQuery(q)).toBe(true);
    q.set('shop', 'b.myshopify.com');
    expect(verifyShopifyQuery(q)).toBe(false);
  });

  it('ties the state to the browser nonce and the target app', () => {
    const { url, nonce, state } = authorizeUrl('a.myshopify.com', 7);
    expect(url).toContain('https://a.myshopify.com/admin/oauth/authorize?');
    expect(readState(state, nonce)).toEqual({ target: 7 });
    expect(readState(state, 'other-nonce')).toBeNull();
    expect(readState(state.replace(/^7/, '8'), nonce)).toBeNull();
  });

  it('claims only stores that are installed and signed for this browser', async () => {
    expect(claimedShop(signValue(['a.myshopify.com', Date.now() + 60_000]))).toBeNull();
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const u = String(input);
      if (u.endsWith('/admin/oauth/access_token')) return new Response(JSON.stringify({ access_token: 'shpat_x', scope: 'read_products' }));
      return new Response(JSON.stringify({ data: { shop: { storefrontAccessTokens: { nodes: [{ title: 'OY Labs mobile app', accessToken: 'f'.repeat(32) }] } } } }));
    }) as typeof fetch;
    const install = await completeInstall('a.myshopify.com', 'code');
    expect(install.storefront_token).toBe('f'.repeat(32));
    expect(claimedShop(signValue(['a.myshopify.com', Date.now() + 60_000]))).toBe('a.myshopify.com');
    expect(claimedShop(signValue(['a.myshopify.com', Date.now() - 1]))).toBeNull();
    forgetShop('a.myshopify.com');
    expect(getInstall('a.myshopify.com')).toBeNull();
  });

  it('verifies app webhooks with the API secret', () => {
    const body = '{"shop_domain":"a.myshopify.com"}';
    expect(verifyAppWebhook(body, createHmac('sha256', SECRET).update(body).digest('base64'))).toBe(true);
    expect(verifyAppWebhook(body, 'nope')).toBe(false);
  });
});

describe('Shopify managed pricing', () => {
  it('maps Shopify plan names and statuses', async () => {
    const { planFromName, statusFromShopify, shopifyPricingUrl } = await import('@/lib/apps/shopify-billing');
    expect(planFromName('Growth')).toBe('app-growth');
    expect(planFromName('OY Labs Pro')).toBe('app-pro');
    expect(planFromName('Unknown')).toBeNull();
    expect(statusFromShopify('ACTIVE')).toBe('active');
    expect(statusFromShopify('FROZEN')).toBe('past_due');
    expect(statusFromShopify('CANCELLED')).toBe('canceled');
    expect(statusFromShopify('PENDING')).toBeNull();
    expect(shopifyPricingUrl('my-shop.myshopify.com')).toBe('https://admin.shopify.com/store/my-shop/charges/oy-labs-mobile-app-builder/pricing_plans');
  });

  it('only changes apps billed by Shopify', async () => {
    const { applyShopifySubscription } = await import('@/lib/apps/shopify-billing');
    const { createApp, getApp } = await import('@/lib/apps/apps');
    const { getDb } = await import('@/lib/messaging/db');
    const { seedWorkspace } = await import('./helpers');
    const ws = seedWorkspace(getDb(), { name: 'Shop' });
    const stripeApp = createApp({ workspaceId: ws, name: 'A', slug: 'app-a' });
    const shopifyApp = createApp({ workspaceId: ws, name: 'B', slug: 'app-b' });
    getDb().prepare("UPDATE mobile_apps SET store_domain = 's.myshopify.com'").run();
    getDb().prepare("UPDATE mobile_apps SET billing_source = 'shopify' WHERE id = ?").run(shopifyApp.id);
    expect(applyShopifySubscription('s.myshopify.com', { id: 'gid://shopify/AppSubscription/1', name: 'Pro', status: 'ACTIVE' })).toBe(1);
    expect(getApp(shopifyApp.id)).toMatchObject({ plan: 'app-pro', care_status: 'active' });
    expect(getApp(stripeApp.id)).toMatchObject({ plan: null, care_status: null });
  });

  it('never moves an app that is on another store', async () => {
    const { appForShop } = await import('@/lib/apps/shopify-oauth');
    const { createApp } = await import('@/lib/apps/apps');
    const { getDb } = await import('@/lib/messaging/db');
    const { seedWorkspace } = await import('./helpers');
    const ws = seedWorkspace(getDb(), { name: 'Shop' });
    const live = createApp({ workspaceId: ws, name: 'Live', slug: 'live-app' });
    getDb().prepare("UPDATE mobile_apps SET store_domain = 'live.myshopify.com' WHERE id = ?").run(live.id);
    const fresh = appForShop(ws, 'Shop', 'new.myshopify.com');
    expect(fresh.id).not.toBe(live.id);
    expect(appForShop(ws, 'Shop', 'live.myshopify.com').id).toBe(live.id);
    // An app with no store yet is reused rather than duplicated.
    expect(appForShop(ws, 'Shop', 'new.myshopify.com').id).toBe(fresh.id);
  });
});
