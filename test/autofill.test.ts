import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb, seedWorkspace } from './helpers';
import { createApp, getApp, listBanners, updateSettings } from '@/lib/apps/apps';
import { autofillApp, defaultSections, findContacts, findLogo, settingsPatch, type StoreFacts } from '@/lib/apps/autofill';
import { DEFAULT_SETTINGS, parseSettings } from '@/lib/apps/settings';

let ws: number;
beforeEach(() => {
  ws = seedWorkspace(freshDb(), { name: 'Shop' });
});

const HOME = `<html><body><header><a href="/"><img src="//shop.com/cdn/files/brand-logo.png?width=200" class="header__logo" alt="Shop"></a></header>
<div class="announcement">Free delivery over 500</div>
<a href="https://wa.me/201012345678">WhatsApp</a> <a href="mailto:hello@shop.com">Email</a>
<a href="https://instagram.com/p/xyz">post</a> <a href="https://www.instagram.com/shop.eg">IG</a>
<footer><img src="/cdn/visa.svg" class="payment-icon"></footer></body></html>`;

const facts: StoreFacts = {
  name: 'Shop',
  logoUrl: 'https://shop.com/logo.png',
  whatsapp: '+201012345678',
  email: 'hello@shop.com',
  instagram: 'shop.eg',
  collections: [
    { handle: 'best-sellers', title: 'Best sellers', image: 'https://shop.com/a.jpg' },
    { handle: 'dresses', title: 'Dresses', image: null },
    { handle: 'shoes', title: 'Shoes', image: null },
  ],
};

describe('reading the homepage', () => {
  it('finds the header logo and contacts, skipping post links and payment icons', () => {
    expect(findLogo(HOME, 'shop.com', 'Shop')).toBe('https://shop.com/cdn/files/brand-logo.png?width=600');
    expect(findContacts(HOME)).toEqual({ whatsapp: '+201012345678', email: 'hello@shop.com', instagram: 'shop.eg' });
  });
});

describe('filling settings', () => {
  it('fills only empty or default fields', () => {
    const copy = {
      colors: { primary: '#111111', accent: '#AA3300', background: '#FFFFFF', text: '#222222', sale: '#DD0000' },
      announcement: { en: 'Free delivery over 500', ar: 'توصيل مجاني فوق 500' },
      tagline: { en: 'Modest fashion', ar: 'أزياء محتشمة' },
      searchHint: { en: 'Search dresses', ar: 'ابحث عن فساتين' },
      trust: [{ title: { en: 'Cash on delivery', ar: 'الدفع عند الاستلام' }, subtitle: { en: 'Pay at the door', ar: 'ادفع عند الباب' } }],
      freeShippingThreshold: 500,
    };
    const fresh = settingsPatch(DEFAULT_SETTINGS, facts, copy);
    expect(fresh.branding).toMatchObject({ logoUrl: facts.logoUrl, wordmark: 'SHOP', colors: { accent: '#AA3300' } });
    expect(fresh.contact).toEqual({ whatsapp: facts.whatsapp, email: facts.email });
    expect(fresh.features).toEqual({ freeShippingThreshold: 500 });

    const edited = { ...DEFAULT_SETTINGS, branding: { ...DEFAULT_SETTINGS.branding, wordmark: 'MINE', colors: { ...DEFAULT_SETTINGS.branding.colors, primary: '#00FF00' } }, contact: { whatsapp: '+15550000000', email: null } };
    const again = settingsPatch(edited, facts, copy);
    expect(again.branding).not.toHaveProperty('wordmark');
    expect(again.branding).not.toHaveProperty('colors');
    expect(again.contact).toEqual({ email: facts.email });
  });

  it('builds a hero, two collection rows and a grid', () => {
    expect(defaultSections(facts).map((s) => `${s.kind}:${s.collectionHandle}`)).toEqual([
      'hero:best-sellers', 'collection_row:dresses', 'collection_row:shoes', 'product_grid:best-sellers',
    ]);
    expect(defaultSections({ ...facts, collections: [] })).toEqual([]);
  });

  it('fills a new app from its store without AI and leaves existing sections alone', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetcher = (async (input: string) =>
      new Response(
        input.endsWith('/graphql.json')
          ? JSON.stringify({ data: { shop: { name: 'Shop', primaryDomain: { host: 'shop.com' } }, collections: { nodes: [
              { handle: 'best-sellers', title: 'Best sellers', image: null, products: { nodes: [{ featuredImage: { url: 'https://shop.com/a.jpg' } }] } },
              { handle: 'new-arrivals-test', title: 'Test', image: null, products: { nodes: [{ featuredImage: null }] } },
            ] } } })
          : HOME,
      )) as unknown as typeof fetch;
    const app = createApp({ workspaceId: ws, name: 'Shop', slug: 'shop-co' });
    const { filled } = await autofillApp(app.id, 'shop.com', fetcher);
    expect(filled).toContain('branding.logoUrl');
    const s = parseSettings(getApp(app.id)!.settings);
    expect(s.contact.whatsapp).toBe('+201012345678');
    expect(s.integrations.instagramHandle).toBe('shop.eg');
    expect(listBanners(app.id).map((b) => b.kind)).toEqual(['hero', 'product_grid']);

    updateSettings(app.id, { branding: { wordmark: 'EDITED' } });
    await autofillApp(app.id, 'shop.com', fetcher);
    expect(parseSettings(getApp(app.id)!.settings).branding.wordmark).toBe('EDITED');
    expect(listBanners(app.id)).toHaveLength(2);
  });
});
