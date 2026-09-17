import Link from 'next/link';
import { getClient } from '@/lib/auth/client-session';
import { GRACE_DAYS, TRIAL_DAYS } from '@/lib/billing/plans';
import Footer from '@/components/Footer';
import SectionAtmosphere from '@/components/effects/SectionAtmosphere';
import PricingPlans from './PricingPlans';

export const metadata = {
  title: 'Pricing — Messenger, Instagram & WhatsApp Integration — OY Labs',
  description: 'Simple per-channel pricing for connecting Facebook Messenger, Instagram Direct and WhatsApp to your inbox or CRM. 14-day free trial.',
  alternates: { canonical: 'https://oylabs.co/pricing' },
};

const FAQ = [
  { q: 'What counts as a channel?', a: 'A connected Facebook Page counts once, including the Instagram professional account linked to it. A connected WhatsApp number also counts once. Messages, conversations and team members are not limited.' },
  { q: 'Can I keep using WhatsApp on my phone?', a: 'Yes. Connect the number you already use in the WhatsApp Business app and it keeps working there; your contacts and recent chats come across, and replies you send from the phone appear in OY Labs too.' },
  { q: 'Does this include WhatsApp message fees?', a: 'No. Meta charges for WhatsApp messages under its own pricing, directly to the card you add in WhatsApp Manager. OY Labs does not mark those charges up. Messenger and Instagram messages have no Meta fee.' },
  { q: 'How does the free trial work?', a: `Every plan starts with a ${TRIAL_DAYS}-day free trial. We ask for a card through Stripe at sign-up and charge nothing until the trial ends. Cancel before then and you won't be charged.` },
  { q: 'Can I change or cancel my plan?', a: 'Yes. Upgrade, downgrade, switch between monthly and yearly, or cancel at any time from Billing in your account. Cancellation takes effect at the end of the period you have paid for.' },
  { q: 'What happens if a payment fails?', a: `Stripe retries the card automatically and we email you. The service keeps running for ${GRACE_DAYS} days. After that, delivering and replying pause, but incoming messages are still saved and delivered once billing is updated.` },
  { q: 'Do I need my own inbox or CRM?', a: 'No. You can read and reply in the OY Labs inbox, or forward every message to your own system with signed webhooks and send replies through our API.' },
  { q: 'How do you handle my customers’ data?', a: 'Access tokens are encrypted, messages are kept for 90 days and never used for advertising or sold. Card details are handled by Stripe; we never see them.' },
];

export default async function PricingPage() {
  const signedIn = Boolean((await getClient())?.workspace);
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        <SectionAtmosphere theme="services" showTopEdge={false} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-ink-dim">Pricing</span>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">Pay per channel. Everything else included.</h1>
            <p className="mt-5 text-base leading-relaxed text-ink-dim sm:text-lg">
              Connect your Facebook Page, Instagram account and WhatsApp number, answer customers from one inbox or your own CRM, and start with a {TRIAL_DAYS}-day free trial.
            </p>
          </div>
          <PricingPlans signedIn={signedIn} />
          <p className="mt-10 text-center text-sm text-ink-dim">
            Need more than 10 channels or a custom integration?{' '}<Link href="/tech-provider#contact" className="text-ink underline">Talk to us</Link>
          </p>
        </div>
      </section>

      <section className="border-t border-line-sub px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Questions</h2>
          <dl className="mt-8 divide-y divide-line-sub">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5">
                <dt className="text-base font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-ink-dim">
            Prices are in US dollars. By subscribing you agree to our{' '}<Link href="/terms#subscriptions" className="text-ink underline">Terms</Link>{' '}and{' '}<Link href="/privacy" className="text-ink underline">Privacy Policy</Link>.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
