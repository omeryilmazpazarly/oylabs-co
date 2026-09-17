import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — OY Labs',
  description:
    'How OY Labs Ltd collects, uses and protects personal data, including data from the Meta Platform processed through our Messenger, Instagram and WhatsApp messaging integration.',
  alternates: { canonical: '/privacy' },
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-ink pt-2">{children}</h3>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-ink font-semibold">{children}</strong>;
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-xl border border-line bg-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {head.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-xs text-ink-dim tracking-widest uppercase font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line-sub last:border-b-0 align-top">
                {row.map((cell, j) => (
                  <td key={j} className={`px-4 py-3 leading-relaxed ${j === 0 ? 'text-ink' : 'text-ink-dim'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Email = () => (
  <a href="mailto:hi@oylabs.co" className={linkCls}>
    hi@oylabs.co
  </a>
);

const CONTENTS = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'data-we-collect', label: 'Data we collect and where it comes from' },
  { id: 'meta-platform-data', label: 'Meta Platform data' },
  { id: 'purposes', label: 'How we use data and our lawful bases' },
  { id: 'sharing', label: 'Sharing and sub-processors' },
  { id: 'transfers', label: 'International transfers' },
  { id: 'retention', label: 'How long we keep data' },
  { id: 'security', label: 'Security' },
  { id: 'rights', label: 'Your rights' },
  { id: 'deletion', label: 'Data deletion' },
  { id: 'cookies', label: 'Cookies and similar technologies' },
  { id: 'children', label: 'Children' },
  { id: 'changes', label: 'Changes to this policy' },
  { id: 'contact', label: 'Contact us' },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export default function PrivacyPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span aria-hidden>/</span>
          <span className="text-ink-dim">Privacy Policy</span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink">
            <Shield className="w-5 h-5" aria-hidden />
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim">Privacy Policy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Privacy Policy</h1>
        <p className="text-ink-dull text-sm mb-10">
          Last updated: 17 September 2026 · <span className="text-ink-dim">OY Labs Ltd</span>
        </p>

        <div className="rounded-2xl border border-line bg-panel p-5 sm:p-6 mb-10 text-sm text-ink-dim leading-relaxed space-y-3">
          <p>
            <Strong>Summary.</Strong>{' '}This policy covers our website, our contact form, and our Messenger,
            Instagram and WhatsApp messaging integration. When a business connects its Facebook Page, Instagram
            professional account or WhatsApp Business number to us, we receive the messages its customers send and
            deliver them to that business&rsquo;s own inbox. We do that on the business&rsquo;s behalf and for no other purpose.
          </p>
          <p>
            We never sell personal data, never use it for advertising or profiling, and never use message content to
            train AI models. Messages we hold are deleted automatically after 90 days.
          </p>
        </div>

        <nav aria-label="Contents" className="rounded-2xl border border-line p-5 sm:p-6 mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-ink-dim mb-3">Contents</p>
          <ol className="grid gap-1.5 sm:grid-cols-2 text-sm list-decimal pl-5 marker:text-ink-dull">
            {CONTENTS.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="text-ink-dim hover:text-ink transition-colors">{c.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="who-we-are" title="1. Who we are">
          <p>
            <Strong>OY Labs Ltd</Strong>{' '}(&ldquo;OY Labs&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a software
            company registered in England and Wales, United Kingdom. Our registered address is 71-75 Shelton Street,
            Covent Garden, London, WC2H 9JQ, United Kingdom. You can contact us about anything in this policy at{' '}
            <Email />.
          </p>
          <p>We handle personal data in two different roles:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <Strong>As a controller</Strong>{' '}for data about visitors to oylabs.co, people who use our contact form
              or email us, our client businesses and their staff (for example, console accounts), and the data needed
              to set up and manage a Page or WhatsApp number connection. We decide how and why this data is used.
            </li>
            <li>
              <Strong>As a processor</Strong>{' '}for the conversations between a client business and its customers on
              Messenger, Instagram and WhatsApp. The client business is the controller of those conversations. We process them
              only on its instructions, to deliver messages between it and its customers.
            </li>
          </ul>
          <p>
            If you sent a message to a business that uses our service, that business is responsible for your
            conversation. You can contact the business directly, or contact us and we will help (see{' '}
            <a href="#rights" className={linkCls}>Your rights</a>).
          </p>
        </Section>

        <Section id="data-we-collect" title="2. Data we collect and where it comes from">
          <SubHeading>Website visitors and enquiries</SubHeading>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <Strong>Contact form:</Strong>{' '}your name, email address, the type of project you select and the
              message you write. We send a confirmation to the email address you give us.
            </li>
            <li>
              <Strong>Emails you send us:</Strong>{' '}your email address, name and whatever you choose to include.
            </li>
            <li>
              <Strong>Technical data:</Strong>{' '}our servers record standard request information such as IP address,
              browser type, the page requested and the time. These logs never contain message content. Cloudflare
              Turnstile processes device and browser signals to check that a form submission comes from a person.
            </li>
          </ul>

          <SubHeading>Client businesses and their staff</SubHeading>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Business contact details such as names, work email addresses and the business name, which we receive
              from the business when we agree to provide the service.
            </li>
            <li>
              Console account details for authorised staff, including a hashed version of the password (we never
              store passwords in readable form).
            </li>
            <li>
              <Strong>Client accounts:</Strong>{' '}when you sign up or are invited to a workspace, your name, email
              address, business name, a hashed password, your role (owner or member), and when you signed in.
            </li>
            <li>
              <Strong>Subscriptions and payments:</Strong>{' '}your plan, billing period, trial and renewal dates and
              subscription status. Payments are processed by Stripe: your card details go directly to Stripe and are
              never seen or stored by OY Labs. Stripe shares with us the billing name, email, address and the last
              four digits and expiry of the card so we can show them in your account and on invoices.
            </li>
          </ul>

          <SubHeading>Data from the Meta Platform</SubHeading>
          <p>
            When a business connects its Facebook Page and linked Instagram professional account, or its WhatsApp
            Business number, we receive data from Meta Platforms. This is described in detail in the next section.
          </p>

          <SubHeading>Sources</SubHeading>
          <p>
            We collect data directly from you (for example, through the contact form or email), from client
            businesses, and from Meta Platforms, Inc. and its affiliates (including WhatsApp) when a business connects
            its Page, Instagram account or WhatsApp number and when people message that business.
          </p>
        </Section>

        <Section id="meta-platform-data" title="3. Meta Platform data">
          <p>
            Our messaging integration uses Meta&rsquo;s APIs. A person who is an admin of a business&rsquo;s Facebook
            Page signs in with Facebook Login for Business and chooses which Pages and business assets to grant to OY
            Labs. A business connecting WhatsApp does so through Meta&rsquo;s WhatsApp Embedded Signup, in the same
            way. We then process the following data from the Meta Platform.
          </p>

          <Table
            head={['Category', 'What it includes']}
            rows={[
              [
                'Connection data',
                'Page ID and name, Instagram professional account ID and username, the client business portfolio ID, and access tokens. For WhatsApp: the WhatsApp Business Account ID, phone number ID, display phone number and verified business name.',
              ],
              [
                'Conversation data',
                'Page-scoped IDs (PSID) and Instagram-scoped IDs (IGSID) of people who message the business, message text, attachment links (images, video, audio and files) and their type, timestamps, postback (button tap) payloads, and the messages the business sends.',
              ],
              [
                'Profile data',
                'For people who message the business, and as permitted by Meta: their name or username and profile picture URL. Used only to label the conversation in the business’s inbox.',
              ],
            ]}
          />

          <SubHeading>WhatsApp Business Platform data</SubHeading>
          <p>
            A business can connect a number it already uses in the WhatsApp Business app (known as coexistence), or a
            new number used only through the API. For WhatsApp we process:
          </p>
          <Table
            head={['Category', 'What it includes']}
            rows={[
              [
                'People who message the business',
                'Their phone number (when WhatsApp provides it), WhatsApp business-scoped user ID (BSUID), profile name, and username if they use one.',
              ],
              [
                'Messages',
                'Message content and media (images, audio, video, documents, stickers, shared locations and shared contacts), delivery and read statuses, reactions, and the messages the business sends. Media files are not stored by OY Labs: they are fetched from Meta only when an authorised user or the client business’s system requests them.',
              ],
              [
                'WhatsApp Business app contacts (coexistence only)',
                'Contact names from the business’s WhatsApp Business app address book, if the business chooses to share them. They are synced once when the number is connected and again when they change.',
              ],
              [
                'Chat history (coexistence only)',
                'If the business chooses to share it, Meta makes up to 180 days of chat history available. We import only messages from the last 90 days, in line with our retention period, and sync messages the business later sends from the WhatsApp Business app into its inbox.',
              ],
              [
                'Message templates',
                'The templates the business creates: name, category, language, content and Meta’s approval status.',
              ],
            ]}
          />

          <SubHeading>How we use it</SubHeading>
          <p>We use Meta Platform data solely to deliver messages between the client business and its customers:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>forwarding incoming messages to the client business&rsquo;s own system;</li>
            <li>sending the client business&rsquo;s replies and, on its instruction, its WhatsApp template messages through Messenger, Instagram or WhatsApp; and</li>
            <li>showing the conversation to the client business&rsquo;s authorised staff.</li>
          </ul>
          <p>
            Connection data is also used to set up, maintain and remove the connection (for example, to subscribe the
            Page or WhatsApp Business Account to our webhooks, manage message templates, start the contact and chat
            history sync a business chose to share, and unsubscribe on disconnection).
          </p>

          <SubHeading>What we never do with it</SubHeading>
          <ul className="list-disc pl-5 space-y-2">
            <li>We never sell it.</li>
            <li>We never use it for advertising, marketing or profiling, including our own marketing.</li>
            <li>We never message anyone except on the client business&rsquo;s instruction.</li>
            <li>We never use it to train AI models.</li>
            <li>
              We never share it with anyone other than the client business that owns the Page, Instagram account or WhatsApp number,
              and the sub-processors listed below that host and run the service.
            </li>
            <li>
              We do not post content, read or manage ads, access Page insights, or read personal Facebook profiles.
            </li>
          </ul>
          <p>
            The Meta permissions we request, and the reason for each, are listed on our{' '}
            <Link href="/tech-provider#permissions" className={linkCls}>Messaging Integration page</Link>. We handle
            Meta Platform data in line with the Meta Platform Terms and Developer Policies, and WhatsApp data in line with
            the WhatsApp Business terms and policies that apply to it.
          </p>
        </Section>

        <Section id="purposes" title="4. How we use data and our lawful bases">
          <p>Under UK data protection law, we must have a lawful basis for each use of personal data.</p>
          <Table
            head={['Purpose', 'Lawful basis']}
            rows={[
              [
                'Responding to enquiries through our contact form or by email, and following up on a potential project',
                'Legitimate interests (answering people who contact us and running our business), or steps taken at your request before entering into a contract',
              ],
              [
                'Providing the service to client businesses: accounts, workspaces, team invitations, staff console accounts, Page and WhatsApp number connections, and sending service emails (email confirmation, password reset, invitations)',
                'Performance of our contract with the client business',
              ],
              [
                'Taking payment for subscriptions, running free trials, sending invoices and handling failed payments',
                'Performance of our contract, and legal obligation (keeping tax and accounting records)',
              ],
              [
                'Delivering messages between a client business and its customers on Messenger, Instagram and WhatsApp, including sending WhatsApp template messages, importing the WhatsApp chat history and contacts a business chooses to share, and managing its message templates',
                'We act as a processor on the client business’s instructions. The client business, as controller, is responsible for having its own lawful basis for messaging its customers, including any opt-in WhatsApp requires',
              ],
              [
                'Keeping the website and service secure, preventing spam and abuse (including Cloudflare Turnstile), and handling deletion requests',
                'Legitimate interests (protecting our service, our clients and the people who message them), and legal obligation where it applies',
              ],
              [
                'Complying with law, keeping business records and dealing with legal claims',
                'Legal obligation and legitimate interests',
              ],
              [
                'Any use where we specifically ask for your consent',
                'Consent, which you can withdraw at any time by contacting us',
              ],
            ]}
          />
        </Section>

        <Section id="sharing" title="5. Sharing and sub-processors">
          <p>We share personal data only as follows:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <Strong>The client business</Strong>{' '}that owns the connected Page, Instagram account or WhatsApp number receives the
              conversations with its own customers. We do not share one business&rsquo;s data with another.
            </li>
            <li>
              <Strong>Meta</Strong>{' '}(including WhatsApp) receives the replies and template messages a client
              business sends, because they are delivered through Messenger, Instagram and WhatsApp.
            </li>
            <li>
              <Strong>Service providers (sub-processors)</Strong>{' '}that host and run our website and service under
              contract with us:
            </li>
          </ul>

          <Table
            head={['Provider', 'What they do', 'Location']}
            rows={[
              ['Amazon Web Services', 'Hosting for our website, service and databases', 'United States (us-east-1)'],
              ['Resend', 'Sending contact form emails, account emails and confirmations', 'May include the United States'],
              ['Stripe', 'Subscription payments, card processing, invoices and fraud prevention (Stripe acts as an independent controller for payment card data)', 'United States and other countries'],
              ['Cloudflare', 'Turnstile spam protection on our forms', 'May include the United States'],
              ['Google Workspace', 'Our company email mailbox', 'May include the United States'],
            ]}
          />

          <p>
            We may also disclose information where we are required to by law, for example in response to a valid
            request from a court or regulator. We do not sell personal data to anyone.
          </p>
        </Section>

        <Section id="transfers" title="6. International transfers">
          <p>
            We are based in the United Kingdom, but our service is hosted on Amazon Web Services servers in the United
            States, and some of our other providers may process data outside the UK. When personal data is transferred
            outside the UK, we make sure appropriate safeguards are in place, such as the UK Extension to the EU-US
            Data Privacy Framework where the recipient is certified, or the UK International Data Transfer Agreement
            or the UK Addendum to the EU Standard Contractual Clauses. You can ask us for more information about these
            safeguards at <Email />.
          </p>
        </Section>

        <Section id="retention" title="7. How long we keep data">
          <p>We keep personal data only for as long as we need it:</p>
          <Table
            head={['Data', 'How long we keep it']}
            rows={[
              [
                'Access tokens',
                'Until the Page or WhatsApp number is disconnected, the client business ends the service, or we receive a deletion request. They are then deleted immediately.',
              ],
              [
                'Messages (including imported WhatsApp chat history), attachment and media references, and profile names, usernames and pictures held by OY Labs',
                '90 days from when the message was received or sent, then deleted automatically. The client business keeps its own copy in its inbox under its own policy.',
              ],
              [
                'Contacts synced from the WhatsApp Business app',
                'Until the WhatsApp number is disconnected, or 90 days after the contact was last updated, whichever is sooner.',
              ],
              ['WhatsApp message templates', 'While the WhatsApp number is connected'],
              ['WhatsApp media files', 'Not stored by OY Labs. Fetched from Meta only when requested.'],
              ['Raw webhook event records', '14 days'],
              ['Logs of deliveries to client systems', '30 days'],
              [
                'Data deletion request records (confirmation code, date and status, with no message content)',
                '12 months',
              ],
              ['Server logs (no message content)', 'Up to 30 days'],
              ['Client account details (name, email, role)', 'While the account is active, and deleted within 30 days after you ask us to close it'],
              ['Subscription, invoice and payment records', 'For 6 years after the end of the financial year they relate to, as UK tax law requires'],
              [
                'Contact form submissions and enquiry emails',
                'As long as needed to respond and for our business relationship, up to 24 months',
              ],
            ]}
          />
        </Section>

        <Section id="security" title="8. Security">
          <p>We use technical and organisational measures appropriate to the data we handle, including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>HTTPS/TLS encryption for all traffic;</li>
            <li>encryption of access tokens at rest using AES-256-GCM;</li>
            <li>verifying every webhook from Meta using its X-Hub-Signature-256 signature;</li>
            <li>signing every delivery to a client system with HMAC-SHA256 and a secret unique to that client;</li>
            <li>authenticating client API calls with per-client keys and signatures;</li>
            <li>individual staff console accounts with hashed passwords;</li>
            <li>never writing message content to application logs; and</li>
            <li>least-privilege access, both for our staff and for the Meta permissions we request.</li>
          </ul>
          <p>
            No system is completely secure, but we work to protect your data and will act promptly, and notify
            affected parties and the ICO where required, if a breach occurs.
          </p>
        </Section>

        <Section id="rights" title="9. Your rights">
          <p>Under UK data protection law (the UK GDPR and the Data Protection Act 2018) you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><Strong>access</Strong>{' '}the personal data we hold about you;</li>
            <li><Strong>rectification</Strong>{' '}of data that is inaccurate or incomplete;</li>
            <li><Strong>erasure</Strong>{' '}of your data in certain circumstances;</li>
            <li><Strong>restriction</Strong>{' '}of how we use your data in certain circumstances;</li>
            <li><Strong>object</Strong>{' '}to our use of your data where we rely on legitimate interests;</li>
            <li><Strong>data portability</Strong>, to receive data you gave us in a commonly used format;</li>
            <li><Strong>withdraw consent</Strong>{' '}at any time, where we rely on consent; and</li>
            <li>
              <Strong>complain</Strong>{' '}to the UK Information Commissioner&rsquo;s Office (ICO) at{' '}
              <a href="https://ico.org.uk" className={linkCls} target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
              We would appreciate the chance to deal with your concern first, so please contact us.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email <Email />. We may need to verify your identity before acting on a
            request. We will respond within one month.
          </p>
          <p>
            If your request relates to a conversation with a business that uses our service, that business is the
            controller. We will help it respond, and we will act on its instructions. If you contact us directly, we
            will handle the request as described in the next section and let the business know.
          </p>
        </Section>

        <Section id="deletion" title="10. Data deletion">
          <p>There are several ways to have data deleted:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <Strong>If you connected a Page using Facebook Login,</Strong>{' '}remove the OY Labs app in your Facebook
              settings. Meta then sends us a data deletion request automatically. We delete the access tokens and all
              conversation data stored for the Pages you connected, and give you a confirmation code so you can check
              the status of your request.
            </li>
            <li>
              <Strong>If you messaged a business that uses OY Labs,</Strong>{' '}email <Email /> with the business name
              and your Facebook or Instagram name. We will verify the request, delete your messages within 30 days, and
              tell the business so it can remove its own copy.
            </li>
            <li>
              <Strong>If you messaged a business on WhatsApp,</Strong>{' '}email <Email /> with the business name and
              your WhatsApp number. We will verify the request, delete your messages, contact details and profile
              data within one month, and tell the business so it can remove its own copy.
            </li>
            <li>
              <Strong>If your business connected a WhatsApp number,</Strong>{' '}disconnecting it in your OY Labs
              account deletes our access tokens for it. You can also remove OY Labs in Meta Business Suite → Settings
              → Integrations, or in WhatsApp Manager → Partners.
            </li>
          </ul>
          <p>
            Full instructions are on our <Link href="/data-deletion" className={linkCls}>data deletion page</Link>.
          </p>
        </Section>

        <Section id="cookies" title="11. Cookies and similar technologies">
          <p>
            We do not use advertising or analytics cookies. We only use the following, which are needed for the site
            and service to work:
          </p>
          <Table
            head={['Name / technology', 'Purpose', 'Type']}
            rows={[
              ['Staff session cookie', 'Keeps authorised staff signed in to the OY Labs console', 'Strictly necessary'],
              ['Account session cookie', 'Keeps you signed in to your OY Labs account for up to 30 days', 'Strictly necessary'],
              ['Stripe (on Stripe’s own checkout and billing pages)', 'Payment security and fraud prevention when you pay or manage billing', 'Strictly necessary'],
              [
                'Connection security cookie',
                'A short-lived cookie that protects the Facebook connection flow against forged requests',
                'Strictly necessary',
              ],
              [
                'Theme preference (localStorage)',
                'Remembers whether you chose the light or dark theme. Stored only in your browser',
                'Functional',
              ],
              [
                'Cloudflare Turnstile',
                'Checks that form submissions come from a person rather than an automated script',
                'Strictly necessary (security)',
              ],
            ]}
          />
          <p>
            You can clear cookies and local storage in your browser settings at any time. Blocking the strictly
            necessary items may stop sign-in, the connection flow or the contact form from working.
          </p>
        </Section>

        <Section id="children" title="12. Children">
          <p>
            Our website and service are intended for businesses and are not directed at children under 13. We do not
            knowingly collect personal data from children. Some of our client businesses, such as education
            providers, serve children, but the people who message them are typically parents or guardians. If you
            believe a child has provided us with personal data, please contact us and we will delete it.
          </p>
        </Section>

        <Section id="changes" title="13. Changes to this policy">
          <p>
            We may update this policy from time to time. When we do, we will change the &ldquo;Last updated&rdquo;
            date at the top of this page. If a change significantly affects how we use personal data, we will take
            reasonable steps to let our client businesses know.
          </p>
        </Section>

        <Section id="contact" title="14. Contact us">
          <p>For any question about this policy or your personal data, contact:</p>
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
