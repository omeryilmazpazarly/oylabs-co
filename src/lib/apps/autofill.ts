import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { errorSummary, log } from '@/lib/log';
import { createBanner, getApp, linkStore, listBanners, updateSettings, type PublicConfig, type PublicSection } from './apps';
import { LAYOUTS, layoutTheme, type LayoutId } from './layouts';
import { lookupStore } from './shopify';
import { DEFAULT_SETTINGS, parseSettings, sanitizeSettings, type AppSettings } from './settings';

/**
 * One-click setup: when an owner connects their store, everything the app shows is
 * filled from the store itself, then stays editable in the dashboard.
 *
 * - Read directly: logo, name, WhatsApp / email / Instagram links, collections and home
 *   banners (tokenless Storefront API).
 * - With ANTHROPIC_API_KEY set: brand colours and short copy (announcement, trust
 *   promises, search hint, tagline) in English and Arabic, from the homepage.
 *
 * Only empty or default fields are filled, so running it again never overwrites edits.
 */

const UA = { 'user-agent': 'Mozilla/5.0 (OY Labs app setup)', accept: 'text/html' };
const API = '2026-07';

export interface StoreFacts {
  name: string;
  logoUrl: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  collections: { handle: string; title: string; image: string | null }[];
}

/* ── Homepage parsing ─────────────────────────────────────────────────── */

const norm = (v: string | undefined) => (v || '').toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, '');

function absolute(src: string | undefined, domain: string): string | null {
  if (!src) return null;
  const s = src.replace(/&amp;/g, '&').trim();
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `https://${domain}${s}`;
  return /^https:\/\//.test(s) ? s : null;
}

/** The header logo: strong signals first ("logo" in class/id/alt or file name), then alt text equal to the shop name. */
export function findLogo(html: string, domain: string, shopName: string): string | null {
  const page = html.slice(0, 400_000);
  const headerAt = page.search(/<header\b/i);
  const header = headerAt >= 0 ? page.slice(headerAt, headerAt + 20_000) : '';
  const imgs = (chunk: string) => chunk.match(/<img\b[^>]*>/gi) ?? [];
  const candidates = [...imgs(header), ...imgs(page).slice(0, 25)]
    .map((tag) => {
      const meta = (tag.match(/\b(class|id|alt)\s*=\s*"[^"]*"/gi) ?? []).join(' ');
      const src = tag.match(/\bsrc\s*=\s*"([^"]+)"/i)?.[1] ?? tag.match(/\bsrcset\s*=\s*"([^"\s]+)/i)?.[1];
      const alt = norm(tag.match(/\balt\s*=\s*"([^"]*)"/i)?.[1]);
      const file = (src ?? '').split('?')[0].split('/').pop() ?? '';
      return { meta, src, alt, file };
    })
    .filter((c) => c.src && !/footer|payment|partner|trust|badge|icon|popup|slider|product/i.test(c.meta));
  const strong = candidates.find((c) => /logo/i.test(c.meta) || /logo|wordmark/i.test(c.file));
  const shop = norm(shopName);
  const byName = shop ? candidates.find((c) => c.alt.length >= 4 && (c.alt === shop || shop.startsWith(c.alt))) : undefined;
  const found = absolute((strong ?? byName)?.src, domain);
  return found ? found.replace(/([?&])width=\d+/, '$1width=600') : null;
}

const SOCIAL_PATHS = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'instagram', 'share', 'tv']);

