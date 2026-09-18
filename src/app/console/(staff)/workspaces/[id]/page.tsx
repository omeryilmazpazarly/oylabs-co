import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, MessagesSquare } from 'lucide-react';
import { requireStaff } from '@/lib/auth/session';
import { getWorkspace, activeChannelCount } from '@/lib/messaging/workspaces';
import { listConnections, listOpenConnectLinks } from '@/lib/messaging/connections';
import { listDeliveries } from '@/lib/messaging/deliveries';
import { env, metaConfigured } from '@/lib/messaging/env';
import { now } from '@/lib/messaging/db';
import { listMembers, listPendingInvites } from '@/lib/accounts/accounts';
import { pageLimit } from '@/lib/billing/entitlements';
import { Card, FacebookIcon, Notice, PageHeader, formatDate, inputCls, labelCls, primaryBtn, relativeTime, secondaryBtn, Badge } from '@/components/console/ui';
import { SecretField, StatusForm, SubmitButton } from '@/components/console/client';
import { BillingBadge, billingSummary } from '@/components/console/billing';
import { ConnectLinkForm, ForwardingForm, RotateSecretForm } from '@/components/messaging/panels';
import { ConnectionsList, DeliveriesTable } from '@/components/messaging/lists';
import { WaCoexistenceNote, WaNumberList } from '@/components/whatsapp/NumberList';
import { ConnectWhatsApp } from '@/components/whatsapp/ConnectWhatsApp';
import { DirectConnectForm } from '@/components/whatsapp/DirectConnectForm';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { whatsappConfigured } from '@/lib/messaging/env';
import {
  connectNowAction, createConnectLinkAction, disconnectAction, inviteClientAction, retryDeliveryAction, revokeLinkAction,
  staffConnectWhatsAppAction, staffConnectWhatsAppDirectAction, staffDisconnectWhatsAppAction, staffRetryWhatsAppSyncAction,
  rotateSecretAction, setComplimentaryAction, staffRemoveMemberAction, staffRevokeInviteAction, testDeliveryAction, updateWorkspaceAction,
} from '@/app/console/actions';

