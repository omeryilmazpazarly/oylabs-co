import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { decryptSecret, encryptSecret, randomToken } from '@/lib/messaging/crypto';
import { DEFAULT_SETTINGS, parseSettings, sanitizeSettings, url, type AppSettings, type Language } from './settings';

/**
 * White-label Shopify mobile apps: one or more per workspace (business).
 *
 * The workspace owns the app; staff create it, clients edit its settings and banners
 * in the portal. Every saved change bumps `config_version`, which installed apps use
 * to know their cached config is stale.
 */

export type AppStatus = 'setup' | 'building' | 'live' | 'paused';
export type BannerKind = 'hero' | 'banner' | 'collection_row' | 'product_grid' | 'text';

export interface MobileApp {
  id: number;
  workspace_id: number;
  name: string;
  slug: string;
  public_key: string;
  status: AppStatus;
  android_package: string | null;
  ios_bundle_id: string | null;
  eas_project_id: string | null;
  store_domain: string | null;
  storefront_token: string | null;
  customer_shop_id: string | null;
  customer_client_id: string | null;
  customer_api_endpoint: string | null;
  customer_auth_endpoint: string | null;
  admin_token_enc: string | null;
  webhook_secret_enc: string | null;
  settings: string;
  config_version: number;
  setup_paid_at: number | null;
  setup_checkout_id: string | null;
  care_subscription_id: string | null;
  care_status: string | null;
  created_at: number;
  updated_at: number;
}

export interface Banner {
  id: number;
  app_id: number;
  kind: BannerKind;
  position: number;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  cta_en: string | null;
  cta_ar: string | null;
  image_url: string | null;
  link: string | null;
  collection_handle: string | null;
  active: number;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
  updated_at: number;
}

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const PACKAGE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const SHOP_DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export function listApps(workspaceId: number): MobileApp[] {
  return getDb().prepare('SELECT * FROM mobile_apps WHERE workspace_id = ? ORDER BY created_at').all(workspaceId) as MobileApp[];
}

/**
 * A business that bought only a mobile app (no messaging plan, nothing connected):
 * the portal opens on its app and doesn't ask it to pick a messaging plan.
 */
export function isAppOnlyWorkspace(w: { id: number; complimentary: number; subscription_status: string | null }): boolean {
  if (w.complimentary || w.subscription_status) return false;
  const db = getDb();
  if (!db.prepare('SELECT 1 FROM mobile_apps WHERE workspace_id = ?').get(w.id)) return false;
  const channels =
    db.prepare("SELECT 1 FROM connections WHERE workspace_id = ? AND status != 'disconnected'").get(w.id) ||
    db.prepare("SELECT 1 FROM wa_numbers WHERE workspace_id = ? AND status != 'disconnected'").get(w.id);
  return !channels;
}

export function listAllApps(): (MobileApp & { workspace_name: string })[] {
  return getDb()
    .prepare('SELECT a.*, w.name AS workspace_name FROM mobile_apps a JOIN workspaces w ON w.id = a.workspace_id ORDER BY a.created_at DESC')
    .all() as (MobileApp & { workspace_name: string })[];
}

export function getApp(id: number): MobileApp | null {
  return (getDb().prepare('SELECT * FROM mobile_apps WHERE id = ?').get(id) as MobileApp | undefined) ?? null;
}

/** The app if it belongs to this workspace; portal pages must go through this. */
export function getWorkspaceApp(workspaceId: number, id: number): MobileApp | null {
  const app = getApp(id);
  return app && app.workspace_id === workspaceId ? app : null;
}

export function getAppByPublicKey(key: string): MobileApp | null {
  return (getDb().prepare('SELECT * FROM mobile_apps WHERE public_key = ?').get(key) as MobileApp | undefined) ?? null;
}

