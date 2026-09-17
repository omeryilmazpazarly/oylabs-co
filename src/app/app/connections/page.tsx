import Link from 'next/link';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { activeChannelCount } from '@/lib/messaging/workspaces';
import { listConnections } from '@/lib/messaging/connections';
import { env, metaConfigured, whatsappConfigured } from '@/lib/messaging/env';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { pageLimit, serviceState } from '@/lib/billing/entitlements';
import { Card, FacebookIcon, Notice, PageHeader, primaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import { ConnectionsList } from '@/components/messaging/lists';
import { WaCoexistenceNote, WaNumberList } from '@/components/whatsapp/NumberList';
import { ConnectWhatsApp } from '@/components/whatsapp/ConnectWhatsApp';
import { clientConnectAction, clientDisconnectAction, connectWhatsAppAction, disconnectWhatsAppAction, retryWhatsAppSyncAction } from '../actions';

const ERRORS: Record<string, string> = {
  limit: 'You have reached the number of channels your plan includes. Upgrade your plan to connect another.',
  billing: 'Choose a plan (or update billing) before connecting a channel.',
  meta: 'Connecting is temporarily unavailable. Please try again later.',
};

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const ctx = await requireClient();
  const w = ctx.workspace;
  const isOwner = ctx.role === 'owner';
  const used = activeChannelCount(w.id);
  const waNumbers = listWaNumbers(w.id);
  const limit = pageLimit(w);
  const state = serviceState(w, now());
  const active = state.active;
  const atLimit = used >= limit;
  const canConnect = isOwner && active && !atLimit && metaConfigured();

  let reason: React.ReactNode = null;
  if (!isOwner) reason = 'Only workspace owners can connect or disconnect channels.';
  else if (!metaConfigured()) reason = 'Connecting is temporarily unavailable.';
  else if (!active) reason = state.kind === 'no_subscription'
    ? <>Choose a plan to connect your Page.{' '}<Link href="/app/billing" className="underline">Choose a plan</Link></>
    : <>Update billing to connect Pages again.{' '}<Link href="/app/billing" className="underline">Go to billing</Link></>;
  else if (atLimit) reason = <>Your plan includes {limit} channel{limit === 1 ? '' : 's'}.{' '}<Link href="/app/billing" className="underline">Upgrade</Link>{' '}to connect more.</>;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Connections"
        title="Channels"
        description={`${used} of ${limit} channel${limit === 1 ? '' : 's'} connected. A Facebook Page (with its Instagram account) is one channel; a WhatsApp number is one channel.`}
        actions={canConnect && (
          <form action={clientConnectAction}>
            <SubmitButton className={primaryBtn} pendingText="Opening Facebook…"><FacebookIcon size={15} /> Connect Facebook &amp; Instagram</SubmitButton>
          </form>
        )}
      />
      {error && <div className="mb-6"><Notice tone="red">{ERRORS[error] ?? ERRORS.meta}</Notice></div>}
      {reason && <div className="mb-6"><Notice tone="amber">{reason}</Notice></div>}
      <Card>
        <ConnectionsList
          connections={listConnections(w.id)}
          disconnectAction={isOwner ? clientDisconnectAction : undefined}
          emptyHint="You'll sign in with a Facebook account that administers your Page, choose the Page, and we'll pick up its Instagram account automatically."
        />
      </Card>
      <div className="mt-8 mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">WhatsApp</h2>
          <p className="mt-1 text-xs text-ink-dull">Connect the number you already use in the WhatsApp Business app, or a new number for the API.</p>
        </div>
        {canConnect && whatsappConfigured() && (
          <ConnectWhatsApp appId={env.metaAppId()} configId={env.metaWhatsAppConfigId()} onComplete={connectWhatsAppAction} />
        )}
      </div>
      <Card>
        <WaNumberList
          numbers={waNumbers}
          disconnectAction={isOwner ? disconnectWhatsAppAction : undefined}
          retrySyncAction={isOwner ? retryWhatsAppSyncAction : undefined}
          emptyHint="Choosing your WhatsApp Business app number keeps the app on your phone working, and brings your contacts and recent chats across."
        />
      </Card>
      <div className="mt-6">
        <Notice><WaCoexistenceNote /></Notice>
      </div>
      <div className="mt-6">
        <Notice>
          For Instagram messages, turn on <strong>Allow access to messages</strong>{' '}in the Instagram app: Settings → Messages and story replies → Message controls → Connected tools. If a Page shows <em>Reconnect needed</em>, click Connect again and choose the same Page — your history is kept.
        </Notice>
      </div>
    </div>
  );
}
