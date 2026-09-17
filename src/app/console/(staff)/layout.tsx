import Link from 'next/link';
import { requireStaff } from '@/lib/auth/session';
import { Wordmark } from '@/components/console/ui';
import ConsoleNav from './ConsoleNav';
import { logoutAction } from '@/app/console/actions';
import { LogOut } from 'lucide-react';

export const metadata = { title: 'Console — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Pages call requireStaff() too: layouts don't re-run on client navigation (see Next.js authentication guide).
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="border-b border-line-sub bg-panel lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-4 lg:h-16 lg:px-5">
          <Link href="/console"><Wordmark suffix="Console" /></Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="rounded-md p-2 text-ink-dim hover:text-ink" aria-label="Sign out"><LogOut size={16} /></button>
          </form>
        </div>
        <ConsoleNav />
        <div className="hidden lg:absolute lg:bottom-0 lg:block lg:w-60 lg:border-t lg:border-line-sub lg:p-4">
          <div className="truncate text-sm text-ink">{staff.name}</div>
          <div className="truncate text-xs text-ink-dim">{staff.email}</div>
          <form action={logoutAction} className="mt-3">
            <button className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"><LogOut size={12} /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