export function createApp(input: { workspaceId: number; name: string; slug: string; wordmark?: string }): MobileApp {
  const name = input.name.trim().slice(0, 60);
  const slug = input.slug.trim().toLowerCase();
  if (!name) throw new AppError('Give the app a name.');
  if (!SLUG.test(slug)) throw new AppError('The slug must be 3–40 lowercase letters, numbers or dashes.');
  if (getDb().prepare('SELECT 1 FROM mobile_apps WHERE slug = ?').get(slug)) throw new AppError('That slug is already used by another app.');
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    branding: { ...DEFAULT_SETTINGS.branding, wordmark: (input.wordmark || name).toUpperCase().slice(0, 24) },
  };
  const t = now();
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO mobile_apps (workspace_id, name, slug, public_key, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(input.workspaceId, name, slug, `oyapp_${randomToken(18)}`, JSON.stringify(settings), t, t);
  return getApp(Number(lastInsertRowid))!;
}

function bump(appId: number) {
  getDb().prepare('UPDATE mobile_apps SET config_version = config_version + 1, updated_at = ? WHERE id = ?').run(now(), appId);
}

export function updateSettings(appId: number, patch: unknown): AppSettings {
  const app = getApp(appId);
  if (!app) throw new AppError('App not found.');
  const next = sanitizeSettings(patch, parseSettings(app.settings));
  getDb().prepare('UPDATE mobile_apps SET settings = ? WHERE id = ?').run(JSON.stringify(next), appId);
  bump(appId);
  return next;
}

export interface StoreConnectionInput {
  storeDomain: string;
  storefrontToken: string;
  customerShopId?: string;
  customerClientId?: string;
  customerApiEndpoint?: string;
  customerAuthEndpoint?: string;
  /** Optional: enables order-update and back-in-stock notifications. Blank keeps the saved one. */
  adminToken?: string;
  webhookSecret?: string;
}

/** Links the app to a Shopify store. The Storefront token is public by design; the Admin token is encrypted. */
export function updateStoreConnection(appId: number, input: StoreConnectionInput): void {
  const domain = input.storeDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!SHOP_DOMAIN.test(domain)) throw new AppError('Use the store\'s .myshopify.com domain, e.g. my-store.myshopify.com.');
  const token = input.storefrontToken.trim();
  if (!/^[0-9a-f]{32}$/i.test(token)) throw new AppError('The Storefront public access token is 32 letters and numbers.');
  if (token.startsWith('shpat_')) throw new AppError('That is a private Admin token. Use the Storefront public token.');
  const shopId = input.customerShopId?.trim() || null;
  if (shopId && !/^\d{5,20}$/.test(shopId)) throw new AppError('The shop ID is a number.');
  const endpoint = (v?: string) => {
    const t = v?.trim();
    if (!t) return null;
    const u = url(t);
    if (!u || !u.startsWith('https://')) throw new AppError('Customer Account endpoints must be https URLs.');
    return u.replace(/\/$/, '');
  };
  const sets = [
    'store_domain = @domain',
    'storefront_token = @token',
    'customer_shop_id = @shopId',
    'customer_client_id = @clientId',
    'customer_api_endpoint = @apiEndpoint',
    'customer_auth_endpoint = @authEndpoint',
  ];
  const adminToken = input.adminToken?.trim();
  if (adminToken) {
    if (!adminToken.startsWith('shpat_')) throw new AppError('The Admin API access token starts with shpat_.');
    sets.push('admin_token_enc = @adminToken');
  }
  const webhookSecret = input.webhookSecret?.trim();
  if (webhookSecret) sets.push('webhook_secret_enc = @webhookSecret');
  getDb()
    .prepare(`UPDATE mobile_apps SET ${sets.join(', ')} WHERE id = @id`)
    .run({
      id: appId,
      domain,
      token,
      shopId,
      clientId: input.customerClientId?.trim() || null,
      apiEndpoint: endpoint(input.customerApiEndpoint),
      authEndpoint: endpoint(input.customerAuthEndpoint),
      adminToken: adminToken ? encryptSecret(adminToken) : null,
      webhookSecret: webhookSecret ? encryptSecret(webhookSecret) : null,
    });
  bump(appId);
}

export function adminToken(app: MobileApp): string | null {
  return app.admin_token_enc ? decryptSecret(app.admin_token_enc) : null;
}

export function webhookSecret(app: MobileApp): string | null {
  return app.webhook_secret_enc ? decryptSecret(app.webhook_secret_enc) : null;
}

