import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  Building2,
  Database,
  FileText,
  Fingerprint,
  Inbox,
  KeyRound,
  Lock,
  ServerCog,
  ShieldCheck,
  Trash2,
  Unplug,
  UserCheck,
  Users,
  Webhook,
} from 'lucide-react';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import SectionAtmosphere from '@/components/effects/SectionAtmosphere';
import MessageFlow from './MessageFlow';

export const metadata: Metadata = {
  title: 'Messenger & Instagram Integration — OY Labs',
  description:
    'OY Labs Ltd connects your Facebook Page and Instagram professional account to your own customer inbox or CRM, so your team can receive and reply to Messenger and Instagram Direct messages in one place.',
  alternates: { canonical: '/tech-provider' },
};

/* ── Content ─────────────────────────────────────────────────────────── */

const AUDIENCE = [
  {
    icon: <Inbox size={20} />,
    title: 'Businesses with their own inbox or CRM',
    body: 'You already manage customer conversations in your own system and want Messenger and Instagram messages to arrive there too, instead of in a separate app.',
  },
  {
    icon: <Users size={20} />,
    title: 'Teams that share customer conversations',
    body: 'Several staff members answer enquiries. Each conversation is visible to your authorised team, who reply from the same place they handle everything else.',
  },
  {
    icon: <Building2 size={20} />,
    title: 'Service and education providers',
    body: 'Businesses such as online schools and service providers whose customers get in touch through Facebook and Instagram before they enrol or book.',
  },
];

const STEPS = [
  {
    title: 'We set up your workspace',
    body: 'OY Labs staff create a workspace for your business on our platform.',
  },
  {
    title: 'You receive a secure connect link',
    body: 'We send you a single-use link. It can only be used once and expires after 7 days.',
  },
  {
    title: 'A Page admin opens the link',
    body: 'The link must be opened by someone who is an admin of your Facebook Page. The page explains exactly what will be shared before anything happens.',
  },
  {
    title: 'Continue with Facebook',
    body: 'Click "Continue with Facebook" and sign in with Facebook Login for Business. Facebook lets you choose which Pages and business assets to grant to OY Labs.',
  },
  {
    title: 'Choose the Page to connect',
    body: 'Pick the Page you want to connect. The Instagram professional account linked to that Page is detected automatically.',
  },
  {
    title: 'Allow access to Instagram messages',
    body: 'In the Instagram app, the account owner goes to Settings → Messages and story replies → Message controls → Connected tools and turns on "Allow access to messages".',
  },
  {
    title: 'Start replying from your inbox',
    body: 'New messages to your Page and Instagram account are delivered to your inbox, and your staff reply from there.',
  },
];

const PERMISSIONS = [
  {
    name: 'pages_show_list',
    reason: 'List the Pages you granted, so you can choose which one to connect.',
  },
  {
    name: 'pages_manage_metadata',
    reason: 'Subscribe the chosen Page to our webhooks so new messages are delivered, and unsubscribe it when you disconnect.',
  },
  {
    name: 'pages_messaging',
    reason: 'Receive Messenger conversations and send your business’s replies.',
  },
  {
    name: 'pages_read_engagement',
    reason: 'Read the Page name and the linked Instagram account when you connect.',
  },
  {
    name: 'business_management',
    reason: 'Required by Meta alongside the Page permissions. We use it only to read the business portfolio ID the connection belongs to and the assets you granted.',
  },
  {
    name: 'instagram_basic',
    reason: 'Read the linked Instagram professional account’s ID and username, so we can show which account is connected.',
  },
  {
    name: 'instagram_manage_messages',
    reason: 'Receive Instagram Direct messages and send your business’s replies.',
  },
];

const DATA_GROUPS = [
  {
    title: 'Connection data',
    body: 'Page ID and name, Instagram professional account ID and username, your business portfolio ID, and access tokens.',
  },
  {
    title: 'Conversation data',
    body: 'Page-scoped IDs (PSID) and Instagram-scoped IDs (IGSID) of people who message you, message text, attachment links and their type, timestamps, button tap (postback) payloads, and the messages your business sends.',
  },
  {
    title: 'Profile data',
    body: 'Where Meta permits it, the name or username and profile picture URL of the person messaging you. Used only to label the conversation in your inbox.',
  },
];