export function findContacts(html: string): Pick<StoreFacts, 'whatsapp' | 'email' | 'instagram'> {
  const wa = html.match(/(?:wa\.me\/|whatsapp\.com\/send\/?\?phone=)\+?(\d{8,15})/i)?.[1];
  const email = [...html.matchAll(/mailto:([^"'?\s<>]+@[^"'?\s<>]+\.[a-z]{2,})/gi)]
    .map((m) => decodeURIComponent(m[1]).toLowerCase())
    .find((e) => !/example\.|sentry|wixpress|shopify\.com$/.test(e));
  const ig = [...html.matchAll(/instagram\.com\/([A-Za-z0-9._]{2,30})/g)].map((m) => m[1]).find((h) => !SOCIAL_PATHS.has(h.toLowerCase()));
  return { whatsapp: wa ? `+${wa}` : null, email: email ?? null, instagram: ig ?? null };
}

/** Visible text and theme colour variables, trimmed for the model. */
export function pageDigest(html: string): { text: string; colors: string } {
  const colors = [...new Set(html.match(/--[a-z0-9-]*(?:color|colour|button|accent|primary|sale|brand)[a-z0-9-]*:\s*[^;}"]{3,40}/gi) ?? [])]
    .slice(0, 120)
    .join('\n');
  const metaTheme = html.match(/name="theme-color"\s+content="([^"]+)"/i)?.[1];
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000);
  return { text, colors: (metaTheme ? `theme-color: ${metaTheme}\n` : '') + colors };
}

/* ── Store data ───────────────────────────────────────────────────────── */

type ShopQuery = {
  shop?: { name: string; primaryDomain: { host: string } };
  collections?: { nodes: { handle: string; title: string; image: { url: string } | null; products: { nodes: { featuredImage: { url: string } | null }[] } }[] };
};

async function storefront(domain: string, fetcher: typeof fetch): Promise<ShopQuery> {
  const res = await fetcher(`https://${domain}/api/${API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ shop { name primaryDomain { host } }
        collections(first: 25) { nodes { handle title image { url } products(first: 1, sortKey: BEST_SELLING) { nodes { featuredImage { url } } } } } }`,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  return ((await res.json()) as { data?: ShopQuery }).data ?? {};
}

/** Best sellers and new arrivals first, catch-all collections last, empty ones dropped. */
function rankCollections(nodes: NonNullable<ShopQuery['collections']>['nodes']): StoreFacts['collections'] {
  const rank = (h: string) => (/best.?sell|new.?arriv|featured|trending/.test(h) ? 0 : /^(all|all-items|all-products|frontpage)$/.test(h) ? 2 : 1);
  return nodes
    .filter((c) => c.products.nodes.length && !/(^|-)(test|hidden|draft|old|archive)(-|$)/.test(c.handle))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c.handle) - rank(b.c.handle) || a.i - b.i)
    .map(({ c }) => ({ handle: c.handle, title: c.title, image: c.products.nodes[0]?.featuredImage?.url ?? c.image?.url ?? null }));
}

export async function readStore(domain: string, fetcher: typeof fetch = fetch): Promise<{ facts: StoreFacts; html: string }> {
  const data = await storefront(domain, fetcher);
  if (!data.shop) throw new Error('not a Shopify store');
  const host = data.shop.primaryDomain.host || domain;
  let html = '';
  try {
    const res = await fetcher(`https://${host}/`, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(12_000) });
    if (res.ok) html = (await res.text()).slice(0, 1_500_000);
  } catch {
    /* homepage unreachable: catalogue-only setup */
  }
  return {
    html,
    facts: {
      name: data.shop.name,
      logoUrl: html ? findLogo(html, host, data.shop.name) : null,
      ...(html ? findContacts(html) : { whatsapp: null, email: null, instagram: null }),
      collections: rankCollections(data.collections?.nodes ?? []),
    },
  };
}

/* ── AI: colours and copy ─────────────────────────────────────────────── */

const LOCALIZED = { type: 'object', properties: { en: { type: 'string' }, ar: { type: 'string' } }, required: ['en', 'ar'], additionalProperties: false };
const HEX = { type: 'string', description: 'Hex colour like #1A2B3C' };

const COPY_SCHEMA = {
  type: 'object',
  properties: {
    colors: {
      type: 'object',
      properties: { primary: HEX, accent: HEX, background: HEX, text: HEX, sale: HEX },
      required: ['primary', 'accent', 'background', 'text', 'sale'],
      additionalProperties: false,
    },
    announcement: LOCALIZED,
    tagline: LOCALIZED,
    searchHint: LOCALIZED,
    trust: {
      type: 'array',
      items: { type: 'object', properties: { title: LOCALIZED, subtitle: LOCALIZED }, required: ['title', 'subtitle'], additionalProperties: false },
    },
    freeShippingThreshold: { type: ['number', 'null'] },
  },
  required: ['colors', 'announcement', 'tagline', 'searchHint', 'trust', 'freeShippingThreshold'],
  additionalProperties: false,
} as const;

export interface StoreCopy {
  colors: { primary: string; accent: string; background: string; text: string; sale: string };
  announcement: { en: string; ar: string };
  tagline: { en: string; ar: string };
  searchHint: { en: string; ar: string };
  trust: { title: { en: string; ar: string }; subtitle: { en: string; ar: string } }[];
  freeShippingThreshold: number | null;
}

const SYSTEM = `You set up a Shopify store's branded shopping app from its homepage. Use only what the page shows; never invent offers, numbers or policies.
- colors: the brand's real colours. primary = main button colour; accent = links and small highlights (a brand colour, not grey); background and text = the main page colours; sale = discount price colour (use #DB3022 if none). Prefer the theme variables provided; values like "219 18 21" are RGB.
- announcement: the store's own announcement-bar message, shortened to under 60 characters; empty strings if there is none.
- tagline: a 2-5 word description of what the store sells, from the page.
- searchHint: a search placeholder naming 2-3 real product types, e.g. "Search abayas, perfumes, sets".
- trust: up to 3 promises the page actually states (delivery, returns, cash on delivery, authenticity), each title under 24 characters, subtitle under 40. An empty list if the page states none.
- freeShippingThreshold: the order amount for free shipping only if the page states one, else null.
Write natural Arabic (Modern Standard, short), not word-for-word translation.`;

export async function aiStoreCopy(name: string, html: string): Promise<StoreCopy | null> {
  if (!process.env.ANTHROPIC_API_KEY || !html) return null;
  const { text, colors } = pageDigest(html);
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: COPY_SCHEMA } },
      messages: [{ role: 'user', content: `Store: ${name}\n\nTheme colour variables:\n${colors || '(none)'}\n\nHomepage text:\n${text}` }],
    });
    if (response.stop_reason !== 'end_turn') {
      log.warn('mobile_app.autofill.ai_incomplete', { stopReason: response.stop_reason });
      return null;
    }
    const block = response.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? (JSON.parse(block.text) as StoreCopy) : null;
  } catch (err) {
    log.error('mobile_app.autofill.ai_failed', { error: errorSummary(err) });
    return null;
  }
}

