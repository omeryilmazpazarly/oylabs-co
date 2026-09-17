import Link from 'next/link';
import AuthShell from '../AuthShell';
import { ForgotPasswordForm } from '../forms';

export const metadata = { title: 'Reset your password — OY Labs', robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one." footer={<Link href="/login" className="text-ink underline">Back to sign in</Link>}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