const NEVER = [
  'Post content to your Page or Instagram account',
  'Read or manage your ads',
  'Access Page insights',
  'Read personal Facebook profiles',
  'Sell any data',
  'Use messages for advertising or profiling',
  'Use messages to train AI models',
  'Share conversations with anyone other than the business that owns the Page or account, apart from the service providers that host the service',
];

const SECURITY = [
  {
    icon: <Lock size={18} />,
    title: 'Encrypted in transit and at rest',
    body: 'All traffic uses HTTPS/TLS. Access tokens are encrypted at rest with AES-256-GCM.',
  },
  {
    icon: <Webhook size={18} />,
    title: 'Verified webhooks',
    body: 'Every webhook from Meta is checked against its X-Hub-Signature-256 signature before we process it.',
  },
  {
    icon: <Fingerprint size={18} />,
    title: 'Signed deliveries',
    body: 'Every delivery to your system is signed with HMAC-SHA256 using a secret unique to your business.',
  },
  {
    icon: <KeyRound size={18} />,
    title: 'Per-client API keys',
    body: 'Calls from your system to OY Labs are authenticated with keys and signatures issued to your business only.',
  },
  {
    icon: <UserCheck size={18} />,
    title: 'Individual staff accounts',
    body: 'Our staff console requires individual accounts with hashed passwords. Access follows least privilege.',
  },
  {
    icon: <ServerCog size={18} />,
    title: 'No message content in logs',
    body: 'Message content is never written to application logs.',
  },
];

/* ── Small building blocks ───────────────────────────────────────────── */

function SectionHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: React.ReactNode }) {
  return (
    <div className="mb-8 sm:mb-12 max-w-2xl">
      <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">{eyebrow}</span>
      <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">{title}</h2>
      {intro && <p className="mt-4 text-ink-dim leading-relaxed">{intro}</p>}
    </div>
  );
}

const linkCls = 'text-ink underline underline-offset-4 decoration-line-hi hover:decoration-ink transition-colors';

/* ── Page ────────────────────────────────────────────────────────────── */

