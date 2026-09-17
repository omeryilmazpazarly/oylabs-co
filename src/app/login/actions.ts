'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkCredentials, createSession, loginBlocked } from '@/lib/auth/session';
import { log } from '@/lib/log';

export interface LoginState {
  error?: string;
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/') && !next.startsWith('//') && (next.startsWith('/console') || next.startsWith('/admin')) ? next : '/console';
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const h = await headers();
  const ip = h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const throttleKey = `${email}|${ip}`;
  if (loginBlocked(throttleKey)) return { error: 'Too many attempts. Try again in 15 minutes.' };

  const staff = await checkCredentials(email, password, throttleKey);
  if (!staff) {
    log.warn('auth.login.failed');
    return { error: 'Email or password is incorrect.' };
  }
  await createSession(staff.id);
  log.info('auth.login.succeeded', { staffId: staff.id });
  redirect(safeNext(formData.get('next')));
}
