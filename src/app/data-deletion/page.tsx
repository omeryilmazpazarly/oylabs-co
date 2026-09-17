import type { Metadata } from 'next';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Data Deletion — OY Labs',
  description:
    'How to ask OY Labs Ltd to delete data from our Messenger and Instagram messaging integration, and how to check the status of a deletion request.',
  alternates: { canonical: '/data-deletion' },
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

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-ink font-semibold">{children}</strong>;
}

const Email = () => (
  <a href="mailto:hi@oylabs.co" className={linkCls}>
    hi@oylabs.co
  </a>
);

export default function DataDeletionPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span aria-hidden>/</span>
          <span className="text-ink-dim">Data Deletion</span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink">
            <Trash2 className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Data Deletion</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Data deletion instructions</h1>
        <p className="text-ink-dull text-sm mb-10">
          OY Labs Ltd · Messenger and Instagram messaging integration
        </p>

        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 mb-12 text-sm text-ink-dim leading-relaxed">
          <Strong>Summary.</Strong>{' '}If you connected a Facebook Page to OY Labs, remove our app in your Facebook
          settings and we delete your data automatically. If you messaged a business that uses OY Labs, email{' '}
          <Email /> and we delete your messages within 30 days.
        </div>

        <Section id="connected-a-page" title="1. If you connected a Page with Facebook Login">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Open Facebook Settings → <Strong>Business Integrations</Strong>, or Meta Business Suite → Business
              settings → Integrations → <Strong>Connected apps</Strong>.
            </li>
            <li>Find OY Labs and remove it.</li>
            <li>
              Meta sends us a data deletion request automatically. We delete the access tokens and all conversation
              data stored for the Pages you connected.
            </li>
            <li>You receive a confirmation code, which you can use below to check the status of your request.</li>
          </ol>
          <p>
            You can also ask us to disconnect and delete your data by emailing <Email />.
          </p>
        </Section>

        <Section id="messaged-a-business" title="2. If you messaged a business that uses OY Labs">
          <p>Email <Email /> with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>the name of the business you messaged; and</li>
            <li>your Facebook or Instagram name.</li>
          </ul>
          <p>
            We verify the request, delete your messages within 30 days, and tell the business so it can remove its own
            copy. The business controls its own inbox, so you can also contact it directly.
          </p>
        </Section>

        <Section id="what-is-deleted" title="3. What gets deleted">
          <ul className="list-disc pl-5 space-y-2">
            <li>Access tokens for the connected Page and Instagram professional account.</li>
            <li>
              Messages, attachment links, Page-scoped and Instagram-scoped IDs, and profile names and pictures we hold
              for those conversations.
            </li>
          </ul>
          <p>
            Raw webhook event records and delivery logs expire on their own after 14 and 30 days.{' '}
            We keep a short record of the request itself (confirmation code, date and status, with no message content)
            for 12 months so we can show it was completed. Even without a request, messages we hold are deleted
            automatically 90 days after they were received or sent.
          </p>
        </Section>

        <Section id="timeline" title="4. Timeline">
          <p>
            Access tokens are deleted immediately when we receive a deletion request from Meta. Requests sent to us by
            email are completed within 30 days. We respond to all data protection requests within one month.
          </p>
        </Section>

        <Section id="status" title="5. Check the status of a request">
          <p>
            When Meta sends us a deletion request, we return a confirmation code. Enter it below, or visit{' '}
            <span className="text-ink break-all">https://oylabs.co/data-deletion/status?code=YOUR_CODE</span>.
          </p>
          <form
            action="/data-deletion/status"
            method="get"
            className="rounded-2xl border border-line bg-panel p-5 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="flex-1 min-w-0">
              <label htmlFor="code" className="block text-xs text-ink-dim tracking-widest uppercase mb-2">
                Confirmation code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-input border border-line rounded-lg px-4 py-3 text-sm text-ink font-mono placeholder-ink-dull focus:outline-none focus:border-line-hi transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-opacity"
            >
              Check status
            </button>
          </form>
        </Section>

        <Section id="contact" title="6. Contact">
          <p>
            Questions about deletion or your data: <Email />. OY Labs Ltd, 71-75 Shelton Street, Covent Garden,
            London, WC2H 9JQ, United Kingdom. See also our{' '}
            <Link href="/privacy" className={linkCls}>Privacy Policy</Link>{' '}and{' '}
            <Link href="/terms" className={linkCls}>Terms of Service</Link>.
          </p>
        </Section>
      </div>

      <Footer />
    </>
  );
}
