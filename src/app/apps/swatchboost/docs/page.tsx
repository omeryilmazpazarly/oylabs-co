'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, Zap, Settings, CreditCard, Globe, HelpCircle,
  ChevronRight, ArrowLeft, Terminal, AlertCircle, CheckCircle2,
  Palette, ShoppingCart, BarChart2, ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Sidebar sections ──────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'getting-started',
    icon: Zap,
    label: 'Getting Started',
    sub: ['Overview', 'Installation', 'Quick Start'],
  },
  {
    id: 'how-it-works',
    icon: ShoppingCart,
    label: 'How It Works',
    sub: ['The Popup Flow', 'Colour Detection', 'Live Cart Sync'],
  },
  {
    id: 'customizer',
    icon: Palette,
    label: 'Customizer',
    sub: ['Brand Themes', 'Custom Copy', 'Discount Tiers', 'Accent Colour'],
  },
  {
    id: 'rtl',
    icon: Globe,
    label: 'RTL & Languages',
    sub: ['How RTL Works', 'Arabic Setup', 'Supported Languages'],
  },
  {
    id: 'products',
    icon: Settings,
    label: 'Products',
    sub: ['Activating Products', 'Colour Option Names', 'Multi-Product'],
  },
  {
    id: 'discounts',
    icon: BarChart2,
    label: 'Discounts',
    sub: ['Auto Discount Setup', 'Tier Configuration', 'Testing'],
  },
  {
    id: 'plans',
    icon: CreditCard,
    label: 'Plans & Billing',
    sub: ['Plan Comparison', 'Free Trial', 'Dev Stores'],
  },
  {
    id: 'troubleshooting',
    icon: HelpCircle,
    label: 'Troubleshooting',
    sub: ['Popup Not Showing', 'Discount Not Applied', 'RTL Issues'],
  },
];

/* ── Code block helper ─────────────────────────────────────────── */
function Code({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
      {children}
    </code>
  );
}

function CodeBlock({ children, lang = '' }: { children: string; lang?: string }) {
  return (
    <div className="rounded-xl border border-line overflow-hidden my-4">
      {lang && (
        <div className="px-4 py-2 border-b border-line bg-elevated text-xs text-ink-dull font-mono tracking-wide">
          {lang}
        </div>
      )}
      <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto bg-panel text-ink-dim">
        {children.trim()}
      </pre>
    </div>
  );
}

