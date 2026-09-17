import Link from 'next/link';
import { Check, Lock, MessageCircle, ShieldCheck } from 'lucide-react';
import { resolveConnectLink } from '@/lib/messaging/connections';
import { FacebookIcon, InstagramIcon, Notice, formatDate } from '@/components/console/ui';
import ConnectShell from '../ConnectShell';

export const metadata = { title: 'Connect Facebook & Instagram — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  not_configured: 'Connecting is temporarily unavailable. Please contact hi@oylabs.co.',
  invalid: 'This link is not valid.',
  expired: 'This link has expired.',
  used: 'This link has already been used.',
  meta: 'We could not start the Facebook sign-in. Please try again.',
};

export default async function ConnectPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  const link = resolveConnectLink(token);

  if (!link.ok) {
    return (
      <ConnectShell>
        <h1 className="text-xl font-semibold text-ink">{ERRORS[link.reason]}</h1>
        <p className="mt-2 text-sm text-ink-dim">Connect links are single-use and expire after 7 days. Ask your OY Labs contact for a new one, or email <a className="text-ink underline" href="mailto:hi@oylabs.co">hi@oylabs.co</a>.</p>
      </ConnectShell>
    );
  }

  return (
    <ConnectShell>
      <div className="mb-5 flex items-center gap-2 text-sky-500">
        <FacebookIcon size={22} />
        <InstagramIcon size={20} className="text-pink-500" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Connect {link.workspaceName}&rsquo;s Facebook Page and Instagram</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim">
        OY Labs will deliver the messages customers send to your Page on Messenger, and to the Instagram professional account linked to it, into {link.workspaceName}&rsquo;s own inbox, and send your team&rsquo;s replies back.
      </p>

      {error && <div className="mt-5"><Notice tone="red">{ERRORS[error] ?? ERRORS.meta}</Notice></div>}

      <div className="mt-6 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim">What happens next</h2>
        <ol className="space-y-2.5 text-sm text-ink">
          {[
            'Sign in with a Facebook account that is an admin of the Page.',
            'Facebook asks which business and Pages to share with OY Labs, and shows the permissions below.',
            'Back here, choose the Page to connect. Its linked Instagram account is detected automatically.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] text-ink-dim">{i + 1}</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-elevated p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck size={15} /> What OY Labs can access</h2>
        <ul className="space-y-2 text-sm text-ink-dim">
          {[
            'Your Page name and ID, and the linked Instagram account’s username and ID, to show which account is connected.',
            'Messages people send to the Page and Instagram account, and the replies your team sends, to deliver them to your inbox.',
            'Customers’ names and profile pictures, only to label conversations.',
          ].map((item) => <li key={item} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-500" /> <span>{item}</span></li>)}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-dull"><Lock size={12} className="mt-0.5 shrink-0" /> We never post to your Page, read your ads or insights, or sell or share data. Tokens are encrypted, and you can disconnect at any time.</p>
      </div>

      <div className="mt-4">
        <Notice>
          <span className="flex gap-2"><MessageCircle size={15} className="mt-0.5 shrink-0" /><span>For Instagram, turn on <strong>Allow access to messages</strong>{' '}in the Instagram app: Settings → Messages and story replies → Message controls → Connected tools.</span></span>
        </Notice>
      </div>

      <a
        href={`/api/meta/oauth/start?link=${encodeURIComponent(token)}`}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe0] active:scale-[0.99]"
      >
        <FacebookIcon size={18} /> Continue with Facebook
      </a>
      <p className="mt-3 text-center text-xs text-ink-dull">
        By continuing you agree to the <Link href="/terms" className="underline">Terms</Link>{' '}and <Link href="/privacy" className="underline">Privacy Policy</Link>. Link expires {formatDate(link.expiresAt)}.
      </p>
    </ConnectShell>
  );
}
