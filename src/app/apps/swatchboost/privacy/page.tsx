'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EASE = [0.16, 1, 0.3, 1] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3 text-ink">{title}</h2>
      <div className="text-ink-dim leading-relaxed space-y-3 text-[15px]">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span>/</span>
          <Link href="/apps/SwatchBoost" className="hover:text-ink transition-colors">SwatchBoost</Link>
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
              style={{ background: 'rgba(201,168,76,0.1)' }}>
              <Shield className="w-5 h-5" style={{ color: '#C9A84C' }} />
            </div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Privacy Policy</span>
          </div>

          <h1 className="text-4xl font-bold mb-2">SwatchBoost Privacy Policy</h1>
          <p className="text-ink-dull text-sm mb-10">
            Last updated: June 2026 · Operated by <strong className="text-ink-dim">OY Labs Ltd</strong>
          </p>

          <div className="rounded-2xl border border-line bg-panel p-6 mb-10 text-sm text-ink-dim">
            <strong className="text-ink">Summary:</strong> SwatchBoost does not collect, store, or process any personal data about your customers. We store only shop-level configuration data (colour swatches, discount tiers, brand settings) necessary to run the app. We never sell data to third parties.
          </div>

          <Section title="1. Who we are">
            <p>SwatchBoost is a Shopify application developed and operated by <strong className="text-ink">OY Labs Ltd</strong>, a software company registered in the United Kingdom.</p>
            <p>Contact: <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a></p>
            <p>Website: <a href="https://oylabs.co" className="text-ink hover:underline">https://oylabs.co</a></p>
          </Section>

          <Section title="2. What data we collect">
            <p>SwatchBoost collects and stores only the minimum data required to function:</p>
            <ul className="list-none space-y-2 pl-0">
              {[
                ['Shop domain', 'Your myshopify.com domain, used to identify your store and retrieve your configuration.'],
                ['Access tokens', 'Shopify OAuth access tokens, stored securely in our database to make authenticated API calls on your behalf.'],
                ['App configuration', 'Settings you configure in the app: colour themes, discount tier values, popup copy, accent colour, and which products are activated. This is shop-level data only.'],
              ].map(([field, desc]) => (
                <li key={field} className="flex gap-3 p-4 rounded-xl border border-line bg-elevated">
                  <span className="font-semibold text-ink w-36 flex-shrink-0">{field}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4"><strong className="text-ink">We do not collect:</strong> customer names, emails, addresses, payment information, order history, or any personally identifiable information about your store visitors.</p>
          </Section>

          <Section title="3. How we use data">
            <p>Data we collect is used solely to:</p>
            <ul className="space-y-1 pl-4">
              <li>— Serve the SwatchBoost popup to your store visitors</li>
              <li>— Apply your branding and discount settings to the popup</li>
              <li>— Authenticate API requests to Shopify on your behalf</li>
              <li>— Provide support when you contact us</li>
            </ul>
            <p>We do not use your data for advertising, profiling, or any purpose other than operating the application.</p>
          </Section>

          <Section title="4. Data sharing and third parties">
            <p>We do not sell, rent, or share your data with third parties except:</p>
            <ul className="space-y-1 pl-4">
              <li>— <strong className="text-ink">Shopify</strong> — all API calls go through Shopify's platform as required to operate a Shopify app.</li>
              <li>— <strong className="text-ink">Infrastructure providers</strong> — our servers run on Amazon Web Services (AWS EC2, US East). AWS does not have access to your application data.</li>
            </ul>
            <p>Both Shopify and AWS are bound by their own data processing agreements and privacy policies.</p>
          </Section>

          <Section title="5. Data retention">
            <p>We retain your configuration data for as long as you have SwatchBoost installed. When you uninstall the app:</p>
            <ul className="space-y-1 pl-4">
              <li>— All shop configuration data is automatically deleted within 24 hours via our <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>APP_UNINSTALLED</code> webhook handler.</li>
              <li>— OAuth access tokens are deleted immediately.</li>
              <li>— No residual data is retained after deletion.</li>
            </ul>
          </Section>

          <Section title="6. GDPR compliance">
            <p>For merchants and customers in the European Economic Area (EEA), we process data in compliance with the General Data Protection Regulation (GDPR).</p>
            <p><strong className="text-ink">Lawful basis:</strong> Processing is carried out under the legitimate interest of operating the application you have chosen to install.</p>
            <p><strong className="text-ink">Your rights:</strong> As a merchant, you have the right to access, correct, or request deletion of any data we hold about your store. Contact us at <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a>.</p>
            <p><strong className="text-ink">GDPR webhooks:</strong> SwatchBoost is registered with Shopify's mandatory GDPR webhooks (customers/data_request, customers/redact, shop/redact). Since we store no customer PII, data requests are acknowledged and no data is returned. Shop redact requests trigger immediate data deletion.</p>
          </Section>

          <Section title="7. Security">
            <p>We take reasonable technical and organisational measures to protect your data:</p>
            <ul className="space-y-1 pl-4">
              <li>— All data is transmitted over HTTPS/TLS</li>
              <li>— Shopify OAuth tokens are stored in a private PostgreSQL database not exposed to the public internet</li>
              <li>— Webhook payloads are verified using HMAC-SHA256 before processing</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            <p>SwatchBoost does not set cookies on your storefront. The Shopify admin interface may use cookies for session management — these are governed by Shopify's own privacy policy.</p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>We may update this Privacy Policy from time to time. Significant changes will be communicated via email to the store owner or displayed within the app. Continued use of SwatchBoost after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>For any privacy-related questions, data access requests, or concerns:</p>
            <div className="mt-3 p-5 rounded-xl border border-line bg-panel">
              <p><strong className="text-ink">OY Labs Ltd</strong></p>
              <p>Email: <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a></p>
              <p>Website: <a href="https://oylabs.co" className="text-ink hover:underline">https://oylabs.co</a></p>
            </div>
          </Section>

          <div className="mt-12 pt-8 border-t border-line-sub">
            <Link href="/apps/SwatchBoost"
              className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to SwatchBoost
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
