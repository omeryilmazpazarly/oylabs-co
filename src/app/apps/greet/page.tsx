'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Layers, Zap, Globe, Palette, BarChart2,
  Star, Check, Users, Sparkles, ChevronDown, GitBranch,
  Webhook, FileSpreadsheet, MessageSquare,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CORAL = '#E8654A';
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
    icon: MessageSquare,
    title: 'Multi-step popup flow',
    desc: 'Break questions into steps with progress bars, dots, or step counters. Drag questions between steps — no code needed.',
    accent: CORAL,
  },
  {
    icon: Palette,
    title: '5 premium design templates',
    desc: 'Executive Dark, Friendly Bloom, Editorial Minimal, Aurora Glass, Retro Terminal. Pick one, tweak colours, done.',
    accent: '#a78bfa',
  },
  {
    icon: GitBranch,
    title: 'Conditional logic',
    desc: 'Show or hide questions based on previous answers. If skin type = "Dry", show moisturiser question. If not, skip it.',
    accent: '#0ea5e9',
  },
  {
    icon: Globe,
    title: 'Multi-language',
    desc: 'Translate every step, question, option, and label. Greet auto-serves the right language based on the customer\'s browser.',
    accent: '#10b981',
  },
  {
    icon: BarChart2,
    title: 'Built-in analytics',
    desc: 'Completion rate, step drop-off funnel, top answers per question. All inside the app — no third-party tools required.',
    accent: '#f59e0b',
  },
  {
    icon: Webhook,
    title: 'Webhook integrations',
    desc: 'Fire a webhook on completion. Plug into Zapier, Make, n8n, or Shopify Flow HTTP actions instantly.',
    accent: '#7c3aed',
  },
  {
    icon: Sparkles,
    title: 'AI flow generator',
    desc: 'Describe your store, pick a goal. AI generates a complete flow with questions, types, options, and metafield mappings.',
    accent: CORAL,
  },
  {
    icon: FileSpreadsheet,
    title: 'Bulk CSV import',
    desc: 'Paste from Excel or Google Sheets. Greet parses step titles, question labels, types, and options automatically.',
    accent: '#10b981',
  },
  {
    icon: Users,
    title: 'Shopify metafields — native',
    desc: 'Answers save directly as customer metafields. Read in Liquid, use in Flow automations, segment in Klaviyo — instantly.',
    accent: '#0ea5e9',
  },
];

const FAQS = [
  {
    q: 'Does the popup show to all visitors?',
    a: 'No. Greet only shows to logged-in customers who haven\'t completed the flow yet. Once completed, the popup never appears again.',
  },
  {
    q: 'Does it work with Shopify\'s New Customer Accounts (passwordless login)?',
    a: 'Yes. Greet detects the customer after login regardless of authentication method — fully compatible with both Legacy and New Customer Accounts.',
  },
  {
    q: 'How are answers stored?',
    a: 'Every answer is saved as a Shopify customer metafield. The data lives inside your Shopify account — not in a separate database. Read it in Liquid, use it in Flow, or segment in Klaviyo.',
  },
  {
    q: 'Is theme editing required?',
    a: 'No. Greet installs as a Shopify Theme App Extension. One toggle in Theme Editor → App Embeds and it\'s live on any page. No Liquid, no code, no developer.',
  },
  {
    q: 'How many questions can I have?',
    a: 'No hard limit. Shopify allows up to 200 customer metafield definitions per store — with typical flows of 5–15 questions, you\'ll never get close.',
  },
  {
    q: 'Can I translate the popup?',
    a: 'Yes — translate every step title, question label, placeholder, and option into any language enabled in your Shopify store. Greet serves the right language automatically.',
  },
];