export function setAppStatus(appId: number, status: AppStatus): void {
  getDb().prepare('UPDATE mobile_apps SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), appId);
}

export function updateBuildInfo(appId: number, info: { androidPackage?: string; iosBundleId?: string; easProjectId?: string; name?: string }) {
  const pkg = info.androidPackage?.trim() || null;
  const bundle = info.iosBundleId?.trim() || null;
  if (pkg && !PACKAGE.test(pkg)) throw new AppError('Android package looks like com.brand.app (lowercase, dots).');
  if (bundle && !PACKAGE.test(bundle.toLowerCase())) throw new AppError('iOS bundle ID looks like com.brand.app.');
  getDb()
    .prepare(
      `UPDATE mobile_apps SET android_package = ?, ios_bundle_id = ?, eas_project_id = ?, name = COALESCE(?, name), updated_at = ? WHERE id = ?`,
    )
    .run(pkg, bundle, info.easProjectId?.trim() || null, info.name?.trim() || null, now(), appId);
}

export function markSetupPaid(appId: number, checkoutId: string | null): void {
  getDb()
    .prepare('UPDATE mobile_apps SET setup_paid_at = COALESCE(setup_paid_at, ?), setup_checkout_id = COALESCE(?, setup_checkout_id), updated_at = ? WHERE id = ?')
    .run(now(), checkoutId, now(), appId);
}

export function setCareSubscription(appId: number, subscriptionId: string | null, status: string | null): void {
  getDb().prepare('UPDATE mobile_apps SET care_subscription_id = ?, care_status = ?, updated_at = ? WHERE id = ?').run(subscriptionId, status, now(), appId);
}

// ---------------------------------------------------------------------------
// Banners (home sections)

export function listBanners(appId: number): Banner[] {
  return getDb().prepare('SELECT * FROM mobile_app_banners WHERE app_id = ? ORDER BY position, id').all(appId) as Banner[];
}

export interface BannerInput {
  kind: BannerKind;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  ctaEn?: string;
  ctaAr?: string;
  imageUrl?: string;
  link?: string;
  collectionHandle?: string;
  active?: boolean;
  startsAt?: number | null;
  endsAt?: number | null;
}

const KINDS: BannerKind[] = ['hero', 'banner', 'collection_row', 'product_grid', 'text'];
const cap = (v: string | undefined, max: number) => v?.trim().slice(0, max) || null;

function bannerValues(input: BannerInput) {
  if (!KINDS.includes(input.kind)) throw new AppError('Unknown section type.');
  const handle = input.collectionHandle?.trim() || null;
  if ((input.kind === 'collection_row' || input.kind === 'product_grid') && !handle) {
    throw new AppError('Pick the collection this section shows.');
  }
  if (input.kind === 'hero' && !input.imageUrl?.trim() && !handle) throw new AppError('A hero needs an image or a collection.');
  if (input.kind === 'text' && !input.titleEn?.trim() && !input.titleAr?.trim() && !input.subtitleEn?.trim() && !input.subtitleAr?.trim()) {
    throw new AppError('A text section needs some text.');
  }
  const link = input.link?.trim() || null;
  if (link && !link.startsWith('/') && !url(link)) throw new AppError('The link must be a page path (/collections/…) or a full URL.');
  return {
    kind: input.kind,
    title_en: cap(input.titleEn, 80),
    title_ar: cap(input.titleAr, 80),
    subtitle_en: cap(input.subtitleEn, 200),
    subtitle_ar: cap(input.subtitleAr, 200),
    cta_en: cap(input.ctaEn, 30),
    cta_ar: cap(input.ctaAr, 30),
    image_url: input.imageUrl ? url(input.imageUrl) : null,
    link,
    collection_handle: handle,
    active: input.active === false ? 0 : 1,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
  };
}

export function createBanner(appId: number, input: BannerInput): number {
  const v = bannerValues(input);
  const t = now();
  const { next } = getDb().prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM mobile_app_banners WHERE app_id = ?').get(appId) as { next: number };
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO mobile_app_banners (app_id, kind, position, title_en, title_ar, subtitle_en, subtitle_ar, cta_en, cta_ar, image_url, link,
         collection_handle, active, starts_at, ends_at, created_at, updated_at)
       VALUES (@appId, @kind, @position, @title_en, @title_ar, @subtitle_en, @subtitle_ar, @cta_en, @cta_ar, @image_url, @link,
         @collection_handle, @active, @starts_at, @ends_at, @t, @t)`,
    )
    .run({ ...v, appId, position: next, t });
  bump(appId);
  return Number(lastInsertRowid);
}

export function updateBanner(appId: number, bannerId: number, input: BannerInput): void {
  const v = bannerValues(input);
  const res = getDb()
    .prepare(
      `UPDATE mobile_app_banners SET kind = @kind, title_en = @title_en, title_ar = @title_ar, subtitle_en = @subtitle_en,
         subtitle_ar = @subtitle_ar, cta_en = @cta_en, cta_ar = @cta_ar, image_url = @image_url, link = @link,
         collection_handle = @collection_handle, active = @active, starts_at = @starts_at, ends_at = @ends_at, updated_at = @t
       WHERE id = @bannerId AND app_id = @appId`,
    )
    .run({ ...v, appId, bannerId, t: now() });
  if (!res.changes) throw new AppError('Section not found.');
  bump(appId);
}

export function deleteBanner(appId: number, bannerId: number): void {
  getDb().prepare('DELETE FROM mobile_app_banners WHERE id = ? AND app_id = ?').run(bannerId, appId);
  bump(appId);
}

/** Moves a section one place up or down. */
export function moveBanner(appId: number, bannerId: number, direction: 'up' | 'down'): void {
  const list = listBanners(appId);
  const i = list.findIndex((b) => b.id === bannerId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const update = getDb().prepare('UPDATE mobile_app_banners SET position = ? WHERE id = ?');
  getDb().transaction(() => list.forEach((b, position) => update.run(position, b.id)))();
  bump(appId);
}

// ---------------------------------------------------------------------------
// Public config served to installed apps

export interface PublicSection {
  id: string;
  type: BannerKind;
  title: Partial<Record<Language, string>>;
  subtitle: Partial<Record<Language, string>>;
  cta: Partial<Record<Language, string>>;
  image: string | null;
  link: string | null;
  collection: string | null;
}

export interface PublicConfig {
  version: number;
  updatedAt: number;
  status: AppStatus;
  store: {
    domain: string | null;
    storefrontToken: string | null;
    shopId: string | null;
    customerAccountClientId: string | null;
    customerAccountEndpoint: string | null;
    customerAccountAuthEndpoint: string | null;
  };
  settings: AppSettings;
  home: PublicSection[];
}

const loc = (en: string | null, ar: string | null) => ({ ...(en ? { en } : {}), ...(ar ? { ar } : {}) });

/** Absolute URL for uploads so the app can load them (`/uploads/x.jpg` → https://oylabs.co/uploads/x.jpg). */
export function absolute(u: string | null, base: string): string | null {
  if (!u) return null;
  return u.startsWith('/') ? `${base.replace(/\/$/, '')}${u}` : u;
}

export function buildPublicConfig(app: MobileApp, baseUrl: string, nowMs = now()): PublicConfig {
  const settings = parseSettings(app.settings);
  settings.branding.logoUrl = absolute(settings.branding.logoUrl, baseUrl);
  const home = listBanners(app.id)
    .filter((b) => b.active && (b.starts_at === null || b.starts_at <= nowMs) && (b.ends_at === null || b.ends_at > nowMs))
    .map((b) => ({
      id: String(b.id),
      type: b.kind,
      title: loc(b.title_en, b.title_ar),
      subtitle: loc(b.subtitle_en, b.subtitle_ar),
      cta: loc(b.cta_en, b.cta_ar),
      image: absolute(b.image_url, baseUrl),
      link: b.link,
      collection: b.collection_handle,
    }));
  return {
    version: app.config_version,
    updatedAt: app.updated_at,
    status: app.status,
    store: {
      domain: app.store_domain,
      storefrontToken: app.storefront_token,
      shopId: app.customer_shop_id,
      customerAccountClientId: app.customer_client_id,
      customerAccountEndpoint: app.customer_api_endpoint,
      customerAccountAuthEndpoint: app.customer_auth_endpoint,
    },
    settings,
    home,
  };
}
