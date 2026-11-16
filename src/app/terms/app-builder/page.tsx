import type { Metadata } from 'next';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';
import Footer from '@/components/Footer';
import { APP_PLANS, SETUP_ADDON_USD } from '@/lib/apps/plans';

export const metadata: Metadata = {
  title: 'App Builder Terms — OY Labs',
  description: 'Terms for the OY Labs Shopify App Builder: plans, refunds, developer accounts, publishing and your data.',
  alternates: { canonical: '/terms/app-builder' },
};

const linkCls = 'text-ink underline underline-offset-4 decoration-line-hi hover:decoration-ink transition-colors';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-28">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-ink tracking-tight">{title}</h2>
      <div className="text-ink-dim leading-relaxed space-y-4 text-[15px]">{children}</div>
    </section>
  );
}

const Strong = ({ children }: { children: React.ReactNode }) => <strong className="text-ink font-semibold">{children}</strong>;
const Email = () => <a href="mailto:hi@oylabs.co" className={linkCls}>hi@oylabs.co</a>;

export default function AppBuilderTermsPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span aria-hidden>/</span>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          <span aria-hidden>/</span>
          <span className="text-ink-dim">App Builder</span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink">
            <Smartphone className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">App Builder</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">App Builder terms</h1>
        <p className="text-ink-dull text-sm mb-10">Last updated: 16 November 2026 · <span className="text-ink-dim">OY Labs Ltd</span></p>

        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 mb-12 text-sm text-ink-dim leading-relaxed">
          <Strong>Summary.</Strong>{' '}We build and run a mobile app for your Shopify store for a monthly fee. The app is
          published under your own Google Play and Apple developer accounts, which you open and pay for yourself. You can
          cancel any time; the app keeps working until the end of the month you paid for. These terms add to our{' '}
          <Link href="/terms" className={linkCls}>general Terms of Service</Link> and{' '}
          <Link href="/privacy" className={linkCls}>Privacy Policy</Link>; where they differ, these terms apply to the App Builder.
        </div>

        <Section id="service" title="1. The service">
          <p>
            The OY Labs App Builder (&ldquo;App Builder&rdquo;) turns your Shopify store into an Android and iPhone shopping
            app (&ldquo;your app&rdquo;). We provide the app, the dashboard where you change its design and content, app
            builds for the stores, and hosting for its settings. Products, prices, stock, checkout and orders stay in your
            Shopify store; payments are taken by Shopify&rsquo;s own checkout.
          </p>
          <p>You need an active Shopify store and must keep the connection between your store and the App Builder in place for the app to work.</p>
        </Section>

        <Section id="accounts" title="2. Developer accounts are your responsibility">
          <p>
            Your app is published under your own name. To publish it you must open and pay for your own developer
            accounts: a <Strong>Google Play Console</Strong> account (Google charges a one-time fee, currently US$25) and an{' '}
            <Strong>Apple Developer Program</Strong> membership (Apple charges an annual fee, currently US$99). These fees
            are paid by you directly to Google and Apple. They are not part of our plans and we do not refund them.
          </p>
          <p>
            You are responsible for opening these accounts, verifying your identity or business with Google and Apple,
            keeping the memberships active and following their policies. Apple requires apps built from a template service
            such as ours to be published from the account of the business whose products the app sells.
          </p>
          <p>
            We will answer your questions and guide you if something goes wrong while you upload your app. We do not take
            over or own your developer accounts, and we are not responsible for decisions Google or Apple make about them.
          </p>
        </Section>

        <Section id="publishing" title="3. Publishing and store review">
          <p>
            Google and Apple review every new app and every update before it goes live. Review usually takes a few days but
            is outside our control. We prepare your app to meet their published guidelines, but we cannot guarantee that
            either store accepts or keeps your app. If a store rejects your app, we will help you fix the reasons we are
            able to fix.
          </p>
          <p>You are responsible for the content of your store and app (products, images, texts, policies) and for having the rights to use it.</p>
        </Section>

        <Section id="setup" title={`4. Done-for-you setup (US$${SETUP_ADDON_USD})`}>
          <p>
            The optional one-time done-for-you setup covers: connecting your store, setting up your app&rsquo;s design from
            your brand, preparing the store listings, and uploading your app to Google Play and the App Store{' '}
            <Strong>using the developer accounts you created and paid for</Strong>. To do this, you give us access to those
            accounts (for example by inviting us as a user), which you can remove at any time.
          </p>
          <p>We contact you after payment. Work starts once we have the access and materials we need from you.</p>
        </Section>

        <Section id="plans" title="5. Plans, billing and cancellation">
          <p>
            Plans are billed monthly in advance in US dollars by card through Stripe:{' '}
            {APP_PLANS.map((p, i) => (
              <span key={p.id}>{i ? ', ' : ''}{p.name} US${p.monthlyUsd}</span>
            ))}{' '}
            per month. Prices exclude any taxes that apply.
          </p>
          <p>
            You can cancel any time from your dashboard. Cancellation takes effect at the end of the month you have paid
            for. After that the app stops loading your store&rsquo;s content and we may stop sending updates to the stores.
            If a payment fails, Stripe retries it; if it still cannot be collected, the app may be paused until it is paid.
          </p>
        </Section>

        <Section id="refunds" title="6. Refunds">
          <ul className="list-disc pl-5 space-y-2">
            <li><Strong>Monthly plans:</Strong> not refunded for the month already started, except where the law requires it.</li>
            <li><Strong>Done-for-you setup:</Strong> fully refunded if you ask before we start the work. Once we have started, it is not refundable.</li>
            <li><Strong>Google and Apple fees:</Strong> paid to them, not to us, so we cannot refund them.</li>
          </ul>
          <p>To ask for a refund, email <Email /> from the address on your account.</p>
        </Section>

        <Section id="data" title="7. Your data and your shoppers' data">
          <p>
            We read your store&rsquo;s public catalogue and the settings you save. Shoppers&rsquo; accounts, carts, orders
            and payments are handled by Shopify. The app may store a device identifier for push notifications and, if you
            turn on analytics, anonymous shopping events. We process this data on your behalf as described in our{' '}
            <Link href="/privacy" className={linkCls}>Privacy Policy</Link>. Your app needs its own privacy policy for shoppers, which you are responsible for publishing in your store.
          </p>
        </Section>

        <Section id="contact" title="8. Contact">
          <p>Questions about these terms: <Email />. OY Labs Ltd, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.</p>
        </Section>
      </div>
      <Footer />
    </>
  );
}
