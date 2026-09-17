import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { serviceState } from '@/lib/billing/entitlements';
import { Wordmark } from '@/components/console/ui';
import { BillingBadge } from '@/components/console/billing';
import { clientLogoutAction, switchWorkspaceAction } from './actions';
import PortalNav from './PortalNav';
import BillingBanner from './BillingBanner';

export const metadata = { title: 'OY Labs — Messaging', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Pages call requireClient() too: layouts don't re-run on client navigation.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireClient();
  const nowMs = now();
  const state = serviceState(ctx.workspace, nowMs);

  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="border-b border-line-sub bg-panel lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-4 lg:h-16 lg:px-5">
          <Link href="/app"><Wordmark /></Link>
          <form action={clientLogoutAction} className="lg:hidden">
            <button className="rounded-md p-2 text-ink-dim hover:text-ink" aria-label="Sign out"><LogOut size={16} /></button>
          </form>
        </div>
        <div className="px-4 pb-3 lg:px-5">
          {ctx.workspaces.length > 1 ? (
            <form action={switchWorkspaceAction} className="flex gap-2">
              <label htmlFor="ws-switch" className="sr-only">Workspace</label>
              <select id="ws-switch" name="workspaceId" defaultValue={ctx.workspace.id} className="min-w-0 flex-1 rounded-lg border border-line bg-input px-2.5 py-2 text-sm text-ink">
                {ctx.workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button className="rounded-lg border border-line px-2.5 text-xs text-ink-dim hover:text-ink">Go</button>
            </form>
          ) : (
            <div className="truncate text-sm font-medium text-ink">{ctx.workspace.name}</div>
          )}
          <div className="mt-1.5"><BillingBadge w={ctx.workspace} nowMs={nowMs} /></div>
        </div>
        <PortalNav isOwner={ctx.role === 'owner'} />
        <div className="hidden border-t border-line-sub p-4 lg:mt-auto lg:block">
          <div className="truncate text-sm text-ink">{ctx.user.name}</div>
          <div className="truncate text-xs text-ink-dim">{ctx.user.email} · {ctx.role}</div>
          <form action={clientLogoutAction} className="mt-3">
            <button className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"><LogOut size={12} /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <BillingBanner state={state} isOwner={ctx.role === 'owner'} trialEndsAt={ctx.workspace.trial_ends_at} />
        {children}
      </main>
    </div>
  );
}