function stripeDashboardUrl(customerId: string) {
  const test = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  return `https://dashboard.stripe.com/${test ? 'test/' : ''}customers/${customerId}`;
}

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const workspace = getWorkspace(Number(id));
  if (!workspace) notFound();

  const nowMs = now();
  const connections = listConnections(workspace.id);
  const links = listOpenConnectLinks(workspace.id);
  const deliveries = listDeliveries(workspace.id);
  const members = listMembers(workspace.id);
  const invites = listPendingInvites(workspace.id);
  const configured = metaConfigured();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Workspace"
        title={workspace.name}
        description={<span className="inline-flex flex-wrap items-center gap-2">Created {formatDate(workspace.created_at)} <BillingBadge w={workspace} nowMs={nowMs} /></span>}
        actions={<Link href={`/console/inbox?w=${workspace.id}`} className={secondaryBtn}><MessagesSquare size={15} /> Open inbox</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Connected accounts"
            description={`Facebook Pages and their linked Instagram professional accounts · ${activeChannelCount(workspace.id)} of ${pageLimit(workspace)} channels used (Pages and WhatsApp numbers together)`}
            actions={configured && (
              <form action={connectNowAction}>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <SubmitButton className={primaryBtn} pendingText="Opening…"><FacebookIcon size={15} /> Connect Facebook &amp; Instagram</SubmitButton>
              </form>
            )}
          >
            {!configured && <div className="mb-4"><Notice tone="amber">Meta isn&rsquo;t configured on this server, so accounts can&rsquo;t be connected yet.</Notice></div>}
            <ConnectionsList
              connections={connections}
              disconnectAction={disconnectAction}
              emptyHint={<>Use <strong>Connect Facebook &amp; Instagram</strong>{' '}if you manage the client&rsquo;s Page, or create a connect link for their Page admin.</>}
            />
          </Card>

          <Card
            title="WhatsApp numbers"
            description="Connect the client's WhatsApp Business app number (chats keep working on their phone), or a new API-only number."
            actions={whatsappConfigured() && (
              <ConnectWhatsApp
                appId={env.metaAppId()}
                configId={env.metaWhatsAppConfigId()}
                onComplete={async (payload) => {
                  'use server';
                  return staffConnectWhatsAppAction({ ...payload, workspaceId: workspace.id });
                }}
              />
            )}
          >
            <WaNumberList
              nowMs={nowMs}
              numbers={listWaNumbers(workspace.id)}
              disconnectAction={staffDisconnectWhatsAppAction}
              retrySyncAction={staffRetryWhatsAppSyncAction}
              emptyHint="Connect here if you manage the client's WhatsApp, or send them the onboarding link below."
            />
            <p className="mt-3 text-xs text-ink-dull"><WaCoexistenceNote /></p>
            {configured && <div className="mt-4"><DirectConnectForm workspaceId={workspace.id} action={staffConnectWhatsAppDirectAction} /></div>}
          </Card>

          <Card title="Client onboarding link" description="For when someone at the client business administers the Page or WhatsApp number.">
            <div className="space-y-4">
              <ConnectLinkForm workspaceId={workspace.id} action={createConnectLinkAction} />
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

          <Card title="Client team" description="People who can sign in to this workspace's client portal.">
            <div className="space-y-5">
              {members.length === 0 ? (
                <p className="text-sm text-ink-dim">No client users yet. Invite the client&rsquo;s owner so they can manage billing, connections and API keys themselves.</p>
              ) : (
                <ul className="divide-y divide-line-sub">
                  {members.map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-ink">{m.name} <Badge tone={m.role === 'owner' ? 'blue' : 'gray'}>{m.role}</Badge></div>
                        <div className="truncate text-xs text-ink-dim">{m.email}</div>
                      </div>
                      <form action={staffRemoveMemberAction}>
                        <input type="hidden" name="workspaceId" value={workspace.id} />
                        <input type="hidden" name="userId" value={m.user_id} />
                        <button className="text-xs text-red-500 hover:underline">Remove</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              {invites.length > 0 && (
                <ul className="space-y-2">
                  {invites.map((i) => (
                    <li key={i.token_hash} className="flex items-center justify-between gap-3 rounded-lg border border-line-sub px-3 py-2 text-xs text-ink-dim">
                      <span className="truncate">Invited {i.email} as {i.role} · expires {relativeTime(i.expires_at)}</span>
                      <form action={staffRevokeInviteAction}>
                        <input type="hidden" name="workspaceId" value={workspace.id} />
                        <input type="hidden" name="tokenHash" value={i.token_hash} />
                        <button className="text-red-500 hover:underline">Revoke</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <StatusForm action={inviteClientAction} submitLabel="Send invitation" pendingText="Sending…" submitClassName={secondaryBtn} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" resetOnSuccess>
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <div>
                  <label htmlFor="invite-email" className={labelCls}>Email</label>
                  <input id="invite-email" name="email" type="email" required placeholder="owner@client.com" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="invite-role" className={labelCls}>Role</label>
                  <select id="invite-role" name="role" defaultValue="owner" className={inputCls}>
                    <option value="owner">Owner</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              </StatusForm>
            </div>
          </Card>

          <Card title="Deliveries to client" description="Most recent forwarded events. Failed events retry with backoff for about a day; delivery is held while billing is inactive.">
            <DeliveriesTable deliveries={deliveries} workspaceId={workspace.id} retryAction={retryDeliveryAction} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Billing">
            <div className="space-y-4">
              <p className="text-sm text-ink-dim">{billingSummary(workspace, nowMs)}</p>
              {workspace.stripe_customer_id && (
                <a href={stripeDashboardUrl(workspace.stripe_customer_id)} target="_blank" rel="noreferrer noopener" className={`${secondaryBtn} w-full`}>
                  <ExternalLink size={14} /> Open in Stripe
                </a>
              )}
              <StatusForm action={setComplimentaryAction} submitLabel="Save override" pendingText="Saving…" submitClassName={secondaryBtn} className="space-y-3 border-t border-line-sub pt-4">
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="complimentary" defaultChecked={Boolean(workspace.complimentary)} className="accent-current" />
                  Complimentary (no subscription needed, never paused)
                </label>
                <div>
                  <label htmlFor="pageLimit" className={labelCls}>Channel limit override</label>
                  <input id="pageLimit" name="pageLimit" type="number" min={0} max={500} defaultValue={workspace.page_limit_override ?? ''} placeholder="Use plan limit" className={inputCls} />
                </div>
              </StatusForm>
            </div>
          </Card>
          <Card title="Settings">
            <ForwardingForm workspaceId={workspace.id} name={workspace.name} forwardUrl={workspace.forward_url} saveAction={updateWorkspaceAction} testAction={testDeliveryAction} />
          </Card>
          <Card title="API credentials" description="Used by the client system to verify forwarded events and call the Send API.">
            <div className="space-y-4">
              <SecretField label="API key" value={workspace.api_key} />
              <RotateSecretForm workspaceId={workspace.id} action={rotateSecretAction} />
              <p className="text-xs text-ink-dim">Integration guide: <Link href="/developers/messaging-api" className="text-ink underline">/developers/messaging-api</Link></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
