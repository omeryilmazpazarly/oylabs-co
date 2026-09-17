'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { inputCls, primaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import type { FormAction } from '@/components/messaging/types';
import type { ReplyState } from '@/components/messaging/ReplyBox';

/** The fields a template needs filled in before it can be sent. */
export interface SendableTemplate {
  id: number;
  name: string;
  language: string;
  bodyPreview: string;
  header: 'none' | 'text' | 'media';
  headerFormat?: string;
  bodyVariables: string[];
  urlVariable: boolean;
}

/**
 * Sends an approved template — the only way to message on WhatsApp once the
 * 24-hour window has closed, or to start a conversation.
 */
export function TemplateSend({ action, templates, conversationId, recipientField, hint }: {
  action: FormAction<ReplyState>;
  templates: SendableTemplate[];
  conversationId?: number;
  recipientField?: boolean;
  hint?: string;
}) {
  const [state, formAction] = useActionState(action, { status: 'idle' } as ReplyState);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? 0);
  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  if (templates.length === 0) {
    return <p className="text-xs text-ink-dim">No approved templates yet. Create one in <Link href="/app/templates" className="underline">Message templates</Link> to message outside the 24-hour window.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      {conversationId && <input type="hidden" name="conversationId" value={conversationId} />}
      {hint && <p className="text-xs text-ink-dim">{hint}</p>}
      {recipientField && (
        <input name="phone" required placeholder="WhatsApp number, e.g. +44 7700 900123" className={inputCls} />
      )}
      <select name="templateId" value={templateId} onChange={(e) => setTemplateId(Number(e.target.value))} className={inputCls}>
        {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.language})</option>)}
      </select>
      {template && (
        <>
          <p className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs text-ink-dim whitespace-pre-wrap">{template.bodyPreview}</p>
          {template.header === 'text' && <input name="header" required placeholder="Header value" className={inputCls} />}
          {template.header === 'media' && (
            <input name="header" required type="url" placeholder={`https:// link to the ${(template.headerFormat ?? 'image').toLowerCase()}`} className={inputCls} />
          )}
          {template.bodyVariables.map((v) => (
            <input key={v} name="body" required placeholder={`Value for {{${v}}}`} className={inputCls} />
          ))}
          {template.urlVariable && <input name="url" required placeholder="Value for the link button" className={inputCls} />}
        </>
      )}
      {state.status === 'error' && <p className="text-xs text-red-300">{state.message}</p>}
      {state.status === 'sent' && <p className="text-xs text-emerald-300">Template sent.</p>}
      <SubmitButton className={primaryBtn} pendingText="Sending…">Send template</SubmitButton>
    </form>
  );
}
