import Link from 'next/link';
import { requireStaff } from '@/lib/auth/session';
import { notFound } from 'next/navigation';
import { MessagesSquare, Plug, RotateCcw } from 'lucide-react';
import { getWorkspace } from '@/lib/messaging/workspaces';
import { listConnections, listOpenConnectLinks } from '@/lib/messaging/connections';
import { listDeliveries } from '@/lib/messaging/deliveries';
import { metaConfigured } from '@/lib/messaging/env';
import {
  Badge, Card, ConnectionStatusBadge, FacebookIcon, InstagramIcon, EmptyState, Notice, PageHeader, formatDate, primaryBtn, relativeTime, secondaryBtn, dangerBtn,
} from '@/components/console/ui';
import { ConfirmAction, SecretField, SubmitButton } from '@/components/console/client';
import { connectNowAction, disconnectAction, retryDeliveryAction, revokeLinkAction } from '../../actions';
import { ConnectLinkForm, RotateSecretForm, SettingsForm } from './forms';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const workspace = getWorkspace(Number(id));
  if (!workspace) notFound();

  const connections = listConnections(workspace.id);
  const links = listOpenConnectLinks(workspace.id);
  const deliveries = listDeliveries(workspace.id);
  const configured = metaConfigured();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Workspace"
        title={workspace.name}
        description={`Created ${formatDate(workspace.created_at)}`}
        actions={<Link href={`/console/inbox?w=${workspace.id}`} className={secondaryBtn}><MessagesSquare size={15} /> Open inbox</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Connected accounts"
            description="Facebook Pages and their linked Instagram professional accounts."
            actions={configured && (
              <form action={connectNowAction}>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <SubmitButton className={primaryBtn} pendingText="Opening…"><FacebookIcon size={15} /> Connect Facebook &amp; Instagram</SubmitButton>
              </form>
            )}
          >
            {!configured && <div className="mb-4"><Notice tone="amber">Meta isn&rsquo;t configured on this server, so accounts can&rsquo;t be connected yet.</Notice></div>}
            {connections.length === 0 ? (
              <EmptyState icon={<Plug size={18} />} title="Nothing connected yet">
                Use <strong>Connect Facebook &amp; Instagram</strong>{' '}if you manage the client&rsquo;s Page, or create a connect link for their Page admin.
              </EmptyState>
            ) : (
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
                    {c.status !== 'disconnected' && (
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
            )}
          </Card>

          <Card title="Client onboarding link" description="For when someone at the client business administers the Page.">
            <div className="space-y-4">
              <ConnectLinkForm workspaceId={workspace.id} />
              {links.length > 0 && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-dim">Open links</div>
                  <ul className="space-y-2">
                    {links.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-line-sub px-3 py-2 text-xs text-ink-dim">
                        <span>Created {relativeTime(l.created_at)} · expires {relativeTime(l.expires_at)}</span>
                        <form action={revokeLinkAction}>
                          <input type="hidden" name="workspaceId" value={workspace.id} />
                          <input type="hidden" name="linkId" value={l.id} />
                          <button className="text-red-500 hover:underline">Revoke</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card title="Deliveries to client" description="Most recent forwarded events. Failed events retry with backoff for about a day.">
            {deliveries.length === 0 ? (
              <EmptyState title="No deliveries yet">Events appear here once customers message a connected account.</EmptyState>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="text-ink-dim">
                    <tr className="border-b border-line-sub">
                      <th className="px-5 py-2 font-medium">Event</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Attempts</th>
                      <th className="px-2 py-2 font-medium">Last result</th>
                      <th className="px-5 py-2 font-medium text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-sub">
                    {deliveries.map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-2.5 font-mono text-ink">{d.event_id}</td>
                        <td className="px-2 py-2.5">
                          {d.status === 'delivered' && <Badge tone="green">Delivered</Badge>}
                          {d.status === 'pending' && <Badge tone="amber">Retrying {relativeTime(d.next_attempt_at)}</Badge>}
                          {d.status === 'dead' && (
                            <span className="inline-flex items-center gap-2">
                              <Badge tone="red">Failed</Badge>
                              <form action={retryDeliveryAction}>
                                <input type="hidden" name="workspaceId" value={workspace.id} />
                                <input type="hidden" name="deliveryId" value={d.id} />
                                <button className="inline-flex items-center gap-1 text-ink-dim hover:text-ink"><RotateCcw size={11} /> Retry</button>
                              </form>
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
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Settings">
            <SettingsForm workspaceId={workspace.id} name={workspace.name} forwardUrl={workspace.forward_url} />
          </Card>
          <Card title="API credentials" description="Used by the client system to verify forwarded events and call the Send API.">
            <div className="space-y-4">
              <SecretField label="API key" value={workspace.api_key} />
              <RotateSecretForm workspaceId={workspace.id} />
              <p className="text-xs text-ink-dim">Integration guide: <code className="font-mono">docs/client-integration.md</code></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
