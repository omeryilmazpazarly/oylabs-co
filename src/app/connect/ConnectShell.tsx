import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/console/ui';

/** Minimal chrome for the client-facing connection flow. */
export default function ConnectShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex justify-center"><Link href="/tech-provider"><Wordmark /></Link></div>
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-ink-dull">
          OY Labs Ltd · <Link href="/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/terms" className="hover:text-ink">Terms</Link> · <Link href="/data-deletion" className="hover:text-ink">Data deletion</Link> · <a href="mailto:hi@oylabs.co" className="hover:text-ink">hi@oylabs.co</a>
        </p>
      </div>
    </div>
  );
}
