/**
 * Dashboard-controlled settings of a white-label Shopify mobile app.
 *
 * Stored as JSON in mobile_apps.settings and served to installed apps by the public
 * config endpoint (src/app/api/mobile/v1/config). Anything here changes the live
 * app without a store release; native things (app name, icon, package id) still
 * need a new build.
 *
 * `sanitizeSettings` is the single gate for client input: unknown keys are dropped,
 * colours must be #RRGGBB, URLs http(s), texts are trimmed and capped.
 */
import { isLayoutId, type LayoutId } from './layouts';

export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];
export type Localized = Partial<Record<Language, string>>;

export type ButtonStyle = 'rounded' | 'pill' | 'square';

export interface TrustItem {
  title: Localized;
  subtitle: Localized;
}

export interface AppSettings {
  /** App Builder layout: tab bar, tabs, header, home arrangement and fonts (lib/apps/layouts). */
  layout: LayoutId;
  branding: {
    /** Text wordmark in the header when there's no logo image. */
    wordmark: string;
    tagline: Localized;
    /** Header logo (transparent PNG/SVG URL); the wordmark shows when empty. */
    logoUrl: string | null;
    colors: {
      /** Buttons, active tabs, selected chips. */
      primary: string;
      /** Links and small highlights. */
      accent: string;
      background: string;
      /** Secondary screen ground (bag, account). */
      canvas: string;
      text: string;
      /** Sale prices and discount badges. */
      sale: string;
    };
    buttonStyle: ButtonStyle;
    /** Corner radius for cards, images and inputs (0–20). */
    radius: number;
  };
  content: {
    /** Strip above the home header ("Cash on delivery · inspect before you pay"). */
    announcement: Localized;
    welcomeTagline: Localized;
    welcomeFootnote: Localized;
    /** Search field placeholder ("Search abayas, skirts, sets…"). */
    searchHint: Localized;
    /** Up to three short promises under the home hero. */
    trust: TrustItem[];
  };
  contact: {
    /** International format, e.g. +201012345678. */
    whatsapp: string | null;
    email: string | null;
  };
  integrations: {
    judgemePublicToken: string | null;
    reelsFeedUrl: string | null;
    instagramHandle: string | null;
  };
  features: {
    wishlist: boolean;
    reels: boolean;
    reviews: boolean;
    /** Store currency amount; null hides the free-shipping banner and bar. */
    freeShippingThreshold: number | null;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  layout: 'classic',
  branding: {
    wordmark: 'STORE',
    tagline: {},
    logoUrl: null,
    colors: {
      primary: '#171717',
      accent: '#7A5F37',
      background: '#FFFFFF',
      canvas: '#F9F9F9',
      text: '#222222',
      sale: '#DB3022',
    },
    buttonStyle: 'rounded',
    radius: 8,
  },
  content: {
    announcement: {},
    welcomeTagline: {},
    welcomeFootnote: {},
    searchHint: {},
    trust: [],
  },
  contact: { whatsapp: null, email: null },
  integrations: { judgemePublicToken: null, reelsFeedUrl: null, instagramHandle: null },
  features: { wishlist: true, reels: false, reviews: true, freeShippingThreshold: null },
};

const HEX = /^#[0-9A-Fa-f]{6}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

function localized(v: unknown, max: number): Localized {
  const o = obj(v);
  const out: Localized = {};
  for (const lang of LANGUAGES) {
    const t = text(o[lang], max);
    if (t) out[lang] = t;
  }
  return out;
}

function color(v: unknown, fallback: string): string {
  return typeof v === 'string' && HEX.test(v.trim()) ? v.trim().toUpperCase() : fallback;
}

/** http(s) URLs, plus site-relative /uploads paths from the dashboard's image upload. */
export function url(v: unknown): string | null {
  const t = text(v, 2000);
  if (!t) return null;
  if (t.startsWith('/uploads/')) return t;
  try {
    const u = new URL(t);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Normalises untrusted input (a form post or stored JSON) into complete settings. */
export function sanitizeSettings(input: unknown, base: AppSettings = DEFAULT_SETTINGS): AppSettings {
  const i = obj(input);
  const b = obj(i.branding);
  const c = obj(b.colors);
  const content = obj(i.content);
  const contact = obj(i.contact);
  const integ = obj(i.integrations);
  const feat = obj(i.features);

  const whatsapp = text(contact.whatsapp, 20)?.replace(/[\s-]/g, '') ?? null;
  const email = text(contact.email, 200);
  const handle = text(integ.instagramHandle, 31)?.replace(/^@/, '') ?? null;
  const radius = Number(b.radius);
  const threshold = feat.freeShippingThreshold === null || feat.freeShippingThreshold === '' ? null : Number(feat.freeShippingThreshold);
  const buttonStyle = b.buttonStyle === 'pill' || b.buttonStyle === 'square' || b.buttonStyle === 'rounded' ? b.buttonStyle : base.branding.buttonStyle;

  const trust = Array.isArray(content.trust)
    ? content.trust
        .slice(0, 3)
        .map((t) => ({ title: localized(obj(t).title, 40), subtitle: localized(obj(t).subtitle, 60) }))
        .filter((t) => t.title.en || t.title.ar)
    : base.content.trust;

  return {
    layout: isLayoutId(i.layout) ? i.layout : base.layout,
    branding: {
      wordmark: text(b.wordmark, 24) ?? base.branding.wordmark,
      tagline: 'tagline' in b ? localized(b.tagline, 60) : base.branding.tagline,
      logoUrl: 'logoUrl' in b ? url(b.logoUrl) : base.branding.logoUrl,
      colors: {
        primary: color(c.primary, base.branding.colors.primary),
        accent: color(c.accent, base.branding.colors.accent),
        background: color(c.background, base.branding.colors.background),
        canvas: color(c.canvas, base.branding.colors.canvas),
        text: color(c.text, base.branding.colors.text),
        sale: color(c.sale, base.branding.colors.sale),
      },
      buttonStyle,
      radius: Number.isFinite(radius) ? Math.min(20, Math.max(0, Math.round(radius))) : base.branding.radius,
    },
    content: {
      announcement: 'announcement' in content ? localized(content.announcement, 90) : base.content.announcement,
      welcomeTagline: 'welcomeTagline' in content ? localized(content.welcomeTagline, 120) : base.content.welcomeTagline,
      welcomeFootnote: 'welcomeFootnote' in content ? localized(content.welcomeFootnote, 80) : base.content.welcomeFootnote,
      searchHint: 'searchHint' in content ? localized(content.searchHint, 50) : base.content.searchHint,
      trust,
    },
    contact: {
      whatsapp: 'whatsapp' in contact ? (whatsapp && PHONE.test(whatsapp) ? whatsapp : null) : base.contact.whatsapp,
      email: 'email' in contact ? (email && EMAIL.test(email) ? email : null) : base.contact.email,
    },
    integrations: {
      judgemePublicToken: 'judgemePublicToken' in integ ? text(integ.judgemePublicToken, 100) : base.integrations.judgemePublicToken,
      reelsFeedUrl: 'reelsFeedUrl' in integ ? url(integ.reelsFeedUrl) : base.integrations.reelsFeedUrl,
      instagramHandle: 'instagramHandle' in integ ? (handle && HANDLE.test(handle) ? handle : null) : base.integrations.instagramHandle,
    },
    features: {
      wishlist: bool(feat.wishlist, base.features.wishlist),
      reels: bool(feat.reels, base.features.reels),
      reviews: bool(feat.reviews, base.features.reviews),
      freeShippingThreshold:
        'freeShippingThreshold' in feat
          ? threshold !== null && Number.isFinite(threshold) && threshold > 0
            ? threshold
            : null
          : base.features.freeShippingThreshold,
    },
  };
}

/** Parses stored JSON; anything malformed falls back to the defaults. */
export function parseSettings(stored: string | null | undefined): AppSettings {
  try {
    return sanitizeSettings(JSON.parse(stored || '{}'));
  } catch {
    return DEFAULT_SETTINGS;
  }
}
