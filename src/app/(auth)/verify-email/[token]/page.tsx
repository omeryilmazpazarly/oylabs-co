import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyEmail } from '@/lib/accounts/accounts';
import { getClient } from '@/lib/auth/client-session';
import AuthShell from '../../AuthShell';

export const metadata = { title: 'Confirming your email — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = verifyEmail(token);
  if (!result) {
    const ctx = await getClient();
    if (ctx?.user.email_verified_at) redirect('/app'); // link already used, e.g. opened twice
    return (
      <AuthShell title="Link expired" subtitle="Confirmation links expire after 48 hours and work once.">
        <Link href={ctx ? '/verify-email' : '/login'} className="block text-center text-sm text-ink underline">{ctx ? 'Send a new link' : 'Sign in to get a new link'}</Link>
      </AuthShell>
    );
  }
  const ctx = await getClient();
  if (!ctx || ctx.user.id !== result.userId) redirect('/login?verified=1');
  redirect(result.plan ? `/app/billing?plan=${result.plan}&interval=${result.interval ?? 'month'}` : '/app/billing');
}