const REVIEWS = [
  { name: 'Layla A.', store: 'Beauty Store', text: 'Set up in 10 minutes. Our customers love it — completion rate is 78%. The skin type data alone has transformed our email segmentation.', stars: 5 },
  { name: 'Marco F.', store: 'Supplement Brand', text: 'The AI generator built our entire 3-step flow in seconds. We just tweaked a couple of questions and it was live. Incredible.', stars: 5 },
  { name: 'Sara K.', store: 'Fashion Boutique', text: 'The Editorial Minimal template matches our brand perfectly. Finally an app that cares about design as much as we do.', stars: 5 },
];

/* ── Popup mock ─────────────────────────────────────────────────── */
function PopupMock() {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full max-w-xs mx-auto"
      style={{
        background: '#ffffff',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-line-sub">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-line-sub">
          <div className="h-full w-1/3 rounded-full" style={{ background: CORAL }} />
        </div>
        <span className="text-xs text-ink-dull">1 / 3</span>
        <span className="text-ink-dull text-base leading-none">✕</span>
      </div>
      {/* Body */}
      <div className="px-5 pt-5 pb-6">
        <p className="text-base font-bold mb-1 text-ink">Welcome, Sara 👋</p>
        <p className="text-xs text-ink-dim mb-5">Help us personalise your experience — 30 seconds.</p>
        <div className="space-y-2.5">
          {['Dry & sensitive', 'Oily & combination', 'Normal'].map((opt, i) => (
            <div
              key={opt}
              className="px-4 py-3 rounded-xl text-sm border"
              style={i === 0
                ? { borderColor: CORAL, background: `${CORAL}14`, color: CORAL, fontWeight: 600 }
                : { borderColor: '#e5e7eb', color: '#374151' }
              }
            >
              {i === 0 && '✓ '}{opt}
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="px-5 pb-5 flex justify-end">
        <div
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: CORAL }}
        >
          Continue →
        </div>
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────── */
export default function GreetPage() {
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
        {/* Coral orb */}
        <div
          className="absolute top-1/3 right-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${CORAL}0d 0%, transparent 70%)` }}
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial="hidden" animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
            >
              <motion.div variants={fadeUp(0)} className="flex items-center gap-2 mb-6">
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase border"
                  style={{ borderColor: `${CORAL}66`, color: CORAL, background: `${CORAL}0d` }}
                >
                  Shopify App by OY Labs
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp(0.05)}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              >
                Greet every{' '}
                <span style={{ color: CORAL }}>customer.</span>
                <br />Know them better.
              </motion.h1>

              <motion.p
                variants={fadeUp(0.1)}
                className="text-lg sm:text-xl text-ink-dim leading-relaxed mb-10 max-w-xl"
              >
                A beautiful multi-step onboarding popup that collects customer preferences and saves them directly to Shopify customer profiles — zero code, zero friction.
              </motion.p>

              <motion.div variants={fadeUp(0.15)} className="flex flex-wrap gap-4">
                <a
                  href="https://apps.shopify.com/greet"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-all text-white"
                  style={{ background: CORAL }}
                >
                  Add to Shopify — Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/apps/greet/docs"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide border border-line text-ink-dim hover:text-ink hover:border-ink-dull transition-all"
                >
                  Read the Docs
                </Link>
              </motion.div>

              <motion.div variants={fadeUp(0.2)} className="flex items-center gap-4 mt-10 text-ink-dim text-sm">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: CORAL }} />
                  ))}
                </div>
                <span>Theme App Extension · No code · Zero-party data</span>
              </motion.div>
            </motion.div>

            {/* Right — popup preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div
                className="w-full max-w-sm mx-auto p-8 rounded-3xl"
                style={{ background: 'rgba(232,101,74,0.05)', border: '1px solid rgba(232,101,74,0.12)' }}
              >
                <PopupMock />
              </div>
            </motion.div>
          </div>
        </div>

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
            <h2 className="text-3xl sm:text-4xl font-bold">From install to insights in 5 minutes.</h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Build your flow', desc: 'Create steps and questions in the Greet admin. Use AI to generate a full flow, or import from CSV.' },
              { step: '02', title: 'Enable App Embed', desc: 'One toggle in Theme Editor → App Embeds. No Liquid, no code, no developer required.' },
              { step: '03', title: 'Customers see it', desc: 'Logged-in customers who haven\'t completed the flow see the popup — once, on any page.' },
              { step: '04', title: 'Data saves to Shopify', desc: 'Answers go directly to Shopify customer metafields. Use in Liquid, Flow, email, immediately.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl p-8 border border-line bg-panel"
              >
                <div className="text-5xl font-bold mb-4 tracking-tight" style={{ color: `${CORAL}30` }}>
                  {item.step}
                </div>
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
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need.<br />Nothing you don't.</h2>
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

      {/* ── Differentiators ── */}
      <section className="py-16 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl border border-line p-8 sm:p-12"
            style={{ background: `linear-gradient(135deg, ${CORAL}08 0%, transparent 60%)` }}
          >
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              {[
                { label: 'Unlike registration forms', value: 'Works after login', note: 'Captures data when customers are engaged — not during a friction-heavy signup' },
                { label: 'Unlike other onboarding apps', value: '5 premium design templates', note: 'Beautiful out of the box — no CSS, no designer, no compromises' },
                { label: 'Unique to Greet', value: 'Conditional logic + AI', note: 'Smart flows that adapt to answers, built in seconds with AI' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-ink-dim uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xl font-bold mb-1" style={{ color: CORAL }}>{item.value}</p>
                  <p className="text-xs text-ink-dull">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metafields code snippet ── */}
      <section className="py-28 px-6 border-t border-line-sub">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">Customer Data</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Data that lives<br />inside Shopify.</h2>
              <p className="text-ink-dim mb-8 leading-relaxed">Every answer is saved as a Shopify customer metafield — not in a separate database. Use it anywhere Shopify data can go.</p>
              <ul className="space-y-4">
                {[
                  { title: 'Liquid templates', desc: '{{ customer.metafields.customer_profile.skin_type.value }}' },
                  { title: 'Shopify Flow automations', desc: 'Trigger emails, apply tags, send discounts when onboarding completes' },
                  { title: 'Email marketing', desc: 'Klaviyo, Omnisend, and others sync Shopify metafields automatically' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3 items-start">
                    <Check className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: CORAL }} />
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-ink-dull mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="rounded-xl border border-line overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-panel">
                  <div className="w-2.5 h-2.5 rounded-full bg-line" />
                  <div className="w-2.5 h-2.5 rounded-full bg-line" />
                  <div className="w-2.5 h-2.5 rounded-full bg-line" />
                  <span className="text-xs text-ink-dull ml-2 font-mono">theme.liquid</span>
                </div>
                <pre className="p-6 text-xs font-mono leading-relaxed overflow-x-auto bg-page" style={{ color: '#67e8f9' }}>
{`{%- assign skin =
    customer.metafields
    .customer_profile
    .skin_type.value -%}

{%- if skin == "Dry" -%}
  {%- comment -%}
    Show dry-skin products
  {%- endcomment -%}
{%- elsif skin == "Oily" -%}
  {%- comment -%}
    Show oil-control range
  {%- endcomment -%}
{%- endif -%}

{%- assign done =
    customer.metafields
    .tafseel_onboarding
    .completed.value -%}`}
                </pre>
              </div>
            </motion.div>
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
                    <Star key={j} className="w-4 h-4 fill-current" style={{ color: CORAL }} />
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
              Start greeting your<br />
              <span style={{ color: CORAL }}>customers</span> today.
            </h2>
            <p className="text-ink-dim mb-10 text-lg">Free to install. Works with any Shopify theme. No code required.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://apps.shopify.com/greet"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm tracking-wide text-white transition-all"
                style={{ background: CORAL }}
              >
                Add to Shopify — Free
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/apps/greet/docs"
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
