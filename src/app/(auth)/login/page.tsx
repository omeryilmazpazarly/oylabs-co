import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/auth/client-session';
import { Notice } from '@/components/console/ui';
import AuthShell from '../AuthShell';
import { LoginForm } from '../forms';

export const metadata = { title: 'Sign in — OY Labs', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; verified?: string; error?: string }> }) {
  const params = await searchParams;
  const ctx = await getClient();
  if (ctx?.workspace) redirect('/app');
  return (
    <AuthShell
      title="Sign in"
      subtitle="Manage your Messenger & Instagram messaging."
      footer={<>New to OY Labs?{' '}<Link href="/signup" className="text-ink underline">Start a free trial</Link></>}
    >
      {params.reset && <div className="mb-4"><Notice tone="green">Password updated. Sign in with your new password.</Notice></div>}
      {params.verified && <div className="mb-4"><Notice tone="green">Email confirmed. Sign in to continue.</Notice></div>}
      {params.error === 'no_workspace' && <div className="mb-4"><Notice tone="amber">Your account isn&rsquo;t part of a workspace any more. Ask for a new invitation or contact hi@oylabs.co.</Notice></div>}
      <LoginForm next={params.next ?? '/app'} />
    </AuthShell>
  );
}
