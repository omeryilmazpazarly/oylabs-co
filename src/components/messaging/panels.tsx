'use client';

import { useActionState } from 'react';
import { Link2, RefreshCw, Send } from 'lucide-react';
import { SecretField, SubmitButton } from '@/components/console/client';
import { Notice, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import type { FormAction, FormResult, LinkState, SecretState } from './types';

/* Client-side forms shared by the staff console and the client portal. Each caller passes its own authorised actions. */

export function ForwardingForm({ workspaceId, name, forwardUrl, saveAction, testAction, showName = true, canEdit = true }: {
  workspaceId: number;
  name: string;
  forwardUrl: string | null;
  saveAction: FormAction<FormResult>;
  testAction: FormAction<FormResult>;
  showName?: boolean;
  canEdit?: boolean;
}) {
  const [saveState, save] = useActionState<FormResult, FormData>(saveAction, { status: 'idle' });
  const [testState, test] = useActionState<FormResult, FormData>(testAction, { status: 'idle' });
  return (
    <div className="space-y-4">
      <form action={save} className="space-y-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        {showName ? (
          <div>
            <label htmlFor="ws-name" className={labelCls}>Name</label>
            <input id="ws-name" name="name" defaultValue={name} required disabled={!canEdit} className={inputCls} />
          </div>
        ) : <input type="hidden" name="name" value={name} />}
        <div>
          <label htmlFor="forwardUrl" className={labelCls}>Forwarding webhook URL</label>
          <input id="forwardUrl" name="forwardUrl" type="url" defaultValue={forwardUrl ?? ''} placeholder="https://your-system.example/webhooks/oylabs" disabled={!canEdit} className={inputCls} />
          <p className="mt-1.5 text-xs text-ink-dim">Leave empty if you only use the OY Labs inbox.</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <SubmitButton className={primaryBtn} pendingText="Saving…">Save</SubmitButton>
            {saveState.status !== 'idle' && <span role="status" className={`text-xs ${saveState.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{saveState.message}</span>}
          </div>
        )}
      </form>
      <form action={test} className="flex flex-wrap items-center gap-2 border-t border-line-sub pt-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <SubmitButton className={secondaryBtn} pendingText="Sending…"><Send size={14} /> Send signed test event</SubmitButton>
        {testState.status !== 'idle' && <span role="status" className={`text-xs ${testState.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{testState.message}</span>}
      </form>
    </div>
  );
}

export function RotateSecretForm({ workspaceId, action }: { workspaceId: number; action: FormAction<SecretState> }) {
  const [state, formAction] = useActionState<SecretState, FormData>(action, { status: 'idle' });
  if (state.status === 'rotated') {
    return <SecretField label="New API secret" value={state.secret} note="Shown once. The previous secret stopped working immediately — update your system now." />;
  }
  return (
    <form
      action={formAction}
      onSubmit={(e) => { if (!window.confirm('Rotate the secret? The current secret stops working immediately.')) e.preventDefault(); }}
      className="space-y-2"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton className={secondaryBtn} pendingText="Rotating…"><RefreshCw size={14} /> Rotate API secret</SubmitButton>
      {state.status === 'error' && <p className="text-xs text-red-500">{state.message}</p>}
    </form>
  );
}

export function ConnectLinkForm({ workspaceId, action }: { workspaceId: number; action: FormAction<LinkState> }) {
  const [state, formAction] = useActionState<LinkState, FormData>(action, { status: 'idle' });
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton className={secondaryBtn} pendingText="Creating…"><Link2 size={14} /> Create connect link</SubmitButton>
      {state.status === 'error' && <Notice tone="red">{state.message}</Notice>}
      {state.status === 'created' && (
        <div className="space-y-2">
          <SecretField label="Send this link to the Page admin" value={state.url} note={`Single use. Expires ${new Date(state.expiresAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.`} />
          <Notice>They sign in with Facebook, choose the Page to connect, and the linked Instagram account is picked up automatically.</Notice>
        </div>
      )}
    </form>
  );
}
