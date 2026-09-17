import Link from 'next/link';
import { resetTokenValid } from '@/lib/accounts/accounts';
import AuthShell from '../../AuthShell';
import { ResetPasswordForm } from '../../forms';

export const metadata = { title: 'Choose a new password — OY Labs', robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!resetTokenValid(token)) {
    return (
      <AuthShell title="Link expired" subtitle="Password reset links work once and expire after 1 hour." footer={<Link href="/login" className="text-ink underline">Back to sign in</Link>}>
        <Link href="/forgot-password" className="block text-center text-sm text-ink underline">Request a new link</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed out on other devices.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
