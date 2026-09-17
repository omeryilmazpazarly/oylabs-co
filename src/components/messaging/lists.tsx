import { RotateCcw, Plug } from 'lucide-react';
import type { Connection } from '@/lib/messaging/connections';
import type { DeliverySummary } from '@/lib/messaging/deliveries';
import { Badge, ConnectionStatusBadge, EmptyState, FacebookIcon, InstagramIcon, dangerBtn, relativeTime } from '@/components/console/ui';
import { ConfirmAction } from '@/components/console/client';
import type { PlainAction } from './types';

export function ConnectionsList({ connections, disconnectAction, emptyHint }: { connections: Connection[]; disconnectAction?: PlainAction; emptyHint: React.ReactNode }) {
  if (connections.length === 0) {
    return <EmptyState icon={<Plug size={18} />} title="Nothing connected yet">{emptyHint}</EmptyState>;
  }
  return (
    <ul className="-my-3 divide-y divide-line-sub">
      {connections.map((c) => (
        <li key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink"><FacebookIcon size={14} className="text-sky-500" /> {c.page_name}</span>
              <ConnectionStatusBadge status={c.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim">
              <span>Page ID <code className="font-mono">{c.page_id}</code></span>
              {c.ig_account_id
                ? <span className="inline-flex items-center gap-1"><InstagramIcon size={12} className="text-pink-500" />{c.ig_username ?? c.ig_account_id}</span>
                : <span>No Instagram account linked</span>}
              <span>Updated {relativeTime(c.updated_at)}</span>
            </div>
            {c.status_detail && c.status !== 'active' && <div className="text-xs text-ink-dull">{c.status_detail}</div>}
          </div>
          {disconnectAction && c.status !== 'disconnected' && (
            <ConfirmAction
              action={disconnectAction}
              fields={{ connectionId: c.id }}
              confirm={`Disconnect ${c.page_name}? Webhooks are unsubscribed and stored tokens are deleted.`}
              className={dangerBtn}
            >
              Disconnect
            </ConfirmAction>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DeliveriesTable({ deliveries, workspaceId, retryAction }: { deliveries: DeliverySummary[]; workspaceId: number; retryAction?: PlainAction }) {
  if (deliveries.length === 0) {
    return <EmptyState title="No deliveries yet">Events appear here once customers message a connected account and a forwarding URL is set.</EmptyState>;
  }
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead className="text-ink-dim">
          <tr className="border-b border-line-sub">
            <th className="px-5 py-2 font-medium">Event</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Attempts</th>
            <th className="px-2 py-2 font-medium">Last result</th>
            <th className="px-5 py-2 text-right font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-sub">
          {deliveries.map((d) => (
            <tr key={d.id}>
              <td className="px-5 py-2.5 font-mono text-ink">{d.event_id}</td>
              <td className="px-2 py-2.5">
                {d.status === 'delivered' && <Badge tone="green">Delivered</Badge>}
                {d.status === 'pending' && (d.attempts === 0 ? <Badge>Queued</Badge> : <Badge tone="amber">Retrying {relativeTime(d.next_attempt_at)}</Badge>)}
                {d.status === 'dead' && (
                  <span className="inline-flex items-center gap-2">
                    <Badge tone="red">Failed</Badge>
                    {retryAction && (
                      <form action={retryAction}>
                        <input type="hidden" name="workspaceId" value={workspaceId} />
                        <input type="hidden" name="deliveryId" value={d.id} />
                        <button className="inline-flex items-center gap-1 text-ink-dim hover:text-ink"><RotateCcw size={11} /> Retry</button>
                      </form>
                    )}
                  </span>
                )}
              </td>
              <td className="px-2 py-2.5 tabular-nums text-ink-dim">{d.attempts}</td>
              <td className="px-2 py-2.5 text-ink-dim">{d.last_error ?? (d.last_status ? `HTTP ${d.last_status}` : '—')}</td>
              <td className="px-5 py-2.5 text-right text-ink-dim">{relativeTime(d.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
