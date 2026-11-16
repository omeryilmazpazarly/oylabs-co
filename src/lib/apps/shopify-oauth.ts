import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getDb, now } from '@/lib/messaging/db';
import { decryptSecret, encryptSecret } from '@/lib/messaging/crypto';
import { env } from '@/lib/messaging/env';
import { errorSummary, log } from '@/lib/log';
import { AppError, getApp, type MobileApp } from './apps';
import { registerWebhooks } from './shopify';

/**
 * One-click store connection through the public OY Labs App Builder Shopify app.
 *
 * The owner approves the app once in Shopify; we get an offline Admin API token, make
 * a Storefront token from it and subscribe the store's webhooks. The same callback
 * serves installs that start in Shopify (App Store / install link): those are kept in
 * shopify_installs and claimed by the signed-in owner afterwards.
 */

const API_VERSION = '2026-07';
const SHOP = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export const SHOPIFY_SCOPES = [
  'read_products',
  'read_inventory',
  'read_orders',
  'read_fulfillments',
  'unauthenticated_read_product_listings',
  'unauthenticated_read_product_inventory',
  'unauthenticated_read_product_tags',
  'unauthenticated_read_collection_listings',
  'unauthenticated_read_content',
  'unauthenticated_read_metaobjects',
  'unauthenticated_read_selling_plans',
  'unauthenticated_read_checkouts',
  'unauthenticated_write_checkouts',
].join(',');

export const CLAIM_COOKIE = 'oy_shopify_claim';
export const NONCE_COOKIE = 'oy_shopify_nonce';

export function shopifyAppConfigured(): boolean {
  return Boolean(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET);
}

function credentials() {
  const key = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!key || !secret) throw new AppError('One-click Shopify connection is not switched on yet.');
  return { key, secret };
}

export function normalizeShop(value: string | null | undefined): string | null {
  const shop = (value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '');
  return SHOP.test(shop) ? shop : null;
}

const sign = (data: string) => createHmac('sha256', credentials().secret).update(data).digest('base64url');

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** `payload~signature`, payload being fields joined by `~` (absent from shop domains and base64url). */
export function signValue(fields: (string | number)[]): string {
  const payload = fields.join('~');
  return `${payload}~${sign(payload)}`;
}

export function readSigned(value: string | undefined | null): string[] | null {
  if (!value) return null;
  const cut = value.lastIndexOf('~');
  if (cut < 0) return null;
  const payload = value.slice(0, cut);
  if (!safeEqual(value.slice(cut + 1), sign(payload))) return null;
  return payload.split('~');
}

/** Shopify signs the query string of every request it sends to the app (install, app home, callback). */
export function verifyShopifyQuery(params: URLSearchParams): boolean {
  const hmac = params.get('hmac');
  if (!hmac) return false;
  const message = [...params.entries()]
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const digest = createHmac('sha256', credentials().secret).update(message).digest('hex');
  return safeEqual(digest, hmac.toLowerCase());
}

/**
 * The Shopify approval page. `target` is the app id for a dashboard connection or 0 for an
 * install that started in Shopify; it rides in the signed state with the cookie nonce.
 */
export function authorizeUrl(shop: string, target: number): { url: string; nonce: string; state: string } {
  const { key } = credentials();
  const nonce = randomBytes(16).toString('base64url');
  const state = signValue([target, Date.now() + 15 * 60_000, nonce]);
  const q = new URLSearchParams({
    client_id: key,
    scope: SHOPIFY_SCOPES,
    redirect_uri: `${env.appBaseUrl()}/api/shopify/callback`,
    state,
  });
  return { url: `https://${shop}/admin/oauth/authorize?${q}`, nonce, state };
}

export function readState(state: string | null, nonce: string | undefined): { target: number } | null {
  const parts = readSigned(state);
  if (!parts || parts.length !== 3) return null;
  const [target, expires, stateNonce] = parts;
  if (Number(expires) < Date.now() || !nonce || !safeEqual(stateNonce, nonce)) return null;
  return { target: Number(target) };
}

async function exchangeCode(shop: string, code: string): Promise<{ token: string; scopes: string }> {
  const { key, secret } = credentials();
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ client_id: key, client_secret: secret, code }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string };
  if (!res.ok || !json.access_token) throw new AppError('Shopify did not confirm the connection. Please try again.');
  return { token: json.access_token, scopes: json.scope ?? '' };
}

async function adminGraphql<T>(shop: string, token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-shopify-access-token': token },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: unknown };
  if (!res.ok || !json.data) throw new AppError(`Shopify answered ${res.status}.`);
  return json.data;
}

