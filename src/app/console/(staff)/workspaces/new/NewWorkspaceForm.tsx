'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { createWorkspaceAction, type CreateWorkspaceState } from '@/app/console/actions';
import { SecretField, SubmitButton } from '@/components/console/client';
import { Notice, inputCls, labelCls, primaryBtn } from '@/components/console/ui';

export default function NewWorkspaceForm() {
  const [state, action] = useActionState<CreateWorkspaceState, FormData>(createWorkspaceAction, { status: 'idle' });

  if (state.status === 'created') {
    return (
      <div className="space-y-5">
        <Notice tone="green">Workspace created. Copy the API secret now — it is shown only once. You can rotate it later.</Notice>
        <SecretField label="API key" value={state.apiKey} />
        <SecretField label="API secret" value={state.apiSecret} note="Store it in the client system's environment (e.g. OYLABS_API_SECRET). Used to verify forwarded events and sign Send API calls." />
        <Link href={`/console/workspaces/${state.workspaceId}`} className={primaryBtn}>Continue to workspace <ArrowRight size={15} /></Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelCls}>Client business name</label>
        <input id="name" name="name" required maxLength={120} placeholder="Minhaj Kids" className={inputCls} />
      </div>
      <div>
        <label htmlFor="forwardUrl" className={labelCls}>Forwarding webhook URL <span className="normal-case tracking-normal text-ink-dull">(optional)</span></label>
        <input id="forwardUrl" name="forwardUrl" type="url" placeholder="https://minhaj.kids/api/integrations/oylabs/webhook" className={inputCls} />
        <p className="mt-1.5 text-xs text-ink-dim">Inbound Messenger and Instagram messages are POSTed here, signed with the workspace secret.</p>
      </div>
      <div className="rounded-xl border border-line-sub p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="complimentary" defaultChecked className="accent-current" />
          Complimentary (in-house project — no subscription)
        </label>
        <div>
          <label htmlFor="pageLimit" className={labelCls}>Page limit</label>
          <input id="pageLimit" name="pageLimit" type="number" min={0} max={500} defaultValue={3} className={inputCls} />
          <p className="mt-1.5 text-xs text-ink-dim">Untick for a paying client: invite their owner from the workspace page and they choose a plan themselves.</p>
        </div>
      </div>
      {state.status === 'error' && <Notice tone="red">{state.message}</Notice>}
      <SubmitButton className={primaryBtn} pendingText="Creating…">Create workspace</SubmitButton>
    </form>
  );
}
