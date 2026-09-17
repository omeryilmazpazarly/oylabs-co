import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, MessagesSquare, Paperclip, Trash2 } from 'lucide-react';
import { getConversation, listConversations, listMessages, messagingWindow, type MessageRow } from '@/lib/messaging/conversations';
import { env } from '@/lib/messaging/env';
import { now } from '@/lib/messaging/db';
import { ChannelBadge, ConnectionStatusBadge, EmptyState, Notice, dangerBtn, formatDate, relativeTime } from '@/components/console/ui';
import { ConfirmAction } from '@/components/console/client';
import ReplyBox, { type ReplyState } from './ReplyBox';
import { TemplateSend, type SendableTemplate } from '@/components/whatsapp/TemplateSend';
import AutoRefresh from './AutoRefresh';

/**
 * Conversation list + thread + reply box for one workspace. Used by the staff
 * console and the client portal; each passes its own (authorised) actions.
 */

interface Props {
  workspaceId: number;
  workspaceName: string;
  conversationId?: number;
  /** Builds the URL for a conversation (or the list when undefined). */
  hrefFor: (conversationId?: number) => string;
  replyAction: (prev: ReplyState, formData: FormData) => Promise<ReplyState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  reconnectHref: string;
  deletedCode?: string;
  /** Explains why replies are blocked (e.g. subscription paused), if they are. */
  replyBlockedReason?: ReactNode;
  /** WhatsApp: approved templates and the action that sends one (needed once the 24-hour window closes). */
  templates?: SendableTemplate[];
  sendTemplateAction?: (prev: ReplyState, formData: FormData) => Promise<ReplyState>;
}

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

const SOURCE_LABEL: Record<string, string> = {
  console: 'OY Labs',
  api: 'Client system',
  page_inbox: 'Meta inbox',
  business_app: 'WhatsApp app',
  history: 'Imported from WhatsApp',
};

const STATUS_LABEL: Record<string, string> = { delivered: 'delivered', read: 'read', failed: 'failed' };

