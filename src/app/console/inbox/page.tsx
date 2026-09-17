import Link from 'next/link';
import { ArrowLeft, Inbox, MessagesSquare, Paperclip, Trash2 } from 'lucide-react';
import { listWorkspaces } from '@/lib/messaging/workspaces';
import { getConversation, listConversations, listMessages, messagingWindow, type MessageRow } from '@/lib/messaging/conversations';
import { env } from '@/lib/messaging/env';
import { now } from '@/lib/messaging/db';
import { ChannelBadge, ConnectionStatusBadge, EmptyState, Notice, PageHeader, dangerBtn, formatDate, relativeTime } from '@/components/console/ui';
import { ConfirmAction } from '@/components/console/client';
import { deleteConversationAction } from '../actions';
import ReplyBox from './ReplyBox';
import AutoRefresh from './AutoRefresh';

type Search = { w?: string; c?: string; deleted?: string };

function initials(name: string | null, fallback: string) {
  const source = name?.replace(/^@/, '') || fallback;
  return source.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ name, picture, id }: { name: string | null; picture: string | null; id: string }) {
  if (picture) {
    // Meta profile picture URLs are short-lived CDN links; plain <img> avoids caching them through next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture} alt="" className="h-9 w-9 shrink-0 rounded-full border border-line object-cover" referrerPolicy="no-referrer" />;
  }
  return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-elevated text-[11px] font-semibold text-ink-dim">{initials(name, id)}</div>;
}

