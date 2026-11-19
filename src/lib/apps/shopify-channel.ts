import 'server-only';
import { createHmac } from 'crypto';
import { getDb, now } from '@/lib/messaging/db';
import { errorSummary, log } from '@/lib/log';
import { AppError } from './apps';
import { PRIVACY_PAGE_HANDLE, PRIVACY_PAGE_TITLE, privacyPageHtml } from './privacy-page';
import { adminGraphql, getInstall, installToken, normalizeShop, saveInstall, type Install } from './shopify-oauth';

/**
 * OY Labs as a Shopify sales channel (App Store requirement 5.9.1): the app opens inside
 * the Shopify admin, gets its token by token exchange, keeps one channel connection per
 * store, publishes the store's products to the app and keeps the app's privacy policy
 * as a page in the merchant's store.
 */

/** Handle of the channel specification in extensions/channel-config/specifications. */
export const CHANNEL_SPEC = 'oylabs-mobile-app';

function secrets() {
  const key = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!key || !secret) throw new AppError('One-click Shopify connection is not switched on yet.');
  return { key, secret };
}

const b64url = (s: string) => Buffer.from(s, 'base64url');

/**
 * Verifies an App Bridge ID token (HS256 JWT signed with the app secret) and returns the
 * shop it was issued for. `nowSec` is injectable for tests.
 */
export function verifyIdToken(token: string | null | undefined, nowSec = Math.floor(Date.now() / 1000)): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const { key, secret } = secrets();
  const expected = createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest();
  const given = b64url(parts[2]);
  if (given.length !== expected.length || !given.equals(expected)) return null;
  let header: { alg?: string };
  let claims: { aud?: string; exp?: number; nbf?: number; iss?: string; dest?: string };
  try {
    header = JSON.parse(b64url(parts[0]).toString('utf8'));
    claims = JSON.parse(b64url(parts[1]).toString('utf8'));
  } catch {
    return null;
  }
  if (header.alg !== 'HS256' || claims.aud !== key) return null;
  // Shopify allows a few seconds of clock skew.
  if (typeof claims.exp !== 'number' || claims.exp < nowSec - 5) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > nowSec + 5) return null;
  try {
    const iss = new URL(claims.iss ?? '').hostname;
    const dest = new URL(claims.dest ?? '').hostname;
    if (iss !== dest) return null;
    return normalizeShop(dest);
  } catch {
    return null;
  }
}

/** Token exchange: an ID token from the admin becomes the store's offline access token. */
export async function exchangeIdToken(shop: string, idToken: string): Promise<Install> {
  const { key, secret } = secrets();
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: key,
      client_secret: secret,
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: idToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
      requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string };
  if (!res.ok || !json.access_token) throw new AppError(`Shopify token exchange answered ${res.status}.`);
  return saveInstall(shop, json.access_token, json.scope ?? '');
}

/** The store's one connection to the OY Labs channel, made or adopted on first open. */
export async function ensureChannel(shop: string, token: string, account: { id: string; name: string }): Promise<string> {
  const data = await adminGraphql<{ channels: { nodes: { id: string; specificationHandle: string | null }[] } }>(
    shop,
    token,
    '{ channels(first: 10) { nodes { id specificationHandle } } }',
  );
  const ours = data.channels.nodes.find((c) => c.specificationHandle === CHANNEL_SPEC);
  if (ours) return ours.id;
  // An automatic (legacy) record has no specification yet: bind ours to it.
  const legacy = data.channels.nodes.find((c) => !c.specificationHandle);
  if (legacy) {
    await adminGraphql(shop, token, 'mutation ($id: ID!, $input: ChannelUpdateInput!) { channelUpdate(id: $id, input: $input) { channel { id } userErrors { message } } }', {
      id: legacy.id,
      input: { specificationHandle: CHANNEL_SPEC, accountId: account.id, accountName: account.name },
    });
    return legacy.id;
  }
  const created = await adminGraphql<{ channelCreate: { channel: { id: string } | null; userErrors: { message: string }[] } }>(
    shop,
    token,
    'mutation ($input: ChannelCreateInput!) { channelCreate(input: $input) { channel { id handle } userErrors { field message } } }',
    { input: { specificationHandle: CHANNEL_SPEC, accountId: account.id, accountName: account.name } },
  );
  const id = created.channelCreate.channel?.id;
  if (!id) throw new AppError(created.channelCreate.userErrors.map((e) => e.message).join('; ') || 'Shopify did not create the channel.');
  return id;
}

/** The publication of this app's channel (products published to it are sold in the app). */
export async function ourPublication(shop: string, token: string): Promise<string | null> {
  const data = await adminGraphql<{
    currentAppInstallation: { app: { id: string } };
    publications: { nodes: { id: string; catalog: { apps?: { nodes: { id: string }[] } } | null }[] };
  }>(
    shop,
    token,
    '{ currentAppInstallation { app { id } } publications(first: 30, catalogType: APP) { nodes { id catalog { ... on AppCatalog { apps(first: 1) { nodes { id } } } } } } }',
  );
  const appId = data.currentAppInstallation.app.id;
  return data.publications.nodes.find((p) => p.catalog?.apps?.nodes.some((a) => a.id === appId))?.id ?? null;
}