/* ── Apply ────────────────────────────────────────────────────────────── */

const isBlank = (l: Partial<Record<string, string>> | undefined) => !l || !Object.values(l).some((v) => v?.trim());

/** The settings patch: only fields still empty or default are filled. */
export function settingsPatch(current: AppSettings, facts: StoreFacts, copy: StoreCopy | null, replaceableWordmark?: string): Record<string, unknown> {
  const b = current.branding;
  const defaultColors = JSON.stringify(b.colors) === JSON.stringify(DEFAULT_SETTINGS.branding.colors);
  const branding: Record<string, unknown> = {};
  if (!b.logoUrl && facts.logoUrl) branding.logoUrl = facts.logoUrl;
  // The sign-up placeholder (the business name) counts as unset: the store's own name wins.
  if (!b.wordmark || b.wordmark === DEFAULT_SETTINGS.branding.wordmark || b.wordmark === replaceableWordmark) branding.wordmark = facts.name.toUpperCase().slice(0, 24);
  if (copy && defaultColors) branding.colors = { ...b.colors, ...copy.colors, canvas: b.colors.canvas };
  if (copy && isBlank(b.tagline)) branding.tagline = copy.tagline;

  const c = current.content;
  const content: Record<string, unknown> = {};
  if (copy) {
    if (isBlank(c.announcement) && copy.announcement.en.trim()) content.announcement = copy.announcement;
    if (isBlank(c.searchHint)) content.searchHint = copy.searchHint;
    if (!c.trust.length && copy.trust.length) content.trust = copy.trust.slice(0, 3);
  }
  const contact: Record<string, unknown> = {};
  if (!current.contact.whatsapp && facts.whatsapp) contact.whatsapp = facts.whatsapp;
  if (!current.contact.email && facts.email) contact.email = facts.email;
  const integrations: Record<string, unknown> = {};
  if (!current.integrations.instagramHandle && facts.instagram) integrations.instagramHandle = facts.instagram;
  const features: Record<string, unknown> = {};
  if (copy?.freeShippingThreshold && current.features.freeShippingThreshold == null) features.freeShippingThreshold = copy.freeShippingThreshold;

  return { branding, content, contact, integrations, features };
}

/** Home sections for an app that has none: a hero, two collection rows and a product grid. */
export function defaultSections(facts: StoreFacts, tagline?: { en: string; ar: string }) {
  const [first, ...rest] = facts.collections;
  if (!first) return [];
  const sections: Parameters<typeof createBanner>[1][] = [];
  sections.push({
    kind: 'hero',
    titleEn: first.title,
    subtitleEn: tagline?.en || undefined,
    subtitleAr: tagline?.ar || undefined,
    ctaEn: 'Shop now',
    ctaAr: 'تسوّق الآن',
    imageUrl: first.image ?? undefined,
    collectionHandle: first.handle,
    link: `/collections/${first.handle}`,
  });
  for (const c of rest.slice(0, 2)) sections.push({ kind: 'collection_row', titleEn: c.title, collectionHandle: c.handle });
  sections.push({ kind: 'product_grid', titleEn: first.title, collectionHandle: first.handle });
  return sections;
}

/* ── Store setup: one lookup per store, shared by preview, sign-up and the dashboard ── */

