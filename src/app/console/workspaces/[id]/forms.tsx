'use client';

import { useActionState } from 'react';
import { Link2, RefreshCw, Send } from 'lucide-react';
import {
  createConnectLinkAction, rotateSecretAction, testDeliveryAction, updateWorkspaceAction,
  type FormResult, type LinkState, type SecretState,
} from '../../actions';
import { SecretField, SubmitButton } from '@/components/console/client';
import { Notice, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';

export function SettingsForm({ workspaceId, name, forwardUrl }: { workspaceId: number; name: string; forwardUrl: string | null }) {
  const [saveState, save] = useActionState<FormResult, FormData>(updateWorkspaceAction, { status: 'idle' });
  const [testState, test] = useActionState<FormResult, FormData>(testDeliveryAction, { status: 'idle' });
  return (
    <div className="space-y-4">
      <form action={save} className="space-y-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <div>
          <label htmlFor="name" className={labelCls}>Name</label>
          <input id="name" name="name" defaultValue={name} required className={inputCls} />
        </div>
        <div>
          <label htmlFor="forwardUrl" className={labelCls}>Forwarding webhook URL</label>
          <input id="forwardUrl" name="forwardUrl" type="url" defaultValue={forwardUrl ?? ''} placeholder="https://…" className={inputCls} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton className={primaryBtn} pendingText="Saving…">Save</SubmitButton>
          {saveState.status !== 'idle' && <span className={`text-xs ${saveState.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{saveState.message}</span>}
        </div>
      </form>
      <form action={test} className="flex flex-wrap items-center gap-2 border-t border-line-sub pt-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <SubmitButton className={secondaryBtn} pendingText="Sending…"><Send size={14} /> Send signed test event</SubmitButton>
        {testState.status !== 'idle' && <span className={`text-xs ${testState.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{testState.message}</span>}
      </form>
    </div>
  );
}

export function RotateSecretForm({ workspaceId }: { workspaceId: number }) {
  const [state, action] = useActionState<SecretState, FormData>(rotateSecretAction, { status: 'idle' });
  if (state.status === 'rotated') {
    return (
      <div className="space-y-3">
        <SecretField label="New API secret" value={state.secret} note="Shown once. The previous secret stopped working immediately — update the client system now." />
      </div>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => { if (!window.confirm('Rotate the secret? The current secret stops working immediately.')) e.preventDefault(); }}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton className={secondaryBtn} pendingText="Rotating…"><RefreshCw size={14} /> Rotate API secret</SubmitButton>
    </form>
  );
}

export function ConnectLinkForm({ workspaceId }: { workspaceId: number }) {
  const [state, action] = useActionState<LinkState, FormData>(createConnectLinkAction, { status: 'idle' });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <SubmitButton className={secondaryBtn} pendingText="Creating…"><Link2 size={14} /> Create connect link</SubmitButton>
      {state.status === 'created' && (
        <div className="space-y-2">
          <SecretField label="Send this link to the client's Page admin" value={state.url} note={`Single use. Expires ${new Date(state.expiresAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.`} />
          <Notice>They sign in with Facebook, choose the Page to connect, and the linked Instagram account is picked up automatically.</Notice>
        </div>
      )}
    </form>
  );
}