function Note({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info: { border: 'rgba(14,165,233,0.3)', bg: 'rgba(14,165,233,0.06)', icon: AlertCircle, color: '#0ea5e9' },
    warn: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.06)', icon: AlertCircle, color: '#f59e0b' },
    tip:  { border: 'rgba(56,161,105,0.3)', bg: 'rgba(56,161,105,0.06)', icon: CheckCircle2, color: '#38A169' },
  }[type];
  return (
    <div className="flex gap-3 rounded-xl p-4 my-4 text-sm"
      style={{ border: `1px solid ${styles.border}`, background: styles.bg }}>
      <styles.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: styles.color }} />
      <div className="text-ink-dim leading-relaxed">{children}</div>
    </div>
  );
}

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-2xl font-bold mt-12 mb-4 scroll-mt-24">{children}</h2>;
}
function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h3 id={id} className="text-lg font-semibold mt-8 mb-3 text-ink scroll-mt-24">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-dim leading-relaxed mb-4 text-[15px]">{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-ink-dim text-[15px] leading-relaxed mb-2">
      <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-ink-dull" />
      <span>{children}</span>
    </li>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function DocsPage() {
  const [active, setActive] = useState('getting-started');

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-dull mb-8">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/apps/swatchboost" className="hover:text-ink transition-colors">SwatchBoost</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink-dim">Documentation</span>
        </div>

        <div className="flex gap-10 lg:gap-16 relative">

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-4 h-4 text-ink-dull" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">SwatchBoost Docs</span>
              </div>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActive(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                    style={{
                      color: active === s.id ? '#C9A84C' : 'var(--_ink-dim)',
                      background: active === s.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}
                  >
                    <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {s.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-line-sub">
                <a
                  href="https://apps.shopify.com/swatchboost"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-lg transition-all"
                  style={{ background: '#C9A84C', color: '#000' }}
                >
                  Install App
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </a>
                <Link
                  href="/apps/swatchboost"
                  className="flex items-center gap-2 text-xs text-ink-dull hover:text-ink mt-2 px-3 py-2 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to overview
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0 max-w-3xl">

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="getting-started" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Getting Started</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/apps/swatchboost/logo.png"
                    alt="SwatchBoost"
                    width={48}
                    height={48}
                    className="rounded-xl"
                    style={{ display: 'block' }}
                  />
                  <h1 className="text-4xl font-bold">SwatchBoost Documentation</h1>
                </div>
                <P>SwatchBoost is a Shopify Theme App Extension that intercepts the Add to Cart action on product pages, shows a multi-colour picker popup, and automatically applies tiered bulk discounts — all with zero code and full RTL support.</P>

                <H3 id="overview">Overview</H3>
                <ul className="mb-6 space-y-1">
                  <Li>Works as a <strong>Shopify Theme App Extension</strong> — no theme code injection required</Li>
                  <Li>Variant data is <strong>server-rendered via Liquid</strong> — zero page speed impact</Li>
                  <Li>All intercepts (fetch, XHR, form submit) are set up client-side before the page is interactive</Li>
                  <Li>Config (branding, tiers, copy) is fetched from the app server at runtime and cached for 60 seconds</Li>
                  <Li>Fully compatible with Online Store 2.0 themes</Li>
                </ul>

                <H3 id="installation">Installation</H3>
                <P>Installing SwatchBoost takes under 5 minutes and requires no developer access.</P>

                <div className="space-y-4 mb-6">
                  {[
                    { step: 1, title: 'Install from the Shopify App Store', desc: <>Visit the <a href="https://apps.shopify.com/swatchboost" target="_blank" rel="noopener noreferrer" className="underline text-ink hover:text-ink-dim">SwatchBoost listing</a> and click <strong>Add app</strong>. Approve the permissions.</> },
                    { step: 2, title: 'Enable the App Embed', desc: <>In your Shopify admin go to <strong>Online Store → Themes → Customize → App embeds</strong>. Find <strong>SwatchBoost Popup</strong> and toggle it <strong>on</strong>. Click <strong>Save</strong>.</> },
                    { step: 3, title: 'Activate your first product', desc: <>In the SwatchBoost app, go to <strong>Products</strong> and click <strong>Activate</strong> next to any product that has a Colour option.</> },
                    { step: 4, title: 'Test on your storefront', desc: <>Open a product page and click <strong>Add to Cart</strong>. The SwatchBoost popup should appear.</> },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 p-5 rounded-xl border border-line bg-panel">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                        {item.step}
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1">{item.title}</p>
                        <p className="text-sm text-ink-dim leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Note type="tip">
                  <strong>Dev store?</strong> All Growth plan features are unlocked automatically for partner development stores — no billing required.
                </Note>

                <H3 id="quick-start">Quick Start Checklist</H3>
                <ul className="mb-4 space-y-1">
                  <Li>App installed and permissions approved</Li>
                  <Li>App Embed toggled on in theme editor and saved</Li>
                  <Li>At least one product activated in the Products tab</Li>
                  <Li>Product has a <Code>Color</Code> or <Code>Colour</Code> option with 2+ variants</Li>
                  <Li>Test on storefront: popup appears when clicking Add to Cart</Li>
                </ul>
              </motion.div>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="how-it-works" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>How It Works</span>
              </div>
              <H2>The Popup Flow</H2>
              <P>SwatchBoost intercepts the Add to Cart action using three strategies in order of reliability:</P>

              <ol className="space-y-3 mb-6 counter-none">
                <li className="flex gap-3 text-sm text-ink-dim">
                  <span className="font-mono text-ink-dull w-4 flex-shrink-0">1.</span>
                  <span><strong className="text-ink">fetch override</strong> — replaces <Code>window.fetch</Code> globally. When the theme posts to <Code>/cart/add.js</Code>, the override opens the popup and returns a fake 200 response so the theme UI does not break.</span>
                </li>
                <li className="flex gap-3 text-sm text-ink-dim">
                  <span className="font-mono text-ink-dull w-4 flex-shrink-0">2.</span>
                  <span><strong className="text-ink">Form submit listener</strong> — captures <Code>submit</Code> events on forms with <Code>action="/cart/add"</Code> or <Code>data-type="add-to-cart-form"</Code> at the document level (capture phase).</span>
                </li>
                <li className="flex gap-3 text-sm text-ink-dim">
                  <span className="font-mono text-ink-dull w-4 flex-shrink-0">3.</span>
                  <span><strong className="text-ink">Click listener</strong> — document-level capture listener that walks up the DOM from the clicked element looking for an Add to Cart button by name, class, or form context.</span>
                </li>
              </ol>

              <H3 id="colour-detection">Colour Detection</H3>
              <P>SwatchBoost detects your colour option automatically via Liquid on the server, so there is no client-side guessing. The liquid template reads <Code>product.options</Code> and finds the first option whose name matches:</P>
              <CodeBlock lang="Liquid">
{`color, colour, اللون, couleur, farbe`}
              </CodeBlock>
              <P>If no match is found, the first option is used. The variant data (IDs, prices, availability) is injected directly into the page as <Code>window.__SB_VARIANTS__</Code> — a JSON array available immediately when the script runs, before any fetch calls.</P>

              <H3 id="live-cart-sync">Live Cart Sync</H3>
              <P>When a customer taps a colour swatch in the popup:</P>
              <ul className="mb-4 space-y-1">
                <Li><strong>Selecting</strong> a colour makes a <Code>POST /cart/add.js</Code> request immediately. The swatch shows a spinner while the request is in flight.</Li>
                <Li><strong>Deselecting</strong> a colour calls <Code>POST /cart/change.js</Code> with quantity 0, removing just that variant from the cart.</Li>
                <Li>The cart is updated in real time — no page reload needed.</Li>
                <Li>The <strong>View Cart</strong> button updates to show the live colour count.</Li>
              </ul>

              <Note type="info">
                The pre-selected colour (the one the customer originally chose on the product page) is automatically added to cart when the popup opens.
              </Note>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="customizer" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Customizer</span>
              </div>
              <H2>Brand Themes</H2>
              <P>SwatchBoost ships with three ready-made brand presets. Select one in the <strong>Customizer</strong> tab of the app.</P>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { name: 'Premium Boutique', bg: '#FFFFFF', accent: '#C9A84C', font: 'Cormorant', desc: 'White, gold, serif — luxury fashion and accessories' },
                  { name: 'Bold & Energetic', bg: '#0F0F0F', accent: '#00E87A', font: 'Space Grotesk', desc: 'Dark background, green — streetwear, sports, tech' },
                  { name: 'Warm & Regional', bg: '#FAF7F2', accent: '#C4614A', font: 'Cairo', desc: 'Cream, terracotta — Middle East, regional boutiques, RTL stores' },
                ].map((t) => (
                  <div key={t.name} className="rounded-xl border border-line overflow-hidden">
                    <div className="h-20 flex items-center justify-center" style={{ background: t.bg }}>
                      <span className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: t.accent, color: t.bg === '#0F0F0F' ? '#000' : '#fff' }}>
                        Preview
                      </span>
                    </div>
                    <div className="p-4 bg-panel">
                      <p className="font-semibold text-sm mb-1">{t.name}</p>
                      <p className="text-xs text-ink-dull">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <H3 id="custom-copy">Custom Copy</H3>
              <P>On Starter and Growth plans you can customise every text string shown in the popup:</P>
              <ul className="mb-4 space-y-1">
                <Li><strong>Headline</strong> — main title inside the popup (e.g. "Style it in more than one.")</Li>
                <Li><strong>Subheadline</strong> — short supporting line (e.g. "Select colours — each adds to cart instantly.")</Li>
                <Li><strong>CTA text</strong> — the checkout button label</Li>
                <Li><strong>Max tier text</strong> — shown when the highest discount tier is reached</Li>
              </ul>

              <H3 id="discount-tiers">Discount Tiers</H3>
              <P>Default tiers are set globally in the Customizer. On Starter and Growth plans you can customise the minimum quantity and discount percentage for each tier.</P>
              <CodeBlock lang="Default tiers">
{`2 colours → 5% off
3 colours → 10% off
4+ colours → 15% off`}
              </CodeBlock>
              <Note type="warn">
                Tiers are informational in the popup. For the discount to actually apply at checkout you must set up <strong>Automatic Discounts</strong> in Shopify Admin — see the Discounts section below.
              </Note>

              <H3 id="accent-colour">Accent Colour</H3>
              <P>You can override the accent colour (used for progress bar, pill, swatch selection ring, and CTA) with any hex value. This is available on Starter and Growth plans.</P>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="rtl" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>RTL & Languages</span>
              </div>
              <H2>RTL & Arabic Support</H2>
              <P>SwatchBoost is the only colour-swatch upsell app verified to work natively in RTL languages. No other top-tier Shopify swatch app supports this.</P>

              <H3 id="how-rtl-works">How RTL Works</H3>
              <P>SwatchBoost detects the store language direction from the <Code>dir</Code> attribute on the <Code>&lt;html&gt;</Code> element. When <Code>dir="rtl"</Code> is set:</P>
              <ul className="mb-4 space-y-1">
                <Li>The popup panel mirrors horizontally — close button moves to the left, content reads right-to-left</Li>
                <Li>The progress bar fills from right to left</Li>
                <Li>Swatch check badges reposition to the correct corner</Li>
                <Li>The <strong>Warm & Regional</strong> brand preset uses <strong>Cairo</strong> font which renders Arabic text correctly</Li>
              </ul>

              <H3 id="arabic-setup">Arabic Setup</H3>
              <P>If your Shopify store serves Arabic (or any RTL language), follow these steps:</P>
              <div className="space-y-3 mb-6">
                {[
                  'In Shopify Admin → Online Store → Themes → Languages, add Arabic.',
                  'Ensure your theme sets dir="rtl" on the <html> element when Arabic is active. Most OS 2.0 themes do this automatically.',
                  'In SwatchBoost Customizer, select the Warm & Regional theme preset for optimal Arabic typography.',
                  'If your option names are in Arabic, add them to the colour detection list via the Products tab — contact support for custom option name mapping.',
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm text-ink-dim p-4 rounded-lg border border-line bg-panel">
                    <span className="font-mono text-ink-dull w-4 flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <H3 id="supported-languages">Supported Languages</H3>
              <P>The popup UI works in any language your store serves. The following RTL languages are explicitly tested:</P>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Arabic (العربية)', 'Hebrew (עברית)', 'Persian (فارسی)', 'Urdu (اردو)'].map((lang) => (
                  <span key={lang} className="px-3 py-1.5 rounded-full border border-line text-xs text-ink-dim bg-panel">
                    {lang}
                  </span>
                ))}
              </div>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="products" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Products</span>
              </div>
              <H2>Activating Products</H2>
              <P>SwatchBoost only activates on products you explicitly enable. This prevents the popup from appearing on products with non-colour variants (size, material, etc.).</P>
              <ol className="space-y-2 mb-6">
                <Li>Go to <strong>SwatchBoost app → Products tab</strong></Li>
                <Li>Your store's products are listed. Products with a <Code>Color</Code> / <Code>Colour</Code> option are highlighted</Li>
                <Li>Click <strong>Activate</strong> on any product to enable the popup</Li>
                <Li>Click <strong>Deactivate</strong> to disable it for that product</Li>
              </ol>

              <H3 id="colour-option-names">Colour Option Names</H3>
              <P>SwatchBoost automatically detects the colour option if it is named one of the following (case-insensitive):</P>
              <CodeBlock>
{`color, colour, اللون, couleur, farbe`}
              </CodeBlock>
              <P>If your store uses a different name (e.g. "Shade", "Hue", "Finish"), contact support and we will add it to your account's detection list.</P>

              <H3 id="multi-product">Products with 1 Colour Variant</H3>
              <Note type="info">
                If a product has only <strong>1</strong> colour variant, SwatchBoost will not activate on that product page — the popup requires at least 2 variants to show. The Add to Cart action passes through normally.
              </Note>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="discounts" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Discounts</span>
              </div>
              <H2>Automatic Discount Setup</H2>
              <P>SwatchBoost shows the savings to customers in the popup, but the actual discount must be created in Shopify Admin as an <strong>Automatic Discount</strong>. This is a one-time setup.</P>

              <div className="space-y-4 mb-8">
                {[
                  {
                    step: 1,
                    title: 'Go to Shopify Admin → Discounts → Create discount → Automatic discount',
                    body: 'Select "Amount off products" or "Buy X get Y" depending on your store setup.',
                  },
                  {
                    step: 2,
                    title: 'Configure a tier — example: 2 colours = 5% off',
                    body: 'Set "Minimum quantity of items" to 2, discount value to 5%, and target to "Specific products" (select the same products you activated in SwatchBoost).',
                  },
                  {
                    step: 3,
                    title: 'Repeat for each tier',
                    body: 'Create three automatic discounts — one for 2+, one for 3+, one for 4+ items. Shopify will apply the best applicable discount automatically.',
                  },
                  {
                    step: 4,
                    title: 'Test in your storefront',
                    body: 'Add 2+ colours via SwatchBoost, go to checkout, and verify the discount appears in the order summary.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-5 rounded-xl border border-line bg-panel">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-sm text-ink-dim">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Note type="warn">
                Shopify Plus merchants can use <strong>Shopify Scripts</strong> or <strong>Shopify Functions</strong> for more advanced discount stacking. Contact OY Labs for a custom implementation.
              </Note>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="plans" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Plans & Billing</span>
              </div>
              <H2>Plan Comparison</H2>

              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm border border-line rounded-xl overflow-hidden">
                  <thead>
                    <tr className="border-b border-line bg-elevated">
                      <th className="text-left p-4 text-ink-dim font-semibold">Feature</th>
                      <th className="text-center p-4 text-ink-dim font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold" style={{ color: '#C9A84C' }}>Starter</th>
                      <th className="text-center p-4 text-ink-dim font-semibold">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      ['Price', '$0', '$9.99/mo', '$24.99/mo'],
                      ['Free trial', '—', '7 days', '7 days'],
                      ['Products', '1', 'Up to 10', 'Unlimited'],
                      ['Default discount tiers', '✓', '✓', '✓'],
                      ['Custom discount tiers', '—', '✓', '✓'],
                      ['RTL support', '✓', '✓', '✓'],
                      ['Custom accent colour', '—', '✓', '✓'],
                      ['Custom popup copy', '—', '✓', '✓'],
                      ['Brand presets', '—', '2', 'All 3'],
                      ['Full custom branding', '—', '—', '✓'],
                      ['Analytics dashboard', '—', '—', '✓'],
                      ['Priority support', '—', '—', '✓'],
                    ].map(([feat, free, starter, growth]) => (
                      <tr key={feat} className="hover:bg-elevated transition-colors">
                        <td className="p-4 text-ink-dim">{feat}</td>
                        <td className="p-4 text-center text-ink-dull">{free}</td>
                        <td className="p-4 text-center text-ink">{starter}</td>
                        <td className="p-4 text-center text-ink-dim">{growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <H3 id="free-trial">Free Trial</H3>
              <P>All paid plans (Starter and Growth) include a <strong>7-day free trial</strong> on first install. You will not be charged until the trial ends. Cancel at any time from Shopify Admin → Apps → SwatchBoost → Cancel subscription.</P>

              <H3 id="dev-stores">Developer & Partner Stores</H3>
              <P>If you are installing SwatchBoost on a Shopify <strong>Partner development store</strong>, all Growth plan features are unlocked automatically at no charge. This allows full testing before presenting to clients.</P>
            </section>

            <div className="my-14 border-t border-line-sub" />

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section id="troubleshooting" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Troubleshooting</span>
              </div>
              <H2>Troubleshooting</H2>

              <H3 id="popup-not-showing">Popup not showing when clicking Add to Cart</H3>
              <ul className="mb-6 space-y-1">
                <Li>Confirm the App Embed is toggled <strong>on</strong> in your theme editor and the theme has been <strong>saved</strong></Li>
                <Li>Confirm the product is <strong>activated</strong> in the Products tab</Li>
                <Li>Confirm the product has a <Code>Color</Code> or <Code>Colour</Code> option with <strong>at least 2 available variants</strong></Li>
                <Li>Hard-refresh the product page (<Code>Cmd+Shift+R</Code> / <Code>Ctrl+Shift+R</Code>) to clear CDN cache</Li>
                <Li>Check the browser console for any JavaScript errors prefixed with <Code>[SwatchBoost]</Code></Li>
              </ul>

              <H3 id="discount-not-applied">Discount not applied at checkout</H3>
              <ul className="mb-6 space-y-1">
                <Li>Verify you have created <strong>Automatic Discounts</strong> in Shopify Admin → Discounts (see Discounts section)</Li>
                <Li>Ensure the automatic discount targets the same products activated in SwatchBoost</Li>
                <Li>Check the discount is <strong>active</strong> and not expired</Li>
                <Li>Test in a fresh browser session (not logged in as admin) — some admin-only discounts do not apply in preview mode</Li>
              </ul>

              <H3 id="rtl-issues">RTL layout issues</H3>
              <ul className="mb-6 space-y-1">
                <Li>Ensure your theme sets <Code>dir="rtl"</Code> on the <Code>&lt;html&gt;</Code> element when the RTL language is active</Li>
                <Li>Use the <strong>Warm & Regional</strong> brand preset for best Arabic typography</Li>
                <Li>If colour option names are in Arabic, contact support to add custom option name detection</Li>
              </ul>

              <Note type="info">
                Still stuck? Email <a href="mailto:hello@oylabs.co" className="underline text-ink hover:text-ink-dim">hello@oylabs.co</a> with your shop domain and a description of the issue. Growth plan customers receive priority response within 24 hours.
              </Note>
            </section>

            {/* ── Footer nav ── */}
            <div className="mt-16 pt-8 border-t border-line-sub flex items-center justify-between">
              <Link href="/apps/swatchboost"
                className="flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors">
                <ArrowLeft className="w-4 h-4" />
                SwatchBoost overview
              </Link>
              <a
                href="https://apps.shopify.com/swatchboost"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full font-semibold transition-all"
                style={{ background: '#C9A84C', color: '#000' }}
              >
                Install App
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
