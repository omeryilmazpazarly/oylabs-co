import { redirect } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { getClient } from '@/lib/auth/client-session';
import AuthShell from '../AuthShell';
import { ResendVerificationForm } from '../forms';
import { clientLogoutAction } from '@/app/app/actions';

export const metadata = { title: 'Confirm your email — OY Labs', robots: { index: false, follow: false } };

export default async function VerifyEmailNotice() {
  const ctx = await getClient();
  if (!ctx) redirect('/login');
  if (ctx.user.email_verified_at) redirect('/app');
  return (
    <AuthShell title="Check your inbox" subtitle={<>We sent a confirmation link to <strong className="text-ink">{ctx.user.email}</strong>.</>}>
      <div className="space-y-4 text-center">
        <MailCheck size={28} className="mx-auto text-ink-dim" />
        <p className="text-sm text-ink-dim">Click the link in the email to confirm your address, then choose your plan. It can take a minute to arrive — check spam too.</p>
        <ResendVerificationForm />
        <form action={clientLogoutAction}><button className="text-xs text-ink-dim hover:text-ink">Wrong email? Sign out</button></form>
      </div>
    </AuthShell>
  );
}
