import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { requireStaff } from '@/lib/auth/session';
import { listWorkspaces } from '@/lib/messaging/workspaces';
import { EmptyState, PageHeader } from '@/components/console/ui';
import InboxView from '@/components/messaging/InboxView';
import { deleteConversationAction, sendReplyAction } from '@/app/console/actions';

type Search = { w?: string; c?: string; deleted?: string };

export default async function ConsoleInboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff();
  const params = await searchParams;
  const workspaces = listWorkspaces();
  const selected = workspaces.find((w) => String(w.id) === params.w) ?? workspaces[0];

  if (!selected) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader eyebrow="Messaging" title="Inbox" />
        <EmptyState icon={<Inbox size={18} />} title="No workspaces yet">Create a workspace and connect a Page to start receiving messages.</EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Messaging"
        title="Inbox"
        description="Messenger and Instagram conversations for every client workspace. Replies go through the same Send API clients use."
        actions={workspaces.length > 1 && (
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-panel p-1">
            {workspaces.map((w) => (
              <Link key={w.id} href={`/console/inbox?w=${w.id}`} className={`rounded-md px-3 py-1.5 text-xs ${w.id === selected.id ? 'bg-elevated text-ink' : 'text-ink-dim hover:text-ink'}`}>{w.name}</Link>
            ))}
          </div>
        )}
      />
      <InboxView
        workspaceId={selected.id}
        workspaceName={selected.name}
        conversationId={params.c ? Number(params.c) : undefined}
        hrefFor={(c) => `/console/inbox?w=${selected.id}${c ? `&c=${c}` : ''}`}
        replyAction={sendReplyAction}
        deleteAction={deleteConversationAction}
        reconnectHref={`/console/workspaces/${selected.id}`}
        deletedCode={params.deleted}
      />
    </div>
  );
}