/** A Storefront token for the app (live stock, metafields). Reuses ours if Shopify already has one. */
async function storefrontToken(shop: string, token: string): Promise<string | null> {
  const title = 'OY Labs mobile app';
  const existing = await adminGraphql<{ shop: { storefrontAccessTokens: { nodes: { title: string; accessToken: string }[] } } }>(
    shop,
    token,
    '{ shop { storefrontAccessTokens(first: 20) { nodes { title accessToken } } } }',
  );
  const found = existing.shop.storefrontAccessTokens.nodes.find((n) => n.title === title);
  if (found) return found.accessToken;
  const created = await adminGraphql<{ storefrontAccessTokenCreate: { storefrontAccessToken: { accessToken: string } | null; userErrors: { message: string }[] } }>(
    shop,
    token,
    'mutation ($input: StorefrontAccessTokenInput!) { storefrontAccessTokenCreate(input: $input) { storefrontAccessToken { accessToken } userErrors { message } } }',
    { input: { title } },
  );
  return created.storefrontAccessTokenCreate.storefrontAccessToken?.accessToken ?? null;
}

interface Install {
  shop: string;
  token_enc: string;
  storefront_token: string | null;
  scopes: string;
  installed_at: number;
  uninstalled_at: number | null;
}

export function getInstall(shop: string): Install | null {
  const row = getDb().prepare('SELECT * FROM shopify_installs WHERE shop = ?').get(shop) as Install | undefined;
  return row && !row.uninstalled_at ? row : null;
}

/** Callback: trade the code for a token and remember the install. */
export async function completeInstall(shop: string, code: string): Promise<Install> {
  const { token, scopes } = await exchangeCode(shop, code);
  const sf = await storefrontToken(shop, token).catch((err) => {
    log.error('shopify_oauth.storefront_token_failed', { shop, error: errorSummary(err) });
    return null;
  });
  getDb()
    .prepare(
      `INSERT INTO shopify_installs (shop, token_enc, storefront_token, scopes, installed_at, uninstalled_at)
       VALUES (@shop, @token, @sf, @scopes, @at, NULL)
       ON CONFLICT(shop) DO UPDATE SET token_enc = @token, storefront_token = @sf, scopes = @scopes, installed_at = @at, uninstalled_at = NULL`,
    )
    .run({ shop, token: encryptSecret(token), sf, scopes, at: now() });
  return getInstall(shop)!;
}

/**
 * Gives an app the store's tokens and subscribes its webhooks. Webhooks the app
 * subscribes are signed with the app's API secret, so that is the verification secret.
 */
export async function attachInstall(appId: number, shop: string): Promise<MobileApp> {
  const install = getInstall(shop);
  if (!install) throw new AppError('Approve the app in Shopify first.');
  getDb()
    .prepare(
      `UPDATE mobile_apps SET store_domain = @shop, storefront_token = COALESCE(@sf, storefront_token),
         admin_token_enc = @token, webhook_secret_enc = @secret WHERE id = @id`,
    )
    .run({ id: appId, shop, sf: install.storefront_token, token: install.token_enc, secret: encryptSecret(credentials().secret) });
  getDb().prepare('UPDATE mobile_apps SET config_version = config_version + 1, updated_at = ? WHERE id = ?').run(now(), appId);
  const app = getApp(appId)!;
  await registerWebhooks(app).catch((err) => log.error('shopify_oauth.webhooks_failed', { appId, error: errorSummary(err) }));
  return app;
}

/** App uninstalled or shop erased: forget the token everywhere it was copied. */
export function forgetShop(shop: string): void {
  const db = getDb();
  db.prepare('UPDATE shopify_installs SET uninstalled_at = ?, token_enc = \'\' WHERE shop = ?').run(now(), shop);
  db.prepare('UPDATE mobile_apps SET admin_token_enc = NULL, webhook_secret_enc = NULL WHERE store_domain = ? AND admin_token_enc IS NOT NULL').run(shop);
}

export function installToken(install: Install): string {
  return decryptSecret(install.token_enc);
}

/** The store this browser approved in Shopify (signed cookie, 24 hours), if still installed. */
export function claimedShop(value: string | undefined): string | null {
  const parts = readSigned(value);
  if (!parts || parts.length !== 2 || Number(parts[1]) < Date.now()) return null;
  return getInstall(parts[0]) ? parts[0] : null;
}

/** Webhooks Shopify sends to the app itself (compliance, uninstall) are signed with the API secret. */
export function verifyAppWebhook(raw: string, hmac: string | null): boolean {
  if (!hmac || !shopifyAppConfigured()) return false;
  const digest = createHmac('sha256', credentials().secret).update(raw, 'utf8').digest('base64');
  return safeEqual(digest, hmac);
}
