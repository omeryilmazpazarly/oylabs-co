'use client';

import { useActionState, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { SubmitButton } from '@/components/console/client';
import { primaryBtn } from '@/components/console/ui';

export type ReplyState = { status: 'idle' } | { status: 'error'; message: string } | { status: 'sent'; at: number };

export default function ReplyBox({ action, conversationId, windowKind, closesLabel, maxLength }: {
  action: (prev: ReplyState, formData: FormData) => Promise<ReplyState>;
  conversationId: number;
  windowKind: 'open' | 'human_agent' | 'closed';
  closesLabel: string | null;
  maxLength: number;
}) {
  const [text, setText] = useState('');
  // Controlled textarea: React resets uncontrolled fields after every form action,
  // which would throw away a reply that failed to send. Clear only on success.
  const [state, formAction] = useActionState<ReplyState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.status === 'sent') setText('');
    return result;
  }, { status: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const disabled = windowKind === 'closed';

  return (
    <form ref={formRef} action={formAction} className="border-t border-line-sub p-3 sm:p-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={disabled ? 'text-red-500' : windowKind === 'human_agent' ? 'text-amber-500' : 'text-ink-dim'}>
          {windowKind === 'open' && `Standard messaging window open · closes ${closesLabel}`}
          {windowKind === 'human_agent' && `24-hour window closed · human agent reply allowed until ${closesLabel}`}
          {windowKind === 'closed' && 'Messaging window closed — Meta only allows a reply after the customer messages again.'}
        </span>
        {state.status === 'error' && <span role="alert" className="text-red-500">{state.message}</span>}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={2}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={disabled ? 'Replies are unavailable for this conversation' : 'Write a reply…'}
          className="min-h-[44px] flex-1 resize-y rounded-lg border border-line bg-input px-3 py-2.5 text-sm text-ink placeholder:text-ink-dull focus:border-line-hi focus:outline-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) formRef.current?.requestSubmit();
          }}
        />
        {windowKind === 'human_agent' && <input type="hidden" name="humanAgent" value="on" />}
        <SubmitButton className={`${primaryBtn} h-[44px]`} pendingText="Sending"><SendHorizontal size={15} /> Send</SubmitButton>
      </div>
    </form>
  );
}
