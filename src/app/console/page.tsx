import Link from 'next/link';
import { AlertTriangle, ArrowRight, Building2, Plus } from 'lucide-react';
import { listWorkspaces } from '@/lib/messaging/workspaces';
import { consoleOverview } from '@/lib/messaging/overview';
import { env, metaConfigured } from '@/lib/messaging/env';
import { PAGE_SUBSCRIBED_FIELDS } from '@/lib/messaging/graph';
import { Badge, Card, EmptyState, Notice, PageHeader, Stat, primaryBtn, relativeTime } from '@/components/console/ui';
import { CopyButton } from '@/components/console/client';

const REQUIRED_ENV = ['META_APP_ID', 'META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_LOGIN_CONFIG_ID', 'TOKEN_ENCRYPTION_KEY', 'APP_BASE_URL'];

export default function ConsoleOverviewPage() {
  const workspaces = listWorkspaces();
  const o = consoleOverview();
  const base = env.appBaseUrl();
  const metaUrls = [
    { label: 'Webhook callback URL', value: `${base}/api/meta/webhook` },
    { label: 'Valid OAuth redirect URI', value: `${base}/api/meta/oauth/callback` },
    { label: 'Data deletion callback URL', value: `${base}/api/meta/data-deletion` },
    { label: 'Deauthorize callback URL', value: `${base}/api/meta/deauthorize` },
    { label: 'Privacy policy URL', value: `${base}/privacy` },
    { label: 'Terms of service URL', value: `${base}/terms` },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Messaging integration"
        title="Overview"
        description="Client workspaces, their connected Facebook Pages and Instagram accounts, and message delivery health."
        actions={<Link href="/console/workspaces/new" className={primaryBtn}><Plus size={15} /> New workspace</Link>}
      />

      {!metaConfigured() && (
        <div className="mb-6">
          <Notice tone="amber">
            Meta isn&rsquo;t configured on this server yet, so connecting Pages, webhooks and sending are disabled. Missing:{' '}
            {REQUIRED_ENV.filter((v) => !process.env[v]).map((v) => <code key={v} className="mx-0.5 rounded bg-elevated px-1 py-0.5 font-mono text-xs">{v}</code>)}
          </Notice>
        </div>
      )}

      {o.attention.length > 0 && (
        <div className="mb-6 space-y-2">
          {o.attention.map((a) => (
            <Notice key={a.id} tone="amber">
              <span className="inline-flex items-center gap-2 font-medium"><AlertTriangle size={14} /> {a.page_name}</span>{' '}
              in <Link className="underline" href={`/console/workspaces/${a.workspace_id}`}>{a.workspace_name}</Link> needs reconnecting.
              {a.status_detail && <span className="text-ink-dim"> {a.status_detail}.</span>}
            </Notice>
          ))}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Workspaces" value={o.workspaces} />
        <Stat label="Active connections" value={o.activeConnections} />
        <Stat label="Messages received (24h)" value={o.inbound24h} hint={o.lastEventAt ? `Last webhook ${relativeTime(o.lastEventAt)}` : 'No webhooks received yet'} href="/console/inbox" />
        <Stat label="Failed deliveries" value={o.deadDeliveries} hint={`${o.pendingDeliveries} queued · ${o.failedEvents} unprocessable events`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Client workspaces" className="lg:col-span-3">
          {workspaces.length === 0 ? (
            <EmptyState icon={<Building2 size={18} />} title="No workspaces yet">
              Create a workspace for each client business, such as Minhaj Kids, then send them a connect link.
            </EmptyState>
          ) : (
            <ul className="-my-2 divide-y divide-line-sub">
              {workspaces.map((w) => (
                <li key={w.id}>
                  <Link href={`/console/workspaces/${w.id}`} className="group flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{w.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone={w.active_connections ? 'green' : 'gray'}>{w.active_connections} connected</Badge>
                        {w.attention_connections > 0 && <Badge tone="amber">{w.attention_connections} need reconnect</Badge>}
                        {w.dead_deliveries > 0 && <Badge tone="red">{w.dead_deliveries} failed deliveries</Badge>}
                        {!w.forward_url && <Badge>No forwarding URL</Badge>}
                        <Badge>{w.conversations} conversations</Badge>
                      </div>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-ink-dull group-hover:text-ink transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Meta app settings" description="Paste these into the Meta App Dashboard." className="lg:col-span-2">
          <dl className="space-y-3">
            {metaUrls.map((u) => (
              <div key={u.label}>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">{u.label}</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{u.value}</code>
                  <CopyButton value={u.value} />
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">Page webhook fields</dt>
              <dd className="mt-1 font-mono text-xs text-ink">{PAGE_SUBSCRIBED_FIELDS.join(', ')}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
