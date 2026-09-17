import Link from 'next/link';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { serviceState } from '@/lib/billing/entitlements';
import { PageHeader } from '@/components/console/ui';
import InboxView from '@/components/messaging/InboxView';
import { clientDeleteConversationAction, clientReplyAction } from '../actions';

export default async function PortalInboxPage({ searchParams }: { searchParams: Promise<{ c?: string; deleted?: string }> }) {
  const params = await searchParams;
  const ctx = await requireClient();
  const active = serviceState(ctx.workspace, now()).active;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Messaging" title="Inbox" description="Messenger and Instagram conversations with your customers. Meta allows replies within 24 hours of the customer's last message." />
      <InboxView
        workspaceId={ctx.workspace.id}
        workspaceName={ctx.workspace.name}
        conversationId={params.c ? Number(params.c) : undefined}
        hrefFor={(c) => (c ? `/app/inbox?c=${c}` : '/app/inbox')}
        replyAction={clientReplyAction}
        deleteAction={ctx.role === 'owner' ? clientDeleteConversationAction : undefined}
        reconnectHref="/app/connections"
        deletedCode={params.deleted}
        replyBlockedReason={active ? undefined : <>Replies are paused until billing is active.{' '}{ctx.role === 'owner' && <Link href="/app/billing" className="text-ink underline">Go to billing</Link>}</>}
      />
    </div>
  );
}
