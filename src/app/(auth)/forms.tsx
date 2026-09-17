'use client';

import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { SubmitButton } from '@/components/console/client';
import { inputCls, labelCls, primaryBtn } from '@/components/console/ui';
import {
  acceptInviteAction, forgotPasswordAction, inviteSignupAction, loginAction, resendVerificationAction, resetPasswordAction, signupAction,
  type AuthState,
} from './actions';

function Feedback({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="flex items-start gap-2 text-sm text-red-500"><AlertCircle size={15} className="mt-0.5 shrink-0" /> {state.error}</p>;
  if (state.message) return <p role="status" className="flex items-start gap-2 text-sm text-emerald-500"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {state.message}</p>;
  return null;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-dim">{hint}</span>}
    </label>
  );
}

function Terms() {
  return (
    <label className="flex items-start gap-2 text-xs leading-relaxed text-ink-dim">
      <input type="checkbox" name="terms" required className="mt-0.5 accent-current" />
      <span>I agree to the{' '}<Link href="/terms" target="_blank" className="text-ink underline">Terms</Link>{' '}and{' '}<Link href="/privacy" target="_blank" className="text-ink underline">Privacy Policy</Link>, including the subscription and auto-renewal terms.</span>
    </label>
  );
}

export function SignupForm({ plan, interval }: { plan?: string; interval?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signupAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="plan" value={plan ?? ''} />
      <input type="hidden" name="interval" value={interval ?? ''} />
      <Field label="Your name"><input name="name" autoComplete="name" required className={inputCls} /></Field>
      <Field label="Business name"><input name="company" autoComplete="organization" required className={inputCls} /></Field>
      <Field label="Work email"><input name="email" type="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Password" hint="At least 12 characters."><input name="password" type="password" autoComplete="new-password" minLength={12} required className={inputCls} /></Field>
      <Terms />
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email"><input name="email" type="email" autoComplete="username" required autoFocus className={inputCls} /></Field>
      <Field label="Password"><input name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
      <div className="text-right text-xs"><Link href="/forgot-password" className="text-ink-dim hover:text-ink">Forgot password?</Link></div>
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(forgotPasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Email"><input name="email" type="email" autoComplete="email" required autoFocus className={inputCls} /></Field>
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="New password" hint="At least 12 characters."><input name="password" type="password" autoComplete="new-password" minLength={12} required autoFocus className={inputCls} /></Field>
      <Field label="Confirm new password"><input name="confirm" type="password" autoComplete="new-password" minLength={12} required className={inputCls} /></Field>
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}

export function ResendVerificationForm() {
  const [state, action] = useActionState<AuthState, FormData>(resendVerificationAction, {});
  return (
    <form action={action} className="space-y-3">
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Sending…">Resend email</SubmitButton>
    </form>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthState, FormData>(acceptInviteAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Joining…">Accept invitation</SubmitButton>
    </form>
  );
}

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<AuthState, FormData>(inviteSignupAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Email"><input value={email} disabled className={inputCls} /></Field>
      <Field label="Your name"><input name="name" autoComplete="name" required autoFocus className={inputCls} /></Field>
      <Field label="Password" hint="At least 12 characters."><input name="password" type="password" autoComplete="new-password" minLength={12} required className={inputCls} /></Field>
      <Terms />
      <Feedback state={state} />
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Creating account…">Create account and join</SubmitButton>
    </form>
  );
}