export interface StoreSetup {
  /** .myshopify.com when Shopify exposes it, else the primary domain. */
  domain: string;
  facts: StoreFacts;
  copy: StoreCopy | null;
}

const DAY = 24 * 60 * 60 * 1000;
const setups = new Map<string, { at: number; setup: Promise<StoreSetup> }>();

/**
 * Everything the app needs from a store, cached for a day per address so the landing
 * preview, sign-up and "Connect store" agree and the AI runs once per store.
 */
export function storeSetup(address: string, fetcher: typeof fetch = fetch): Promise<StoreSetup> {
  const key = address.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[/?#].*$/, '');
  const hit = setups.get(key);
  if (hit && Date.now() - hit.at < DAY) return hit.setup;
  const setup = (async () => {
    const { domain } = await lookupStore(key, fetcher);
    const { facts, html } = await readStore(domain, fetcher);
    return { domain, facts, copy: await aiStoreCopy(facts.name, html) };
  })();
  setups.set(key, { at: Date.now(), setup });
  setup.catch(() => setups.delete(key));
  if (setups.size > 500) setups.delete(setups.keys().next().value!);
  return setup;
}

/** The look a new app starts with: the layout's defaults, then the store's own details. */
export function initialSettings(setup: StoreSetup, layout: LayoutId): AppSettings {
  const preset = LAYOUTS[layout].branding;
  // The store's own colours win over the layout's; the layout keeps its shapes and fonts.
  const colors = setup.copy ? { ...preset.colors, ...setup.copy.colors, canvas: DEFAULT_SETTINGS.branding.colors.canvas } : preset.colors;
  const base = sanitizeSettings({ layout, branding: { ...preset, colors } });
  return sanitizeSettings(settingsPatch(base, setup.facts, setup.copy), base);
}

/** A complete app config for a store that has no app yet (landing preview, sign-up). */
export function previewConfig(setup: StoreSetup, layout: LayoutId): PublicConfig {
  const settings = initialSettings(setup, layout);
  const home: PublicSection[] = defaultSections(setup.facts, setup.copy?.tagline).map((s, i) => ({
    id: `preview-${i}`,
    type: s.kind,
    title: { ...(s.titleEn ? { en: s.titleEn } : {}), ...(s.titleAr ? { ar: s.titleAr } : {}) },
    subtitle: { ...(s.subtitleEn ? { en: s.subtitleEn } : {}), ...(s.subtitleAr ? { ar: s.subtitleAr } : {}) },
    cta: { ...(s.ctaEn ? { en: s.ctaEn } : {}), ...(s.ctaAr ? { ar: s.ctaAr } : {}) },
    image: s.imageUrl ?? null,
    link: s.link ?? null,
    collection: s.collectionHandle ?? null,
  }));
  return {
    version: 1,
    updatedAt: Date.now(),
    status: 'setup',
    store: { domain: setup.domain, storefrontToken: null, shopId: null, customerAccountClientId: null, customerAccountEndpoint: null, customerAccountAuthEndpoint: null, privacyPolicyUrl: null },
    settings,
    home,
    layout: LAYOUTS[layout].layout,
    theme: layoutTheme(layout),
  };
}

export async function autofillApp(appId: number, address: string, fetcher: typeof fetch = fetch): Promise<{ filled: string[] }> {
  const app = getApp(appId);
  if (!app) return { filled: [] };
  const { facts, copy } = await storeSetup(address, fetcher);
  const patch = settingsPatch(parseSettings(app.settings), facts, copy, app.name.toUpperCase().slice(0, 24));
  updateSettings(appId, patch);
  const filled = Object.entries(patch).flatMap(([group, fields]) => Object.keys(fields as object).map((f) => `${group}.${f}`));
  if (!listBanners(appId).length) {
    for (const section of defaultSections(facts, copy?.tagline)) {
      try {
        createBanner(appId, section);
        filled.push(`home.${section.kind}`);
      } catch (err) {
        log.warn('mobile_app.autofill.section_skipped', { appId, error: errorSummary(err) });
      }
    }
  }
  log.info('mobile_app.autofill.done', { appId, filled: filled.length, ai: Boolean(copy) });
  return { filled };
}

/**
 * Sign-up with a store already chosen on the landing page: link it, apply the layout
 * and fill everything, so the app is complete by the time payment finishes.
 */
export async function setUpAppFromStore(appId: number, address: string, layout: LayoutId): Promise<void> {
  try {
    const setup = await storeSetup(address);
    linkStore(appId, setup.domain);
    updateSettings(appId, { layout });
    await autofillApp(appId, address);
  } catch (err) {
    log.warn('mobile_app.signup_setup_failed', { appId, error: errorSummary(err) });
  }
}
