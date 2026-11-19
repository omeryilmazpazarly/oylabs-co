import { createHmac } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb } from './helpers';
import { verifyIdToken } from '@/lib/apps/shopify-channel';
import { needsScopes, SHOPIFY_SCOPES, type Install } from '@/lib/apps/shopify-oauth';
import { privacyPageHtml } from '@/lib/apps/privacy-page';
import { homeHtml } from '@/lib/apps/shopify-home';

const SECRET = 'test-shopify-secret';
const KEY = 'key123';
beforeEach(() => {
  freshDb();
  process.env.SHOPIFY_API_KEY = KEY;
  process.env.SHOPIFY_API_SECRET = SECRET;
});

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function idToken(claims: Record<string, unknown>, secret = SECRET, alg = 'HS256') {
  const head = b64({ alg, typ: 'JWT' });
  const body = b64(claims);
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
const NOW = 1_800_000_000;
const good = { iss: 'https://a.myshopify.com/admin', dest: 'https://a.myshopify.com', aud: KEY, exp: NOW + 60, nbf: NOW - 5 };

describe('App Bridge ID tokens', () => {
  it('accepts a valid token and returns its shop', () => {
    expect(verifyIdToken(idToken(good), NOW)).toBe('a.myshopify.com');
  });
  it('rejects tampering, other apps, expiry and mismatched hosts', () => {
    expect(verifyIdToken(idToken(good, 'other-secret'), NOW)).toBeNull();
    expect(verifyIdToken(idToken({ ...good, aud: 'someone-else' }), NOW)).toBeNull();
    expect(verifyIdToken(idToken({ ...good, exp: NOW - 60 }), NOW)).toBeNull();
    expect(verifyIdToken(idToken({ ...good, nbf: NOW + 60 }), NOW)).toBeNull();
    expect(verifyIdToken(idToken({ ...good, dest: 'https://b.myshopify.com' }), NOW)).toBeNull();
    expect(verifyIdToken(idToken(good, SECRET, 'none'), NOW)).toBeNull();
    expect(verifyIdToken('not.a.jwt', NOW)).toBeNull();
    expect(verifyIdToken(null, NOW)).toBeNull();
  });
});

describe('scope upgrades', () => {
  const install = (scopes: string): Install => ({
    shop: 'a.myshopify.com', token_enc: '', storefront_token: null, scopes, installed_at: 0, uninstalled_at: null,
    privacy_url: null, channel_id: null, products_published_at: null,
  });
  it('asks again only when a scope is missing', () => {
    expect(needsScopes(install(SHOPIFY_SCOPES))).toBe(false);
    expect(needsScopes(install('read_products,read_orders'))).toBe(true);
    // Shopify reports write_x without read_x.
    const reported = SHOPIFY_SCOPES.split(',').filter((s) => s !== 'read_publications').join(',');
    expect(needsScopes(install(reported))).toBe(false);
  });
});

describe('privacy page', () => {
  it('names the store, escapes input and links the contact', () => {
    const html = privacyPageHtml({ storeName: 'Leyla <b>', contactEmail: 'help@leyla.com', storeUrl: 'https://leyla.com', updated: '19 November 2026' });
    expect(html).toContain('Leyla &lt;b&gt; mobile app');
    expect(html).toContain('mailto:help@leyla.com');
    expect(html).toContain('19 November 2026');
    expect(html).not.toContain('<b>');
  });
  it('falls back to the store link without an email', () => {
    expect(privacyPageHtml({ storeName: 'X', contactEmail: null, storeUrl: 'https://x.com', updated: 'today' })).toContain('href="https://x.com"');
  });
});

describe('admin home', () => {
  it('shows the counts and escapes the builder link', () => {
    const html = homeHtml({ apiKey: KEY, shop: 'a.myshopify.com', builderUrl: 'https://oylabs.co/c?t=a"b', connected: true, products: 1, privacyUrl: null });
    expect(html).toContain('<meta name="shopify-api-key" content="key123">');
    expect(html).toContain('1 product is available');
    expect(html).toContain('t=a&quot;b');
    expect(html).toContain('Your store is connected');
  });
});
