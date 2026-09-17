'use server';

import { redirect } from 'next/navigation';
import {
  acceptInvite, AccountError, requestPasswordReset, resetPassword, sendVerificationEmail, signUp, signUpFromInvite,
} from '@/lib/accounts/accounts';
import { assertClient, checkClientCredentials, clientLoginThrottle, createClientSession, destroyClientSession, getClient } from '@/lib/auth/client-session';
import { clientIp, createThrottle } from '@/lib/auth/throttle';
import { isInterval, isPlanId } from '@/lib/billing/plans';
import { errorSummary, log } from '@/lib/log';

export type AuthState = { error?: string; message?: string };

const signupThrottle = createThrottle(5, 60 * 60 * 1000);
const resetThrottle = createThrottle(5, 60 * 60 * 1000);

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '');

function safeNext(value: string): string {
  return value.startsWith('/app') && !value.startsWith('//') ? value : '/app';
}

export async function signupAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const ip = await clientIp();
  if (signupThrottle.blocked(ip)) return { error: 'Too many sign-ups from this network. Try again later.' };
  if (fd.get('terms') !== 'on') return { error: 'Please accept the Terms and Privacy Policy.' };
  const plan = str(fd, 'plan');
  const interval = str(fd, 'interval');
  let userId: number;
  let workspaceId: number;
  try {
    ({ userId, workspaceId } = await signUp({
      name: str(fd, 'name'),
      company: str(fd, 'company'),
      email: str(fd, 'email'),
      password: str(fd, 'password'),
      plan: isPlanId(plan) ? plan : undefined,
      interval: isInterval(interval) ? interval : undefined,
    }));
  } catch (err) {
    signupThrottle.fail(ip);
    if (err instanceof AccountError) return { error: err.message };
    log.error('account.signup.failed', { error: errorSummary(err) });
    return { error: 'Something went wrong. Please try again.' };
  }
  signupThrottle.fail(ip); // counts every sign-up from this IP, successful or not
  await createClientSession(userId, workspaceId);
  redirect('/verify-email');
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, 'email').trim().toLowerCase();
  const password = str(fd, 'password');
  if (!email || !password) return { error: 'Enter your email and password.' };
  const key = `${email}|${await clientIp()}`;
  if (clientLoginThrottle.blocked(key)) return { error: 'Too many attempts. Try again in 15 minutes.' };
  const userId = await checkClientCredentials(email, password, key);
  if (!userId) return { error: 'Email or password is incorrect.' };
  await createClientSession(userId, null);
  log.info('account.login', { userId });
  redirect(safeNext(str(fd, 'next')));
}

export async function forgotPasswordAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const ip = await clientIp();
  if (resetThrottle.blocked(ip)) return { error: 'Too many requests. Try again later.' };
  resetThrottle.fail(ip);
  try {
    await requestPasswordReset(str(fd, 'email'));
  } catch (err) {
    log.error('account.reset_email.failed', { error: errorSummary(err) });
  }
  return { message: 'If an account exists for that email, we sent a link to reset the password. It expires in 1 hour.' };
}

export async function resetPasswordAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (str(fd, 'password') !== str(fd, 'confirm')) return { error: 'The passwords do not match.' };
  try {
    await resetPassword(str(fd, 'token'), str(fd, 'password'));
  } catch (err) {
    return { error: err instanceof AccountError ? err.message : 'Could not reset the password.' };
  }
  redirect('/login?reset=1');
}

export async function resendVerificationAction(): Promise<AuthState> {
  const ctx = await getClient();
  if (!ctx) redirect('/login');
  if (ctx.user.email_verified_at) redirect('/app');
  try {
    await sendVerificationEmail(ctx.user.id);
  } catch (err) {
    log.error('account.verification_email.failed', { userId: ctx.user.id, error: errorSummary(err) });
    return { error: 'We could not send the email. Please try again shortly.' };
  }
  return { message: `We sent a new link to ${ctx.user.email}.` };
}

export async function acceptInviteAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const ctx = await assertClient({ verified: false }).catch(() => null);
  if (!ctx) redirect(`/login?next=${encodeURIComponent('/app')}`);
  let workspaceId: number;
  try {
    workspaceId = acceptInvite(str(fd, 'token'), ctx.user.id);
  } catch (err) {
    return { error: err instanceof AccountError ? err.message : 'Could not accept the invitation.' };
  }
  await createClientSession(ctx.user.id, workspaceId);
  redirect('/app');
}

export async function inviteSignupAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  if (fd.get('terms') !== 'on') return { error: 'Please accept the Terms and Privacy Policy.' };
  try {
    const { userId, workspaceId } = await signUpFromInvite(str(fd, 'token'), str(fd, 'name'), str(fd, 'password'));
    await createClientSession(userId, workspaceId);
  } catch (err) {
    return { error: err instanceof AccountError ? err.message : 'Could not create your account.' };
  }
  redirect('/app');
}

export async function signOutForInviteAction(fd: FormData) {
  await destroyClientSession();
  redirect(`/invite/${encodeURIComponent(str(fd, 'token'))}`);
}
