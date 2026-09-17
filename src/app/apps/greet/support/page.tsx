'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, Mail, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CORAL = '#E8654A';
const EASE = [0.16, 1, 0.3, 1] as const;

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2 text-ink">{q}</h2>
      <div className="text-ink-dim leading-relaxed space-y-2 text-[15px]">{children}</div>
    </div>
  );
}

export default function GreetSupportPage() {
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
          <span className="text-ink-dim">Support</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${CORAL}1a` }}>
              <LifeBuoy className="w-5 h-5" style={{ color: CORAL }} />
            </div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Support</span>
          </div>

          <h1 className="text-4xl font-bold mb-2">Greet Support</h1>
          <p className="text-ink-dull text-sm mb-10">
            We&rsquo;re here to help. Reach us by email or browse the common questions below.
          </p>

          {/* Contact cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <a href="mailto:hello@oylabs.co"
              className="rounded-2xl border border-line bg-panel p-5 hover:border-line-hi transition-colors group">
              <Mail className="w-5 h-5 mb-3" style={{ color: CORAL }} />
              <h3 className="font-semibold text-ink mb-1">Email support</h3>
              <p className="text-sm text-ink-dim">hello@oylabs.co — we reply within one business day.</p>
            </a>
            <Link href="/apps/greet/docs"
              className="rounded-2xl border border-line bg-panel p-5 hover:border-line-hi transition-colors group">
              <BookOpen className="w-5 h-5 mb-3" style={{ color: CORAL }} />
              <h3 className="font-semibold text-ink mb-1">Documentation</h3>
              <p className="text-sm text-ink-dim">Setup guide, feature reference, and FAQ.</p>
            </Link>
          </div>

          <h2 className="text-2xl font-bold mb-6">Common questions</h2>

          <FAQ q="The popup isn't showing on my storefront">
            <p>The most common cause is that the App Embed is not turned on. In the Greet admin, find the &ldquo;Enable the App Embed&rdquo; banner at the top of the Questions page and follow the steps to open your Theme Editor and toggle Greet on.</p>
          </FAQ>

          <FAQ q="Answers aren't saving to customer profiles">
            <p>Make sure the app has the write_customers and write_metaobjects permissions. Check under Settings &rarr; Apps in your Shopify admin and review the permissions Greet has requested.</p>
          </FAQ>

          <FAQ q="The popup shows to the same customer more than once">
            <p>The popup stops showing once a completion flag is written to the customer&rsquo;s metafields. If you recently reset the app or cleared metafields manually, that flag may have been removed, so the popup will show once more and then stop.</p>
          </FAQ>

          <FAQ q="I want to reset a customer's onboarding">
            <p>Open the customer&rsquo;s profile in your Shopify admin, scroll to Metafields, and delete the onboarding completion metafield. The next time they visit your store the popup will appear again.</p>
          </FAQ>

          <FAQ q="How do I use the data in email marketing?">
            <p>Because answers are stored as Shopify customer metafields, they sync automatically to Klaviyo and most email platforms via the Shopify integration. Use them as profile properties in your email templates.</p>
          </FAQ>

          <Link href="/apps/greet" className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-ink transition-colors mt-4">
            <ArrowLeft className="w-4 h-4" /> Back to Greet
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
