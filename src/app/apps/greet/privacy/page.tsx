'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CORAL = '#E8654A';
const EASE = [0.16, 1, 0.3, 1] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3 text-ink">{title}</h2>
      <div className="text-ink-dim leading-relaxed space-y-3 text-[15px]">{children}</div>
    </div>
  );
}

export default function GreetPrivacyPage() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span>/</span>
          <Link href="/apps/greet" className="hover:text-ink transition-colors">Greet</Link>
          <span>/</span>
          <span className="text-ink-dim">Privacy Policy</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${CORAL}1a` }}>
              <Shield className="w-5 h-5" style={{ color: CORAL }} />
            </div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Privacy Policy</span>
          </div>

          <h1 className="text-4xl font-bold mb-2">Greet Privacy Policy</h1>
          <p className="text-ink-dull text-sm mb-10">
            Last updated: June 2026 · Operated by <strong className="text-ink-dim">OY Labs Ltd</strong>
          </p>

          <div className="rounded-2xl border border-line bg-panel p-6 mb-10 text-sm text-ink-dim">
            <strong className="text-ink">Summary:</strong> Greet stores customer answers as Shopify customer metafields inside the merchant&rsquo;s own Shopify account. The only customer-linked data Greet keeps is anonymised submission analytics (a customer ID and timestamp). We never sell data to third parties.
          </div>

          <Section title="1. Who we are">
            <p>Greet is a Shopify application developed and operated by <strong className="text-ink">OY Labs Ltd</strong>.</p>
            <p>Contact: <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a></p>
            <p>Website: <a href="https://oylabs.co" className="text-ink hover:underline">https://oylabs.co</a></p>
          </Section>

          <Section title="2. Information we collect">
            <p>When a merchant installs Greet, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-ink">Store information</strong> — Shopify store domain, store owner email, and plan details.</li>
              <li><strong className="text-ink">App configuration</strong> — onboarding flow settings (steps, questions, design choices), stored as Shopify metaobjects inside the merchant&rsquo;s own Shopify account.</li>
              <li><strong className="text-ink">Submission analytics</strong> — anonymised aggregated data such as popup sessions, completion rates, and step drop-off. We store the Shopify customer ID and timestamp of each submission to power the analytics dashboard.</li>
            </ul>
            <p><strong className="text-ink">We do not store customer answers.</strong> All question responses are written directly to the customer&rsquo;s Shopify customer metafields, inside the merchant&rsquo;s own Shopify account, and never leave Shopify&rsquo;s infrastructure.</p>
          </Section>

          <Section title="3. How we use information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate and improve the app.</li>
              <li>To display completion analytics to merchants inside the Greet admin.</li>
              <li>To respond to support requests.</li>
            </ul>
            <p>We do not sell, rent, or share merchant or customer data with third parties for advertising purposes.</p>
          </Section>

          <Section title="4. Data storage and security">
            <p>App configuration and submission analytics are stored in a Cloudflare D1 database. Data is encrypted in transit (TLS 1.2+) and at rest. Access is restricted to authorised personnel only.</p>
          </Section>

          <Section title="5. Data retention">
            <p>Merchant data (flow configuration and analytics) is retained for as long as the app is installed. When a merchant uninstalls Greet, all associated data is deleted from our database within 48 hours. Customer metafield data remains in the merchant&rsquo;s Shopify account and is subject to Shopify&rsquo;s own data policies.</p>
          </Section>

          <Section title="6. GDPR and data subject rights">
            <p>We comply with Shopify&rsquo;s mandatory GDPR webhook requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-ink">Customer data request</strong> — we respond within 30 days. Customer answers live in the merchant&rsquo;s Shopify account; our analytics records contain only a customer ID and timestamp.</li>
              <li><strong className="text-ink">Customer data erasure</strong> — we delete all analytics records linked to a customer ID within 48 hours of a redact request.</li>
              <li><strong className="text-ink">Shop data erasure</strong> — we delete all data associated with a shop within 48 hours of an uninstall and redact webhook.</li>
            </ul>
          </Section>

          <Section title="7. Third-party services">
            <p>Greet runs on Cloudflare Workers for compute and database. We may optionally use a third-party AI API to power the flow-generator feature; prompt text is not stored or logged. No other third-party data processors receive merchant or customer data.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Greet is an embedded Shopify admin app. We do not set cookies on merchant storefronts. The embedded admin interface uses Shopify&rsquo;s App Bridge session tokens for authentication.</p>
          </Section>

          <Section title="9. Contact">
            <p>Questions about this policy or data requests: <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a> — OY Labs Ltd.</p>
          </Section>

          <Link href="/apps/greet" className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Greet
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
