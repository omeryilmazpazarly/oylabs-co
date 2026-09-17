import Link from 'next/link';
import { ArrowRight, Check, Code2, CreditCard, MessagesSquare, Plug } from 'lucide-react';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { activeChannelCount } from '@/lib/messaging/workspaces';
import { listConnections } from '@/lib/messaging/connections';
import { listConversations } from '@/lib/messaging/conversations';
import { pageLimit, serviceState } from '@/lib/billing/entitlements';
import { planById } from '@/lib/billing/plans';
import { Card, Notice, PageHeader, Stat, formatDate } from '@/components/console/ui';
import { billingSummary } from '@/components/console/billing';

const ERRORS: Record<string, string> = { owner_only: 'Only workspace owners can open that page.' };

export default async function PortalOverview({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const ctx = await requireClient();
  const w = ctx.workspace;
  const nowMs = now();
  const state = serviceState(w, nowMs);
  const connections = listConnections(w.id);
  const conversations = listConversations(w.id, 5);
  const reconnect = connections.filter((c) => c.status === 'reconnect_needed');
  const used = activeChannelCount(w.id);

  const steps = [
    { done: state.active, label: 'Choose a plan', href: '/app/billing', icon: CreditCard, detail: state.active ? billingSummary(w, nowMs) : '14-day free trial on every plan.' },
    { done: used > 0, label: 'Connect Facebook, Instagram or WhatsApp', href: '/app/connections', icon: Plug, detail: used > 0 ? `${used} connected.` : 'Takes about a minute.' },
    { done: Boolean(w.forward_url) || conversations.length > 0, label: 'Reply from the inbox, or connect your own system', href: w.forward_url ? '/app/developers' : '/app/inbox', icon: w.forward_url ? Code2 : MessagesSquare, detail: w.forward_url ? 'Forwarding to your system is on.' : 'Use the OY Labs inbox, or add a webhook URL under Developers.' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={ctx.workspace.name} title={`Hello, ${ctx.user.name.split(' ')[0]}`} description="Your Messenger, Instagram and WhatsApp messaging at a glance." />
      {error && ERRORS[error] && <div className="mb-6"><Notice tone="amber">{ERRORS[error]}</Notice></div>}
      {reconnect.length > 0 && (
        <div className="mb-6"><Notice tone="amber">{reconnect.map((c) => c.page_name).join(', ')} {reconnect.length === 1 ? 'needs' : 'need'} reconnecting before replies can be sent.{' '}<Link href="/app/connections" className="font-medium underline">Reconnect</Link></Notice></div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Plan" value={w.complimentary ? 'Included' : planById(w.plan)?.name ?? '—'} hint={state.kind === 'trialing' && w.trial_ends_at ? `Trial until ${formatDate(w.trial_ends_at)}` : undefined} href={ctx.role === 'owner' ? '/app/billing' : undefined} />
        <Stat label="Channels connected" value={`${used} / ${pageLimit(w)}`} href="/app/connections" />
        <Stat label="Conversations" value={listConversations(w.id, 1000).length} href="/app/inbox" />
        <Stat label="Service" value={state.active ? 'On' : 'Paused'} hint={state.active ? 'Messages delivered and replies allowed' : 'Messages saved, not delivered'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Getting started" className="lg:col-span-3">
          <ol className="-my-2 divide-y divide-line-sub">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link href={s.href} className="group flex items-center gap-4 py-3.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${s.done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' : 'border-line text-ink-dim'}`}>
                    {s.done ? <Check size={15} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{s.label}</div>
                    <div className="truncate text-xs text-ink-dim">{s.detail}</div>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-ink-dull transition-colors group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Recent conversations" className="lg:col-span-2" actions={<Link href="/app/inbox" className="text-xs text-ink-dim hover:text-ink">Open inbox</Link>}>
          {conversations.length === 0 ? (
            <p className="text-sm text-ink-dim">No messages yet. Once a channel is connected, new Messenger, Instagram and WhatsApp messages appear here.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line-sub">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link href={`/app/inbox?c=${c.id}`} className="block py-2.5">
                    <div className="truncate text-sm text-ink">{c.participant_name ?? `Customer ${c.participant_id.slice(-4)}`}</div>
                    <div className="truncate text-xs text-ink-dim">{c.last_message_preview}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
