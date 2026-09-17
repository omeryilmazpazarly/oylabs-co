import { AlertCircle } from 'lucide-react';
import ConnectShell from '../ConnectShell';

export const metadata = { title: 'Connection problem — OY Labs', robots: { index: false, follow: false } };

const MESSAGES: Record<string, { title: string; body: string }> = {
  denied: { title: 'Facebook sign-in was cancelled', body: 'Nothing was connected. Open your connect link again when you are ready.' },
  state: { title: 'This session has expired', body: 'For your security the connection must be finished within 30 minutes in the same browser. Open your connect link again to restart.' },
  used: { title: 'This link has already been used', body: 'Ask your OY Labs contact for a new connect link.' },
  expired: { title: 'This link has expired', body: 'Ask your OY Labs contact for a new connect link.' },
  invalid: { title: 'This link is not valid', body: 'Check you copied the whole link, or ask for a new one.' },
  no_pages: { title: 'No Pages were shared', body: 'During Facebook sign-in, select the business and at least one Page you administer, then try your link again.' },
  page: { title: 'That Page can’t be connected here', body: 'It may already be connected to another OY Labs client. Contact hi@oylabs.co.' },
  meta: { title: 'Facebook returned an error', body: 'Please try again in a few minutes. If it keeps happening, contact hi@oylabs.co.' },
};

export default async function ConnectErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason = 'meta' } = await searchParams;
  const message = MESSAGES[reason] ?? MESSAGES.meta;
  return (
    <ConnectShell>
      <AlertCircle size={28} className="text-amber-500" />
      <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">{message.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim">{message.body}</p>
    </ConnectShell>
  );
}
