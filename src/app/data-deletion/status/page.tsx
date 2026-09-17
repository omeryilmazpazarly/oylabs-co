import Link from 'next/link';
import { CheckCircle2, SearchX } from 'lucide-react';
import { getDeletionStatus } from '@/lib/messaging/deletion';
import Footer from '@/components/Footer';

export const metadata = { title: 'Data deletion status — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' });

export default async function DeletionStatusPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code = '' } = await searchParams;
  const trimmed = code.trim().toUpperCase().slice(0, 40);
  const request = trimmed ? getDeletionStatus(trimmed) : null;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="mb-8 flex items-center gap-2 text-xs text-ink-dull">
          <Link href="/" className="hover:text-ink">OY Labs</Link><span>/</span>
          <Link href="/data-deletion" className="hover:text-ink">Data deletion</Link><span>/</span>
          <span className="text-ink-dim">Status</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Deletion request status</h1>

        <form action="/data-deletion/status" method="get" className="mt-8 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="code" className="sr-only">Confirmation code</label>
          <input id="code" name="code" defaultValue={trimmed} placeholder="Confirmation code, e.g. DEL7K2M9Q4XZ" className="flex-1 rounded-lg border border-line bg-input px-4 py-3 font-mono text-sm text-ink placeholder:text-ink-dull focus:border-line-hi focus:outline-none" />
          <button className="rounded-lg bg-cta px-5 py-3 text-sm font-semibold text-cta-fg hover:opacity-90">Check status</button>
        </form>

        {trimmed && (
          <div className="mt-8 rounded-2xl border border-line bg-panel p-6">
            {request ? (
              <div className="flex gap-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={22} />
                <div>
                  <div className="font-mono text-sm text-ink-dim">{request.confirmation_code}</div>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{request.status === 'completed' ? 'Completed' : 'Completed — no data was held'}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                    {request.status === 'completed'
                      ? 'The access tokens and the conversation data OY Labs stored for this request have been permanently deleted.'
                      : 'We received the request and checked our systems. OY Labs held no data linked to this Facebook account, so there was nothing to delete.'}
                  </p>
                  <p className="mt-3 text-xs text-ink-dull">Received {dateFmt.format(new Date(request.created_at))}{request.completed_at ? ` · completed ${dateFmt.format(new Date(request.completed_at))}` : ''}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <SearchX className="mt-0.5 shrink-0 text-ink-dim" size={22} />
                <div>
                  <h2 className="text-lg font-semibold text-ink">We couldn&rsquo;t find that code</h2>
                  <p className="mt-2 text-sm text-ink-dim">Check the code and try again. Records of deletion requests are kept for 12 months. For help, email <a href="mailto:hi@oylabs.co" className="text-ink underline">hi@oylabs.co</a>.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