/** Publishes every active product and every collection to the app. Returns how many products. */
export async function publishAll(shop: string, token: string): Promise<number> {
  const publicationId = await ourPublication(shop, token);
  if (!publicationId) throw new AppError('The OY Labs sales channel is not set up in this store yet.');
  const publish = (id: string) =>
    adminGraphql(shop, token, 'mutation ($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }', {
      id,
      input: [{ publicationId }],
    });
  let count = 0;
  for (const kind of ['products', 'collections'] as const) {
    let after: string | null = null;
    do {
      const query: string = kind === 'products'
        ? 'query ($after: String) { products(first: 100, after: $after, query: "status:active") { nodes { id } pageInfo { hasNextPage endCursor } } }'
        : 'query ($after: String) { collections(first: 100, after: $after) { nodes { id } pageInfo { hasNextPage endCursor } } }';
      const page: Record<string, { nodes: { id: string }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> =
        await adminGraphql(shop, token, query, { after });
      for (const node of page[kind].nodes) {
        await publish(node.id);
        if (kind === 'products') count++;
      }
      after = page[kind].pageInfo.hasNextPage ? page[kind].pageInfo.endCursor : null;
    } while (after);
  }
  getDb().prepare('UPDATE shopify_installs SET products_published_at = ? WHERE shop = ?').run(now(), shop);
  return count;
}

/** How many active products the app can sell (capped at 2,000 to keep the page fast). */
export async function publishedCount(shop: string, token: string): Promise<number | null> {
  const publicationId = await ourPublication(shop, token);
  if (!publicationId) return null;
  let total = 0;
  let after: string | null = null;
  do {
    const data: { publication: { includedProducts: { nodes: { id: string }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null } =
      await adminGraphql(shop, token, 'query ($id: ID!, $after: String) { publication(id: $id) { includedProducts(first: 250, after: $after) { nodes { id } pageInfo { hasNextPage endCursor } } } }', {
        id: publicationId,
        after,
      });
    if (!data.publication) return null;
    total += data.publication.includedProducts.nodes.length;
    after = data.publication.includedProducts.pageInfo.hasNextPage && total < 2000 ? data.publication.includedProducts.pageInfo.endCursor : null;
  } while (after);
  return total;
}

/** Creates or refreshes the app's privacy policy page in the merchant's store; returns its URL. */
export async function ensurePrivacyPage(shop: string, token: string): Promise<string> {
  const info = await adminGraphql<{
    pages: { nodes: { id: string; handle: string }[] };
    shop: { name: string; contactEmail: string | null; primaryDomain: { url: string } };
  }>(shop, token, 'query ($q: String!) { pages(first: 1, query: $q) { nodes { id handle } } shop { name contactEmail primaryDomain { url } } }', {
    q: `handle:${PRIVACY_PAGE_HANDLE}`,
  });
  const body = privacyPageHtml({
    storeName: info.shop.name,
    contactEmail: info.shop.contactEmail,
    storeUrl: info.shop.primaryDomain.url,
    updated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  });
  const existing = info.pages.nodes.find((p) => p.handle === PRIVACY_PAGE_HANDLE);
  if (existing) {
    // The merchant may have edited it; keep their version.
  } else {
    const made = await adminGraphql<{ pageCreate: { page: { handle: string } | null; userErrors: { message: string }[] } }>(
      shop,
      token,
      'mutation ($page: PageCreateInput!) { pageCreate(page: $page) { page { id handle } userErrors { field message } } }',
      { page: { title: PRIVACY_PAGE_TITLE, handle: PRIVACY_PAGE_HANDLE, body, isPublished: true } },
    );
    if (!made.pageCreate.page) throw new AppError(made.pageCreate.userErrors.map((e) => e.message).join('; ') || 'Shopify did not create the page.');
  }
  const url = `${info.shop.primaryDomain.url.replace(/\/$/, '')}/pages/${PRIVACY_PAGE_HANDLE}`;
  getDb().prepare('UPDATE shopify_installs SET privacy_url = ? WHERE shop = ?').run(url, shop);
  getDb().prepare('UPDATE mobile_apps SET config_version = config_version + 1, updated_at = ? WHERE store_domain = ?').run(now(), shop);
  return url;
}

/**
 * Everything a newly installed store needs, safe to run on every admin open: each step
 * runs once and failures are logged without blocking the merchant.
 */
export async function setUpStore(shop: string): Promise<Install | null> {
  const install = getInstall(shop);
  if (!install) return null;
  const token = installToken(install);
  if (!install.channel_id) {
    try {
      const id = await ensureChannel(shop, token, { id: shop, name: shop.replace(/\.myshopify\.com$/, '') });
      getDb().prepare('UPDATE shopify_installs SET channel_id = ? WHERE shop = ?').run(id, shop);
    } catch (err) {
      log.error('shopify_channel.connect_failed', { shop, error: errorSummary(err) });
    }
  }
  if (!install.privacy_url) await ensurePrivacyPage(shop, token).catch((err) => log.error('shopify_channel.privacy_failed', { shop, error: errorSummary(err) }));
  if (!install.products_published_at) {
    void publishAll(shop, token)
      .then((n) => log.info('shopify_channel.published', { shop, products: n }))
      .catch((err) => log.error('shopify_channel.publish_failed', { shop, error: errorSummary(err) }));
  }
  return getInstall(shop);
}
