'use client';

import { useActionState } from 'react';
import { AlertCircle } from 'lucide-react';
import { loginAction, type LoginState } from './actions';
import { SubmitButton } from '@/components/console/client';
import { inputCls, labelCls, primaryBtn } from '@/components/console/ui';

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
      </div>
      {state.error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {state.error}
        </p>
      )}
      <SubmitButton className={`${primaryBtn} w-full`} pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
