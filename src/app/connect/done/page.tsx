import { CheckCircle2 } from 'lucide-react';
import ConnectShell from '../ConnectShell';

export const metadata = { title: 'Connected — OY Labs', robots: { index: false, follow: false } };

export default async function DonePage({ searchParams }: { searchParams: Promise<{ w?: string; page?: string; ig?: string }> }) {
  const { w, page, ig } = await searchParams;
  return (
    <ConnectShell>
      <CheckCircle2 size={32} className="text-emerald-500" />
      <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">{page ? `${page} is connected` : 'Page connected'}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim">
        New Messenger messages{ig ? ` and Instagram messages to @${ig}` : ''} will now be delivered to {w ?? 'your'} inbox. You can close this window.
      </p>
      {!ig && <p className="mt-3 text-sm text-ink-dim">No Instagram professional account is linked to this Page. Link one in Meta Business Suite, then ask OY Labs for a new connect link to add it.</p>}
      <a href="/app/connections" className="mt-6 inline-flex rounded-lg bg-cta px-4 py-2.5 text-sm font-semibold text-cta-fg hover:opacity-90">Go to your OY Labs account</a>
      <p className="mt-6 text-xs text-ink-dull">To disconnect later, contact hi@oylabs.co or remove OY Labs under Business Integrations in your Facebook settings.</p>
    </ConnectShell>
  );
}
