'use client';

import { useActionState, useState, useTransition, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Copy, Loader2 } from 'lucide-react';

export function SubmitButton({ children, className, pendingText }: { children: ReactNode; className: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={14} className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function CopyButton({ value, label = 'Copy', className = '' }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-dim hover:text-ink hover:border-line-hi transition ${className}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/** A button that asks for confirmation before running a server action. */
export function ConfirmAction({ action, fields, confirm, children, className }: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  confirm: string;
  children: ReactNode;
  className: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!window.confirm(confirm)) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
        start(() => action(fd));
      }}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function SecretField({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-[11px] text-ink-dim tracking-[0.14em] uppercase mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-input px-3 py-2 font-mono text-xs text-ink">{value}</code>
        <CopyButton value={value} />
      </div>
      {note && <p className="mt-1.5 text-xs text-ink-dim">{note}</p>}
    </div>
  );
}

type StatusResult = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };

/** A form bound to a server action that returns a status message, shown next to the submit button. */
export function StatusForm({ action, children, submitLabel, pendingText, submitClassName, className = 'space-y-4', resetOnSuccess = false }: {
  action: (prev: StatusResult, formData: FormData) => Promise<StatusResult>;
  children: ReactNode;
  submitLabel: ReactNode;
  pendingText?: string;
  submitClassName: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [key, setKey] = useState(0);
  const [state, formAction] = useActionState<StatusResult, FormData>(async (prev, fd) => {
    const result = await action(prev, fd);
    if (resetOnSuccess && result.status === 'ok') setKey((k) => k + 1);
    return result;
  }, { status: 'idle' });
  return (
    <form key={key} action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton className={submitClassName} pendingText={pendingText}>{submitLabel}</SubmitButton>
        {state.status !== 'idle' && <span role="status" className={`text-xs ${state.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