export default function TechProviderPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <SectionAtmosphere theme="services" showTopEdge={false} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">
            Messaging integration
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink leading-[1.05] max-w-4xl">
            Messenger &amp; Instagram messaging integration
          </h1>
          <p className="mt-6 text-base sm:text-lg text-ink-dim max-w-2xl leading-relaxed">
            Connect your Facebook Page and the Instagram professional account linked to it to your own customer
            inbox or CRM. Messages your customers send on Messenger and Instagram Direct arrive where your team
            already works, and your staff reply from there.
          </p>
          <p className="mt-4 text-sm text-ink-dim max-w-2xl leading-relaxed">
            The service is operated by <strong className="text-ink font-semibold">OY Labs Ltd</strong>, a software
            company registered in England and Wales, using Meta&rsquo;s official Messenger Platform and Instagram messaging APIs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-opacity duration-200 active:scale-95"
            >
              Talk to us <ArrowRight size={16} />
            </a>
            <a
              href="#onboarding"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-line-hi text-ink text-sm font-medium tracking-wide hover:border-ink-dull transition-colors duration-200"
            >
              How onboarding works
            </a>
          </div>

          <MessageFlow />
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Who it is for"
            title="Built for businesses that talk to customers on Meta"
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {AUDIENCE.map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
                <div className="w-10 h-10 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink mb-5">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-ink tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-dim leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section id="onboarding" className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="How onboarding works"
            title="How your Page gets connected"
            intro="You never share a password with us. Access is granted through Facebook’s own sign-in screens, and you choose exactly which Pages and assets to share."
          />
          <ol className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-line bg-panel p-5 sm:p-6 flex gap-4"
              >
                <span
                  className="shrink-0 w-8 h-8 rounded-full border border-line-hi flex items-center justify-center text-xs font-mono text-ink"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-ink tracking-tight">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-dim leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Data and permissions */}
      <section id="permissions" className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="What we access and why"
            title="Only the permissions needed to deliver your messages"
            intro="We request the following Meta permissions. Each one is used for the purpose described and nothing else."
          />

          <div className="rounded-2xl border border-line bg-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-5 sm:px-6 py-4 text-xs text-ink-dim tracking-widest uppercase font-medium w-[34%]">
                      Permission
                    </th>
                    <th scope="col" className="px-5 sm:px-6 py-4 text-xs text-ink-dim tracking-widest uppercase font-medium">
                      What we use it for
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((p) => (
                    <tr key={p.name} className="border-b border-line-sub last:border-b-0 align-top">
                      <td className="px-5 sm:px-6 py-4">
                        <code className="font-mono text-[13px] text-ink break-all">{p.name}</code>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-ink-dim leading-relaxed">{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-ink tracking-tight">
              <Database size={18} className="text-ink-dim" /> Data we process
            </h3>
            <p className="mt-2 text-sm text-ink-dim leading-relaxed max-w-2xl">
              We process this data solely to deliver messages between your business and your customers: forwarding
              incoming messages to your system, sending your replies, and showing conversations to your authorised
              staff.
            </p>
            <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-3">
              {DATA_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
                  <h4 className="text-sm font-semibold text-ink">{group.title}</h4>
                  <p className="mt-2 text-sm text-ink-dim leading-relaxed">{group.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What we never do */}
      <section className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <SectionHeader
            eyebrow="What we never do"
            title="Your conversations are not our product"
            intro="The integration exists to move messages between you and your customers. We do not use the access you grant for anything else."
          />
          <ul className="grid gap-3 self-start">
            {NEVER.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 sm:px-5 py-3.5 text-sm text-ink-dim leading-relaxed"
              >
                <Ban size={16} className="shrink-0 mt-0.5 text-ink" aria-hidden />
                <span>We never {item.charAt(0).toLowerCase() + item.slice(1)}.</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Security"
            title="How we protect your connection"
          />
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-elevated border border-line flex items-center justify-center text-ink">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm text-ink-dim leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disconnecting and deletion */}
      <section id="disconnect" className="border-t border-line-sub py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Disconnecting and data deletion"
            title="You can switch it off at any time"
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <Unplug size={18} className="text-ink" aria-hidden />
                <h3 className="text-base font-semibold text-ink tracking-tight">Disconnecting</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-ink-dim leading-relaxed list-disc pl-5">
                <li>Ask us at <a href="mailto:hi@oylabs.co" className={linkCls}>hi@oylabs.co</a>, or use Disconnect in your OY Labs console.</li>
                <li>
                  Or remove the app yourself in Facebook Settings → Business Integrations, or in Meta Business Suite →
                  Business settings → Integrations → Connected apps.
                </li>
                <li>When Meta tells us the app has been removed, we stop processing and delete the access tokens.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-panel p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-ink" aria-hidden />
                <h3 className="text-base font-semibold text-ink tracking-tight">Retention and deletion</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-ink-dim leading-relaxed list-disc pl-5">
                <li>Access tokens are kept only while the Page is connected and are deleted immediately on disconnection, when the service ends, or on a deletion request.</li>
                <li>Messages, attachment links and profile names and pictures held by OY Labs are deleted automatically 90 days after they were received or sent. Your business keeps its own copy in its inbox.</li>
                <li>
                  You can request deletion at any time. See{' '}
                  <Link href="/data-deletion" className={linkCls}>data deletion instructions</Link>.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms of Service' },
              { href: '/data-deletion', label: 'Data Deletion' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-line hover:border-line-hi bg-panel px-4 py-2 text-sm text-ink-dim hover:text-ink transition-colors"
              >
                <FileText size={14} aria-hidden /> {link.label}
              </Link>
            ))}
            <span className="inline-flex items-center gap-2 px-1 py-2 text-sm text-ink-dim">
              <ShieldCheck size={14} aria-hidden /> Questions: <a href="mailto:hi@oylabs.co" className={linkCls}>hi@oylabs.co</a>
            </span>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
    </>
  );
}