function MessageBubble({ m, publicId }: { m: MessageRow; publicId: string }) {
  const outbound = m.direction === 'outbound';
  const via = m.source === 'console' && m.sent_by_name ? `${m.sent_by_name} · OY Labs` : SOURCE_LABEL[m.source] ?? null;
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${outbound ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${outbound ? 'bg-cta text-cta-fg rounded-br-md' : 'border border-line bg-elevated text-ink rounded-bl-md'}`}>
          {m.postback && <div className={`mb-1 text-[11px] uppercase tracking-wide ${outbound ? 'opacity-70' : 'text-ink-dim'}`}>Button tapped</div>}
          {m.template && <div className={`mb-1 text-[11px] uppercase tracking-wide ${outbound ? 'opacity-70' : 'text-ink-dim'}`}>Template · {m.template.name}</div>}
          {m.text}
          {m.attachments.map((a, i) => {
            // WhatsApp media is fetched from Meta on demand; Messenger gives a direct CDN link.
            const href = a.mediaId ? `/api/media/${publicId}/${i}` : a.url;
            return (
              <div key={i} className={m.text ? 'mt-2' : ''}>
                {a.type === 'image' && href
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={href} alt="Image attachment" className="max-h-60 rounded-lg" referrerPolicy="no-referrer" />
                  : a.type === 'sticker' && href
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={href} alt="Sticker" className="max-h-28" referrerPolicy="no-referrer" />
                  : a.type === 'audio' && href
                  ? <audio controls src={href} className="max-w-full" />
                  : a.type === 'video' && href
                  ? <video controls src={href} className="max-h-60 rounded-lg" />
                  : <span className="inline-flex items-center gap-1.5"><Paperclip size={13} /> {a.filename || `${a.type} attachment`}{href && <>{' '}<a href={href} target="_blank" rel="noreferrer noopener" className="underline">open</a></>}</span>}
              </div>
            );
          })}
        </div>
        <div className="px-1 text-[11px] text-ink-dull">
          {formatDate(m.meta_timestamp)}{via && ` · ${via}`}
          {outbound && STATUS_LABEL[m.status] && ` · ${STATUS_LABEL[m.status]}`}
          {m.error && ` · ${m.error}`}
        </div>
      </div>
    </div>
  );
}

export default function InboxView({ workspaceId, workspaceName, conversationId, hrefFor, replyAction, deleteAction, reconnectHref, deletedCode, replyBlockedReason, templates, sendTemplateAction }: Props) {
  const conversations = listConversations(workspaceId);
  const found = conversationId ? getConversation(conversationId) : null;
  const conversation = found && found.workspace_id === workspaceId ? found : null; // never show another workspace's thread
  const messages = conversation ? listMessages(conversation.id) : [];
  const nowMs = now();
  const window = conversation ? messagingWindow(conversation.last_inbound_at, nowMs, env.humanAgentApproved()) : null;

  return (
    <>
      <AutoRefresh />
      {deletedCode && (
        <div className="mb-4"><Notice tone="green">Conversation data deleted. Confirmation code <code className="font-mono">{deletedCode}</code>{' '}— include it in your reply to the requester.</Notice></div>
      )}
      <div className="grid h-[calc(100vh-15rem)] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-panel lg:grid-cols-[320px_1fr]">
        <aside className={`${conversation ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-line-sub lg:border-r`}>
          <div className="border-b border-line-sub px-4 py-3 text-xs text-ink-dim">{workspaceName} · {conversations.length} conversation{conversations.length === 1 ? '' : 's'}</div>
          {conversations.length === 0 ? (
            <EmptyState icon={<MessagesSquare size={18} />} title="No conversations yet">
              When a customer messages a connected Page, Instagram account or WhatsApp number, the conversation appears here within seconds.
            </EmptyState>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-line-sub overflow-y-auto">
              {conversations.map((c) => {
                const open = messagingWindow(c.last_inbound_at, nowMs, false).kind === 'open';
                return (
                  <li key={c.id}>
                    <Link href={hrefFor(c.id)} className={`flex gap-3 px-4 py-3 transition-colors ${conversation?.id === c.id ? 'bg-elevated' : 'hover:bg-elevated/60'}`}>
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

        <section className={`${conversation ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
          {!conversation || !window ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={<MessagesSquare size={18} />} title="Select a conversation" />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line-sub px-4 py-3">
                <Link href={hrefFor()} className="rounded-md p-1 text-ink-dim hover:text-ink lg:hidden" aria-label="Back to conversations"><ArrowLeft size={16} /></Link>
                <Avatar name={conversation.participant_name} picture={conversation.participant_picture} id={conversation.participant_id} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{conversation.participant_name ?? `Customer ${conversation.participant_id.slice(-4)}`}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
                    <ChannelBadge channel={conversation.channel} />
                    <span className="truncate">via {conversation.channel === 'instagram' ? `@${conversation.ig_username ?? 'instagram'}` : conversation.channel === 'whatsapp' ? conversation.wa_display_phone ?? conversation.page_name : conversation.page_name}</span>
                    {conversation.connection_status !== 'active' && <ConnectionStatusBadge status={conversation.connection_status} />}
                  </div>
                </div>
                {deleteAction && (
                  <ConfirmAction
                    action={deleteAction}
                    fields={{ conversationId: conversation.id }}
                    confirm="Permanently delete this conversation and its messages from OY Labs? Use this for a person's deletion request."
                    className={`${dangerBtn} px-2.5 py-1.5 text-xs`}
                  >
                    <Trash2 size={13} /> <span className="hidden sm:inline">Delete data</span>
                  </ConfirmAction>
                )}
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 flex flex-col-reverse">
                <div className="space-y-3">
                  {messages.map((m) => <MessageBubble key={m.id} m={m} publicId={m.public_id} />)}
                </div>
              </div>
              {replyBlockedReason ? (
                <div className="border-t border-line-sub p-4 text-xs text-ink-dim">{replyBlockedReason}</div>
              ) : conversation.connection_status === 'active' ? (
                conversation.channel === 'whatsapp' && window.kind === 'closed' && sendTemplateAction ? (
                  <div className="border-t border-line-sub p-4">
                    <TemplateSend
                      action={sendTemplateAction}
                      templates={templates ?? []}
                      conversationId={conversation.id}
                      hint="More than 24 hours have passed since their last message, so WhatsApp only allows an approved template."
                    />
                  </div>
                ) : (
                  <ReplyBox
                    action={replyAction}
                    conversationId={conversation.id}
                    windowKind={window.kind}
                    closesLabel={window.kind === 'closed' ? null : formatDate(window.closesAt)}
                    maxLength={conversation.channel === 'instagram' ? 1000 : conversation.channel === 'whatsapp' ? 4096 : 2000}
                  />
                )
              ) : (
                <div className="border-t border-line-sub p-4 text-xs text-ink-dim">
                  {conversation.connection_status === 'reconnect_needed'
                    ? <>Meta rejected the access token for this {conversation.channel === 'whatsapp' ? 'WhatsApp number' : 'Page'}, so replies are paused.{' '}<Link href={reconnectHref} className="text-ink underline">Reconnect it</Link>{' '}to resume.</>
                    : 'This account is disconnected, so replies are unavailable.'}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
