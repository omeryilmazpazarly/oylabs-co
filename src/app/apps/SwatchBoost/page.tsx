'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Layers, Zap, Globe, Palette, BarChart2,
  Star, Check, ShoppingCart, Sparkles, ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EASE = [0.16, 1, 0.3, 1] as const;
function fadeUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE, delay } },
  };
}

/* ── Data ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'Intercepts Add to Cart',
    desc: 'When a customer clicks Add to Cart, SwatchBoost opens a sleek popup that lets them pick multiple colours without leaving the page.',
    accent: '#C9A84C',
  },
  {
    icon: Sparkles,
    title: 'Automatic Bulk Discounts',
    desc: 'Tiered discounts apply live as colours are added — 5% for 2, 10% for 3, 15% for 4+. Savings are shown in real time.',
    accent: '#38A169',
  },
  {
    icon: Globe,
    title: 'Native RTL & Arabic Support',
    desc: 'Full right-to-left layout — the only colour-swatch upsell app verified to work natively in Arabic, Hebrew, and other RTL languages.',
    accent: '#0ea5e9',
  },
  {
    icon: Palette,
    title: '3 Brand Preset Themes',
    desc: 'Premium Boutique, Bold & Energetic, and Warm & Regional — apply a full brand look in one click with no design skills needed.',
    accent: '#7c3aed',
  },
  {
    icon: Layers,
    title: 'Theme App Extension',
    desc: "Installed as a Shopify Theme App Extension — no code injection, no page speed impact, works with any theme right out of the box.",
    accent: '#f59e0b',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    desc: 'Track activated products, discount tiers, and multi-colour selections. Available on the Growth plan.',
    accent: '#10b981',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: 'forever',
    features: ['1 product', 'Default tiers (5/10/15%)', 'Basic colour swatches', 'RTL support'],
    cta: 'Install Free',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$9.99',
    sub: '/ 30 days',
    trial: '7-day free trial',
    features: ['Up to 10 products', 'Custom discount tiers', 'Custom accent colour', 'RTL support', 'Custom popup copy', '2 brand presets'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Growth',
    price: '$24.99',
    sub: '/ 30 days',
    trial: '7-day free trial',
    features: ['Unlimited products', 'Custom discount tiers', 'All 3 brand presets', 'Full custom branding', 'Custom popup copy', 'Analytics dashboard', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'Does it work with any Shopify theme?',
    a: 'Yes. SwatchBoost installs as a Theme App Extension and uses the standard Shopify App Embed system. It works with any Online Store 2.0 theme — Dawn, Debut, Prestige, Wokiee, and custom themes.',
  },
  {
    q: 'How does the bulk discount get applied at checkout?',
    a: 'SwatchBoost intercepts the Add to Cart action and adds each selected colour as a separate line item. You set up automatic discounts in Shopify Admin → Discounts, and Shopify applies them at checkout automatically.',
  },
  {
    q: 'Is there really no code needed?',
    a: 'None. Enable the SwatchBoost app embed in your theme editor (Online Store → Themes → Customize → App Embeds), toggle it on, and save. That is all.',
  },
  {
    q: 'What languages are supported?',
    a: 'English, Arabic, Hebrew, French, German, and any other language your Shopify storefront uses. RTL layout switches automatically when your store is set to a right-to-left language.',
  },
  {
    q: 'Is there a free trial on paid plans?',
    a: 'Yes — all paid plans include a 7-day free trial on first install. You will not be charged until the trial ends, and you can cancel at any time.',
  },
  {
    q: 'What is the difference between Starter and Growth?',
    a: 'Starter supports up to 10 products and includes 2 brand presets plus custom copy. Growth unlocks unlimited products, all 3 brand presets, full custom branding, and the analytics dashboard.',
  },
];

const REVIEWS = [
  { name: 'Layla Al-Rashid', store: 'Luban Pride', text: 'Finally an app that actually works in Arabic — the RTL layout is perfect and the discount popup looks beautiful.', stars: 5 },
  { name: 'Marcus Webb', store: 'Webb Apparel', text: 'Increased our AOV by 22% in the first week. Customers genuinely add more colours because they can see the discount unlocking in real time.', stars: 5 },
  { name: 'Sofia Karin', store: 'Nordik Threads', text: 'Setup took 4 minutes. The Premium Boutique theme matched our store perfectly without any CSS tweaking.', stars: 5 },
];

/* ── Component ─────────────────────────────────────────────────── */
export default function SwatchBoostPage() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--_grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--_grid-line) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Gold accent orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20">
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp(0)} className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border"
                style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C', background: 'rgba(201,168,76,0.06)' }}>
                Shopify App by OY Labs
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp(0.05)} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Sell more{' '}
              <span style={{ color: '#C9A84C' }}>colours.</span>
              <br />Automatically.
            </motion.h1>

            <motion.p variants={fadeUp(0.1)} className="text-lg sm:text-xl text-ink-dim leading-relaxed mb-10 max-w-2xl">
              SwatchBoost intercepts Add to Cart on Shopify product pages, shows a popup letting customers add multiple colour variants at once, and applies tiered bulk discounts automatically — 5%, 10%, 15% for 2, 3, or 4+ colours.
            </motion.p>

            <motion.div variants={fadeUp(0.15)} className="flex flex-wrap gap-4">
              <a
                href="https://apps.shopify.com/swatchboost"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all"
                style={{ background: '#C9A84C', color: '#000' }}
              >
                Add to Shopify — Free
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/apps/swatchboost/docs"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide border border-line text-ink-dim hover:text-ink hover:border-ink-dull transition-all"
              >
                Read the Docs
              </Link>
            </motion.div>

            {/* Mini social proof */}
            <motion.div variants={fadeUp(0.2)} className="flex items-center gap-4 mt-10 text-ink-dim text-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#C9A84C' }} />)}
              </div>
              <span>RTL-ready · Theme App Extension · 7-day free trial</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink-dull"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Three steps. Zero friction.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Customer chooses a colour', desc: 'They browse as normal — pick their favourite colour on your product page.' },
              { step: '02', title: 'Popup opens on Add to Cart', desc: 'SwatchBoost intercepts the button click and shows a colour picker with live discount tiers.' },
              { step: '03', title: 'Multiple colours, automatic savings', desc: 'Each colour tap adds instantly to cart. 2+ colours? Discount unlocks. Cart updates in real time.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl p-8 border border-line bg-panel"
              >
                <div className="text-5xl font-bold mb-4 tracking-tight"
                  style={{ color: 'rgba(201,168,76,0.25)' }}>{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-ink-dim text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything your store needs</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.55 }}
                className="group rounded-2xl p-6 border border-line bg-panel hover:border-ink-dull transition-colors"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.accent}18` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-ink-dim leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Competitor Edge Banner ── */}
      <section className="py-16 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-line p-8 sm:p-12"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 60%)' }}>
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              {[
                { label: 'No competitor combines', value: 'Popup + Discounts + RTL', note: 'Verified against top 3 Shopify swatch apps' },
                { label: 'Real-time savings preview', value: 'Live discount calculator', note: 'Shows exact £/$ saved as each colour is added' },
                { label: 'Unique to SwatchBoost', value: 'Arabic / RTL natively', note: 'Other swatch apps break in RTL — we do not' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-ink-dim uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xl font-bold mb-1" style={{ color: '#C9A84C' }}>{item.value}</p>
                  <p className="text-xs text-ink-dull">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-4"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Start free. Scale when ready.</h2>
            <p className="text-ink-dim">All paid plans include a 7-day free trial. No credit card required at install.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative rounded-2xl border p-8 flex flex-col"
                style={{
                  borderColor: plan.highlight ? '#C9A84C' : 'var(--_line)',
                  background: plan.highlight ? 'rgba(201,168,76,0.04)' : 'var(--_panel)',
                  boxShadow: plan.highlight ? '0 0 0 1px rgba(201,168,76,0.2)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase"
                    style={{ background: '#C9A84C', color: '#000' }}>
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="font-semibold text-lg mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-ink-dim">{plan.sub}</span>
                  </div>
                  {plan.trial && (
                    <p className="text-xs mt-1.5" style={{ color: '#C9A84C' }}>✦ {plan.trial}</p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-dim">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-ink-dim" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="https://apps.shopify.com/swatchboost"
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center py-3 rounded-xl font-semibold text-sm transition-all"
                  style={plan.highlight
                    ? { background: '#C9A84C', color: '#000' }
                    : { border: '1px solid var(--_line)', color: 'var(--_ink-dim)' }
                  }
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Merchants love it</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.55 }}
                className="rounded-2xl border border-line bg-panel p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(r.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#C9A84C' }} />
                  ))}
                </div>
                <p className="text-sm text-ink-dim leading-relaxed mb-4">"{r.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-ink-dull">{r.store}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Common questions</h2>
          </motion.div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}
                className="rounded-xl border border-line p-6"
              >
                <p className="font-semibold mb-2">{faq.q}</p>
                <p className="text-sm text-ink-dim leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Start selling in<br />
              <span style={{ color: '#C9A84C' }}>more colours</span> today.
            </h2>
            <p className="text-ink-dim mb-10 text-lg">Free to install. 7-day trial on paid plans. Works with any Shopify theme.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://apps.shopify.com/swatchboost"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm tracking-wide transition-all"
                style={{ background: '#C9A84C', color: '#000' }}
              >
                Add to Shopify — Free
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/apps/swatchboost/docs"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-sm tracking-wide border border-line text-ink-dim hover:text-ink hover:border-ink-dull transition-all"
              >
                Documentation
              </Link>
            </div>
            <p className="mt-8 text-xs text-ink-dull">
              A product by{' '}
              <Link href="/" className="text-ink-dim hover:text-ink transition-colors">OY Labs Ltd</Link>
              {' '}— built for Shopify merchants worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
