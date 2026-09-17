import Link from 'next/link';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { serviceState } from '@/lib/billing/entitlements';
import { PageHeader, secondaryBtn } from '@/components/console/ui';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { sendableTemplates } from '@/lib/whatsapp/templates';
import InboxView from '@/components/messaging/InboxView';
import { clientDeleteConversationAction, clientReplyAction, sendTemplateAction } from '../actions';

export default async function PortalInboxPage({ searchParams }: { searchParams: Promise<{ c?: string; deleted?: string }> }) {
  const params = await searchParams;
  const ctx = await requireClient();
  const active = serviceState(ctx.workspace, now()).active;
  const hasWhatsApp = listWaNumbers(ctx.workspace.id).some((n) => n.status === 'active');
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Messaging"
        title="Inbox"
        description="Messenger, Instagram and WhatsApp conversations with your customers. Meta allows free replies within 24 hours of the customer's last message; after that WhatsApp needs an approved template."
        actions={hasWhatsApp && active && <Link href="/app/inbox/new" className={secondaryBtn}>New WhatsApp message</Link>}
      />
      <InboxView
        workspaceId={ctx.workspace.id}
        workspaceName={ctx.workspace.name}
        conversationId={params.c ? Number(params.c) : undefined}
        hrefFor={(c) => (c ? `/app/inbox?c=${c}` : '/app/inbox')}
        replyAction={clientReplyAction}
        deleteAction={ctx.role === 'owner' ? clientDeleteConversationAction : undefined}
        reconnectHref="/app/connections"
        deletedCode={params.deleted}
        templates={sendableTemplates(ctx.workspace.id)}
        sendTemplateAction={sendTemplateAction}
        replyBlockedReason={active ? undefined : <>Replies are paused until billing is active.{' '}{ctx.role === 'owner' && <Link href="/app/billing" className="text-ink underline">Go to billing</Link>}</>}
      />
    </div>
  );
}
