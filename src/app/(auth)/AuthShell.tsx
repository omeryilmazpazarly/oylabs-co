import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/console/ui';

export default function AuthShell({ title, subtitle, children, footer, wide = false }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-page px-4 py-12 sm:py-16">
      <div className={`mx-auto w-full ${wide ? 'max-w-md' : 'max-w-sm'}`}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/tech-provider"><Wordmark /></Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-dim">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-dim">{footer}</div>}
        <p className="mt-8 text-center text-xs text-ink-dull">
          OY Labs Ltd ·{' '}<Link href="/privacy" className="hover:text-ink">Privacy</Link>{' '}·{' '}<Link href="/terms" className="hover:text-ink">Terms</Link>{' '}·{' '}<a href="mailto:hi@oylabs.co" className="hover:text-ink">hi@oylabs.co</a>
        </p>
      </div>
    </div>
  );
}
