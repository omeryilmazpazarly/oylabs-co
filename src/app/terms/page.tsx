import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — OY Labs',
  description:
    'The terms that apply to the OY Labs Messenger and Instagram messaging integration and to the oylabs.co website.',
  alternates: { canonical: '/terms' },
};

/* ── Building blocks ─────────────────────────────────────────────────── */

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

/* ── Page ────────────────────────────────────────────────────────────── */

export default function TermsPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span aria-hidden>/</span>
          <span className="text-ink-dim">Terms of Service</span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink">
            <ScrollText className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Terms of Service</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Terms of Service</h1>
        <p className="text-ink-dull text-sm mb-10">
          Last updated: 17 September 2026 · <span className="text-ink-dim">OY Labs Ltd</span>
        </p>

        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 mb-12 text-sm text-ink-dim leading-relaxed">
          <Strong>Summary.</Strong> These terms apply to our Messenger and Instagram messaging integration and to
          our website. You must have authority over any Page or account you connect and follow Meta&rsquo;s rules
          when messaging your customers. We process your customer conversations only on your behalf, keep them for
          no more than 90 days, and delete your access tokens as soon as you disconnect. These terms are governed by
          the law of England and Wales.
        </div>

        <Section id="parties" title="1. About these terms">
          <p>
            These terms are an agreement between <Strong>OY Labs Ltd</Strong> (&ldquo;OY Labs&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;), a company registered in England and Wales whose registered address is
            71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom, and:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              the business that uses our messaging integration (&ldquo;Client&rdquo;, &ldquo;you&rdquo;), including
              anyone who connects a Page or account on the Client&rsquo;s behalf; and
            </li>
            <li>anyone who visits or uses the oylabs.co website, for the parts of these terms that apply to the website.</li>
          </ul>
          <p>
            If you accept these terms on behalf of a business, you confirm that you are authorised to bind that
            business. Where a Client has signed an order, proposal or other written agreement with us, that document
            forms part of our agreement and takes priority over these terms if the two conflict.
          </p>
        </Section>

        <Section id="service" title="2. The service">
          <p>
            Our messaging integration connects a Client&rsquo;s Facebook Page, and the Instagram professional account
            linked to that Page, to the Client&rsquo;s own customer inbox or CRM. When customers message the Page on
            Messenger or the Instagram account in Direct, we receive those messages from Meta and deliver them to the
            Client&rsquo;s system. When the Client&rsquo;s staff reply, we send those replies back through Meta.
          </p>
          <p>
            To set up the service, we create a workspace for the Client and send a secure, single-use connect link
            that expires after 7 days. An admin of the Client&rsquo;s Facebook Page uses the link to sign in with
            Facebook Login for Business and grant the permissions described on our{' '}
            <Link href="/tech-provider" className={linkCls}>Messaging Integration page</Link>.
          </p>
          <p>
            We may improve or change the service over time. If a change materially reduces what the service does, we
            will give the Client reasonable notice.
          </p>
        </Section>

        <Section id="client-responsibilities" title="3. Your responsibilities">
          <p>As a Client, you agree that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              you own, or are authorised to manage, every Facebook Page and Instagram professional account you
              connect, and the person who connects it is an admin of that Page with authority to act for you;
            </li>
            <li>
              you will comply with the Meta Platform Terms, Meta&rsquo;s Developer Policies, the Messenger Platform
              and Instagram messaging policies, and any other Meta rules that apply to your use of Messenger and
              Instagram;
            </li>
            <li>
              you will respect Meta&rsquo;s messaging windows, including the 24-hour standard messaging window, and
              only send messages outside that window where Meta&rsquo;s rules allow it;
            </li>
            <li>
              you have a lawful basis under applicable data protection law for messaging your customers and for
              handling their conversations in your own systems, and you will give them any privacy information the law
              requires;
            </li>
            <li>you will not use the service to send spam, unsolicited bulk messages or promotional messages that Meta&rsquo;s rules do not permit;</li>
            <li>
              you will keep your API keys, signing secrets and console credentials confidential, limit access to
              authorised staff, and tell us promptly at <Email /> if you believe they have been compromised; and
            </li>
            <li>you are responsible for the content of the messages you send and for how your staff use the service.</li>
          </ul>
        </Section>

        <Section id="our-responsibilities" title="4. Our responsibilities">
          <p>We will:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>provide the service with reasonable skill and care;</li>
            <li>use the access you grant only to deliver messages between you and your customers;</li>
            <li>request only the Meta permissions the service needs, and explain why we need each one;</li>
            <li>keep your data secure and confidential, as described in section 6 and our Privacy Policy;</li>
            <li>stop processing and delete your access tokens when you disconnect; and</li>
            <li>respond to support and data protection requests sent to <Email />.</li>
          </ul>
        </Section>

        <Section id="acceptable-use" title="5. Acceptable use">
          <p>You must not use the service or our website to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>break any law or regulation, or infringe anyone&rsquo;s rights;</li>
            <li>send spam, harassment, threats, hateful content, or misleading or fraudulent messages;</li>
            <li>send malware or content designed to harm devices or systems;</li>
            <li>connect a Page or account you are not authorised to manage;</li>
            <li>
              try to gain unauthorised access to the service, other clients&rsquo; data or our systems, or interfere
              with their security or operation;
            </li>
            <li>reverse engineer, resell or sublicense the service without our written agreement; or</li>
            <li>use the service in a way that would cause us or you to breach Meta&rsquo;s terms or policies.</li>
          </ul>
        </Section>

        <Section id="data-protection" title="6. Data protection">
          <p>
            For the conversations between you and your customers, <Strong>you are the controller</Strong> and{' '}
            <Strong>OY Labs is your processor</Strong>. We process that data only on your documented instructions,
            which are to deliver messages between you and your customers, send your replies and show conversations to
            your authorised staff. We will sign a data processing agreement with you on request.
          </p>
          <p>In summary:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              access tokens are encrypted at rest with AES-256-GCM and deleted immediately when you disconnect, when
              the service ends, or on a deletion request;
            </li>
            <li>
              messages, attachment links and profile names and pictures we hold are deleted automatically 90 days after
              they were received or sent (your own inbox keeps its copy under your policy);
            </li>
            <li>raw webhook event records are kept for 14 days and delivery logs for 30 days;</li>
            <li>
              every Meta webhook is verified, every delivery to your system is signed with HMAC-SHA256, and message
              content is never written to application logs; and
            </li>
            <li>
              we never sell your data or use it for advertising, profiling or training AI models, and we use only the
              sub-processors listed in our Privacy Policy.
            </li>
          </ul>
          <p>
            Full details are in our <Link href="/privacy" className={linkCls}>Privacy Policy</Link>. For our own
            website, contact form and account data, OY Labs is the controller.
          </p>
        </Section>

        <Section id="availability" title="7. Availability">
          <p>
            We use reasonable efforts to keep the service available and to fix problems promptly, but we do not
            guarantee that it will be uninterrupted or error-free. The service depends on Meta&rsquo;s platform and
            APIs, and on your own systems being available to receive deliveries. We are not responsible for outages,
            delays, rate limits, policy changes, or changes to or withdrawal of Meta features that are outside our
            control. We may carry out maintenance, and will try to do so in a way that keeps disruption to a minimum.
          </p>
        </Section>

        <Section id="fees" title="8. Fees">
          <p>
            Fees, billing periods and payment terms are as set out in the order or proposal agreed between the Client
            and OY Labs. We will not charge for the service other than as agreed in that order or proposal.
          </p>
        </Section>

        <Section id="termination" title="9. Suspension and termination">
          <p>
            You can stop using the service at any time by asking us at <Email />, using Disconnect in the console, or
            removing the app in Facebook Settings → Business Integrations (or Meta Business Suite → Business settings
            → Integrations → Connected apps). Any minimum term or notice period in your order or proposal will still
            apply to fees.
          </p>
          <p>
            We may suspend or end the service, with notice where reasonably possible, if you materially breach these
            terms, if your use puts the service, other clients or people who message you at risk, if Meta restricts or
            withdraws our access, or if we are required to by law.
          </p>
          <p>When the service ends or a Page is disconnected:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>we unsubscribe the Page from our webhooks and stop processing new messages;</li>
            <li>we delete the access tokens immediately; and</li>
            <li>
              remaining messages and related data we hold are deleted within the retention periods in our Privacy
              Policy, or sooner if you ask us to delete them.
            </li>
          </ul>
          <p>Sections that by their nature should continue after termination (including 6, 10, 11 and 13) will continue to apply.</p>
        </Section>

        <Section id="ip" title="10. Intellectual property">
          <p>
            OY Labs owns all rights in the service, our software, documentation and website. We grant the Client a
            non-exclusive, non-transferable right to use the service for its own business during the term of our
            agreement. You keep all rights in your content, including your messages, customer conversations and
            business data, and you grant us only the rights we need to provide the service. If you give us feedback,
            we may use it to improve the service without any obligation to you.
          </p>
          <p>Facebook, Messenger and Instagram are trademarks of Meta Platforms, Inc.</p>
        </Section>

        <Section id="liability" title="11. Liability">
          <p>
            Nothing in these terms limits or excludes liability for death or personal injury caused by negligence,
            for fraud or fraudulent misrepresentation, or for anything else that cannot be limited or excluded under
            the law of England and Wales.
          </p>
          <p>Subject to that:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              neither party is liable to the other for any loss of profits, revenue, business, goodwill or anticipated
              savings, or for any indirect or consequential loss;
            </li>
            <li>
              we are not liable for losses caused by Meta&rsquo;s platform, your own systems, your breach of these
              terms, or events outside our reasonable control; and
            </li>
            <li>
              our total liability to the Client arising out of or in connection with the service in any 12-month
              period, whether in contract, tort (including negligence) or otherwise, is limited to the fees paid by the
              Client to OY Labs for the service in the 12 months before the event giving rise to the claim.
            </li>
          </ul>
          <p>
            The website is provided for general information. We try to keep it accurate but do not promise that it is
            complete or up to date.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to these terms">
          <p>
            We may update these terms from time to time. We will change the &ldquo;Last updated&rdquo; date at the top
            of this page and, for material changes, give Clients reasonable notice before they take effect. If you
            continue to use the service after a change takes effect, the updated terms will apply.
          </p>
        </Section>

        <Section id="law" title="13. Governing law">
          <p>
            These terms, and any dispute or claim arising out of or in connection with them, are governed by the law
            of England and Wales. The courts of England and Wales have exclusive jurisdiction.
          </p>
        </Section>

        <Section id="contact" title="14. Contact">
          <p>For any question about these terms, contact:</p>
          <address className="not-italic rounded-2xl border border-line bg-panel p-5 sm:p-6 text-sm leading-relaxed">
            <span className="block text-ink font-semibold">OY Labs Ltd</span>
            71-75 Shelton Street, Covent Garden
            <br />
            London, WC2H 9JQ
            <br />
            United Kingdom
            <span className="block mt-3">
              Email: <Email />
            </span>
          </address>
        </Section>
      </div>

      <Footer />
    </>
  );
}