function MessageBubble({ m }: { m: MessageRow }) {
  const outbound = m.direction === 'outbound';
  const via = m.source === 'console' ? (m.sent_by_name ? `${m.sent_by_name} · console` : 'Console') : m.source === 'api' ? 'Client system' : m.source === 'page_inbox' ? 'Meta inbox' : null;
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${outbound ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${outbound ? 'bg-cta text-cta-fg rounded-br-md' : 'border border-line bg-elevated text-ink rounded-bl-md'}`}>
          {m.postback && <div className={`mb-1 text-[11px] uppercase tracking-wide ${outbound ? 'opacity-70' : 'text-ink-dim'}`}>Button tapped</div>}
          {m.text}
          {m.attachments.map((a, i) => (
            <div key={i} className={m.text ? 'mt-2' : ''}>
              {a.type === 'image' && a.url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.url} alt="Image attachment" className="max-h-60 rounded-lg" referrerPolicy="no-referrer" />
                : <span className="inline-flex items-center gap-1.5"><Paperclip size={13} /> {a.type} attachment{a.url && <a href={a.url} target="_blank" rel="noreferrer noopener" className="underline">open</a>}</span>}
            </div>
          ))}
        </div>
        <div className="px-1 text-[11px] text-ink-dull">
          {formatDate(m.meta_timestamp)}{via && ` · ${via}`}{m.status === 'failed' && ' · failed'}
        </div>
      </div>
    </div>
  );
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<Search> }) {
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

  const conversations = listConversations(selected.id);
  const active = params.c ? getConversation(Number(params.c)) : null;
  const conversation = active && active.workspace_id === selected.id ? active : null;
  const messages = conversation ? listMessages(conversation.id) : [];
  const nowMs = now();
  const window = conversation ? messagingWindow(conversation.last_inbound_at, nowMs, env.humanAgentApproved()) : null;
  const href = (c?: number) => `/console/inbox?w=${selected.id}${c ? `&c=${c}` : ''}`;

  return (
    <div className="mx-auto max-w-7xl">
      <AutoRefresh />
      <PageHeader
        eyebrow="Messaging"
        title="Inbox"
        description="Messenger and Instagram conversations for connected client accounts. Replies go through the same Send API clients use."
        actions={workspaces.length > 1 && (
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-panel p-1">
            {workspaces.map((w) => (
              <Link key={w.id} href={`/console/inbox?w=${w.id}`} className={`rounded-md px-3 py-1.5 text-xs ${w.id === selected.id ? 'bg-elevated text-ink' : 'text-ink-dim hover:text-ink'}`}>{w.name}</Link>
            ))}
          </div>
        )}
      />

      {params.deleted && (
        <div className="mb-4"><Notice tone="green">Conversation data deleted. Confirmation code <code className="font-mono">{params.deleted}</code>{' '}— include it in your reply to the requester.</Notice></div>
      )}

      <div className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-panel lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <aside className={`${conversation ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-line-sub lg:border-r`}>
          <div className="border-b border-line-sub px-4 py-3 text-xs text-ink-dim">{selected.name} · {conversations.length} conversation{conversations.length === 1 ? '' : 's'}</div>
          {conversations.length === 0 ? (
            <EmptyState icon={<MessagesSquare size={18} />} title="No conversations yet">
              When a customer messages a connected Page or Instagram account, the conversation appears here within seconds.
            </EmptyState>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-line-sub overflow-y-auto">
              {conversations.map((c) => {
                const open = messagingWindow(c.last_inbound_at, nowMs, false).kind === 'open';
                return (
                  <li key={c.id}>
                    <Link href={href(c.id)} className={`flex gap-3 px-4 py-3 transition-colors ${conversation?.id === c.id ? 'bg-elevated' : 'hover:bg-elevated/60'}`}>
                      <Avatar name={c.participant_name} picture={c.participant_picture} id={c.participant_id} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">{c.participant_name ?? `Customer ${c.participant_id.slice(-4)}`}</span>
                          <span className="shrink-0 text-[11px] text-ink-dull">{relativeTime(c.last_message_at, nowMs)}</span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-ink-dim">{c.last_message_preview || '—'}</div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <ChannelBadge channel={c.channel} />
                          {open && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="24-hour window open" />}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Thread */}
        <section className={`${conversation ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
          {!conversation || !window ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<MessagesSquare size={18} />} title="Select a conversation" />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line-sub px-4 py-3">
                <Link href={href()} className="rounded-md p-1 text-ink-dim hover:text-ink lg:hidden" aria-label="Back to conversations"><ArrowLeft size={16} /></Link>
                <Avatar name={conversation.participant_name} picture={conversation.participant_picture} id={conversation.participant_id} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{conversation.participant_name ?? `Customer ${conversation.participant_id.slice(-4)}`}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
                    <ChannelBadge channel={conversation.channel} />
                    <span className="truncate">via {conversation.channel === 'instagram' ? `@${conversation.ig_username ?? 'instagram'}` : conversation.page_name}</span>
                    {conversation.connection_status !== 'active' && <ConnectionStatusBadge status={conversation.connection_status} />}
                  </div>
                </div>
                <ConfirmAction
                  action={deleteConversationAction}
                  fields={{ conversationId: conversation.id }}
                  confirm="Permanently delete this conversation and its messages from OY Labs? Use this for a person's deletion request."
                  className={`${dangerBtn} px-2.5 py-1.5 text-xs`}
                >
                  <Trash2 size={13} /> <span className="hidden sm:inline">Delete data</span>
                </ConfirmAction>
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 flex flex-col-reverse">
                <div className="space-y-3">
                  {messages.map((m) => <MessageBubble key={m.id} m={m} />)}
                </div>
              </div>
              {conversation.connection_status === 'active' ? (
                <ReplyBox
                  conversationId={conversation.id}
                  windowKind={window.kind}
                  closesLabel={window.kind === 'closed' ? null : formatDate(window.closesAt)}
                  maxLength={conversation.channel === 'instagram' ? 1000 : 2000}
                />
              ) : (
                <div className="border-t border-line-sub p-4 text-xs text-ink-dim">
                  {conversation.connection_status === 'reconnect_needed'
                    ? <>Meta rejected this Page&rsquo;s access token, so replies are paused. <Link href={`/console/workspaces/${selected.id}`} className="text-ink underline">Reconnect the Page</Link>{' '}to resume.</>
                    : 'This account is disconnected, so replies are unavailable.'}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
