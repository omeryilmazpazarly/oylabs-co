'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { inputCls as field, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import type { FormAction, FormResult } from '@/components/messaging/types';
import type { TemplateButton, WaTemplate } from '@/lib/whatsapp/templates';

/**
 * Editor for a WhatsApp message template. Meta needs an example value for
 * every variable, so the form asks for one as soon as a variable is typed.
 */

const LANGUAGES = [
  ['en_US', 'English (US)'], ['en_GB', 'English (UK)'], ['ar', 'Arabic'], ['ar_EG', 'Arabic (Egypt)'],
  ['tr', 'Turkish'], ['fr', 'French'], ['es', 'Spanish'], ['de', 'German'], ['ur', 'Urdu'], ['id', 'Indonesian'],
];

const variablesIn = (text: string) => [...new Set([...text.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]))];

type ButtonDraft = { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phone?: string; example?: string };

export function TemplateForm({ action, wabas, template, canEditBasics }: {
  action: FormAction<FormResult>;
  wabas: { id: string; label: string }[];
  template?: WaTemplate;
  canEditBasics: boolean;
}) {
  const header = template?.components.find((c) => c.type === 'HEADER') as { format?: string; text?: string } | undefined;
  const body = template?.components.find((c) => c.type === 'BODY') as { text?: string } | undefined;
  const footer = template?.components.find((c) => c.type === 'FOOTER') as { text?: string } | undefined;
  const existingButtons = ((template?.components.find((c) => c.type === 'BUTTONS') as { buttons?: TemplateButton[] } | undefined)?.buttons ?? []).map((b): ButtonDraft => ({
    type: b.type, text: b.text, url: b.type === 'URL' ? b.url : '', phone: b.type === 'PHONE_NUMBER' ? b.phone_number : '',
  }));

  const [state, formAction] = useActionState(action, { status: 'idle' } as FormResult);
  const [headerFormat, setHeaderFormat] = useState(header?.format ?? 'NONE');
  const [headerText, setHeaderText] = useState(header?.text ?? '');
  const [bodyText, setBodyText] = useState(body?.text ?? '');
  const [buttons, setButtons] = useState<ButtonDraft[]>(existingButtons);

  const bodyVars = variablesIn(bodyText);
  const headerVars = variablesIn(headerText);

  return (
    <form action={formAction} className="space-y-6">
      {template && <input type="hidden" name="templateId" value={template.id} />}
      {state.status === 'error' && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="name">Template name</label>
          <input id="name" name="name" defaultValue={template?.name} required disabled={!canEditBasics} readOnly={!canEditBasics}
            placeholder="order_update" pattern="[a-z0-9_ ]+" className={field} />
          <p className="mt-1 text-xs text-ink-dull">Lowercase letters, numbers and underscores. It cannot be changed later.</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="language">Language</label>
          <select id="language" name="language" defaultValue={template?.language ?? 'en_US'} disabled={!canEditBasics} className={field}>
            {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name} — {code}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={template?.category ?? 'UTILITY'} className={field}>
            <option value="UTILITY">Utility — order updates, appointments, account notices</option>
            <option value="MARKETING">Marketing — offers, news, invitations</option>
            <option value="AUTHENTICATION">Authentication — one-time codes</option>
          </select>
          <p className="mt-1 text-xs text-ink-dull">Meta charges marketing messages differently and reviews the category.</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="wabaId">WhatsApp account</label>
          <select id="wabaId" name="wabaId" defaultValue={template?.waba_id ?? wabas[0]?.id} disabled={!canEditBasics} className={field}>
            {wabas.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-line p-4">
        <p className="text-sm font-medium text-ink">Header <span className="font-normal text-ink-dull">(optional)</span></p>
        <select name="headerFormat" value={headerFormat} onChange={(e) => setHeaderFormat(e.target.value)} className={field}>
          <option value="NONE">No header</option>
          <option value="TEXT">Text</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Document</option>
        </select>
        {headerFormat === 'TEXT' && (
          <>
            <input name="headerText" value={headerText} onChange={(e) => setHeaderText(e.target.value)} maxLength={60} placeholder="Order {{1}} is on its way" className={field} />
            {headerVars.length > 0 && (
              <input name="headerExample" required placeholder="Example value, e.g. 1234" className={field} />
            )}
          </>
        )}
        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) && (
          <div>
            <input type="file" name="sample" required={!template} accept={headerFormat === 'IMAGE' ? 'image/*' : headerFormat === 'VIDEO' ? 'video/*' : undefined}
              className="block w-full text-xs text-ink-dull file:mr-3 file:rounded-lg file:border-0 file:bg-surface-hi file:px-3 file:py-2 file:text-xs file:text-ink" />
            <p className="mt-1 text-xs text-ink-dull">WhatsApp needs one example file to approve the template. You choose the real file when you send.</p>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="bodyText">Message</label>
        <textarea id="bodyText" name="bodyText" value={bodyText} onChange={(e) => setBodyText(e.target.value)} required rows={5} maxLength={1024}
          placeholder={'Hello {{1}}, your order {{2}} has shipped.'} className={field} />
        <p className="mt-1 text-xs text-ink-dull">Use {'{{1}}'}, {'{{2}}'} for values you fill in when sending, or names like {'{{order_id}}'}.</p>
        {bodyVars.length > 0 && (
          <div className="mt-3 space-y-2">
            {bodyVars.map((v) => (
              <div key={v}>
                <label className={labelCls} htmlFor={`example-${v}`}>Example for {`{{${v}}}`}</label>
                <input id={`example-${v}`} name="bodyExample" required placeholder="Example value" className={field} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="footer">Footer <span className="font-normal text-ink-dull">(optional)</span></label>
        <input id="footer" name="footer" defaultValue={footer?.text} maxLength={60} placeholder="Reply STOP to unsubscribe" className={field} />
      </div>

      <div className="space-y-3 rounded-xl border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Buttons <span className="font-normal text-ink-dull">(optional)</span></p>
          {buttons.length < 10 && (
            <button type="button" className={secondaryBtn} onClick={() => setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }])}>Add button</button>
          )}
        </div>
        {buttons.map((b, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[10rem,1fr,1fr,auto]">
            <select name={`buttonType${i}`} value={b.type} className={field}
              onChange={(e) => setButtons(buttons.map((x, j) => (j === i ? { ...x, type: e.target.value as ButtonDraft['type'] } : x)))}>
              <option value="QUICK_REPLY">Quick reply</option>
              <option value="URL">Link</option>
              <option value="PHONE_NUMBER">Call</option>
            </select>
            <input name={`buttonText${i}`} value={b.text} maxLength={25} placeholder="Button label" className={field}
              onChange={(e) => setButtons(buttons.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            {b.type === 'URL' && (
              <input name={`buttonUrl${i}`} defaultValue={b.url} placeholder="https://example.com/orders/{{1}}" className={field} />
            )}
            {b.type === 'PHONE_NUMBER' && (
              <input name={`buttonPhone${i}`} defaultValue={b.phone} placeholder="+44 20 1234 5678" className={field} />
            )}
            {b.type === 'QUICK_REPLY' && <span />}
            <button type="button" className="text-xs text-red-300 hover:text-red-200" onClick={() => setButtons(buttons.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton className={primaryBtn} pendingText="Sending to WhatsApp…">{template ? 'Save and resubmit' : 'Create template'}</SubmitButton>
        <Link href="/app/templates" className={secondaryBtn}>Cancel</Link>
        <p className="text-xs text-ink-dull">WhatsApp reviews new and edited templates, usually within minutes.</p>
      </div>
    </form>
  );
}
