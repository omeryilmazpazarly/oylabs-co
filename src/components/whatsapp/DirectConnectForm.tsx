'use client';

import { useActionState, useState } from 'react';
import { inputCls, labelCls, secondaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import type { FormAction, FormResult } from '@/components/messaging/types';

/**
 * Staff-only: connect a WhatsApp number with a system-user token from Meta
 * Business Settings. Works without Tech Provider approval, for businesses
 * whose Meta settings OY Labs manages. Not for Coexistence.
 */
export function DirectConnectForm({ workspaceId, action }: { workspaceId: number; action: FormAction<FormResult> }) {
  const [state, formAction] = useActionState(action, { status: 'idle' } as FormResult);
  const [open, setOpen] = useState(false);
  const [register, setRegister] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink-dim underline hover:text-ink">
        Connect directly with a system-user token (no Tech Provider needed)
      </button>
    );
  }
  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-line p-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <p className="text-xs leading-relaxed text-ink-dim">
        For a number in a business you manage. In Meta Business Settings: <strong>Users → System users</strong> → add an admin system user → <strong>Assign assets</strong> → the WhatsApp account (full control) and the OY Labs Messaging app → <strong>Generate token</strong> for OY Labs Messaging, expiry <strong>Never</strong>, with whatsapp_business_management and whatsapp_business_messaging.
        The WhatsApp Business app stops working on a number connected this way.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="wabaId">WhatsApp Business Account ID</label>
          <input id="wabaId" name="wabaId" required inputMode="numeric" className={inputCls} placeholder="102030405060708" />
        </div>
        <div>
          <label className={labelCls} htmlFor="phoneNumberId">Phone number ID</label>
          <input id="phoneNumberId" name="phoneNumberId" required inputMode="numeric" className={inputCls} placeholder="109876543210987" />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="token">System-user access token</label>
        <input id="token" name="token" type="password" required autoComplete="off" className={inputCls} placeholder="EAA…" />
        <p className="mt-1 text-xs text-ink-dull">Stored encrypted. Never shown again.</p>
      </div>
      <label className="flex items-center gap-2 text-xs text-ink">
        <input type="checkbox" name="register" checked={register} onChange={(e) => setRegister(e.target.checked)} />
        Register this number for the API (only for a number not yet registered)
      </label>
      {register && (
        <div>
          <label className={labelCls} htmlFor="pin">Choose a 6-digit two-step verification PIN</label>
          <input id="pin" name="pin" required inputMode="numeric" pattern="\d{6}" maxLength={6} className={inputCls} placeholder="123456" />
        </div>
      )}
      {state.status === 'error' && <p className="text-sm text-red-300">{state.message}</p>}
      {state.status === 'ok' && <p className="text-sm text-emerald-300">{state.message}</p>}
      <div className="flex gap-2">
        <SubmitButton className={secondaryBtn} pendingText="Connecting…">Connect number</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-dim hover:text-ink">Cancel</button>
      </div>
    </form>
  );
}
