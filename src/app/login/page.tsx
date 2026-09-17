import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getStaff } from '@/lib/auth/session';
import { Wordmark } from '@/components/console/ui';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in — OY Labs Console', robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/console' } = await searchParams;
  if (await getStaff()) redirect('/console');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-page">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/"><Wordmark suffix="Console" /></Link>
          <h1 className="mt-6 text-xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-dim">For OY Labs staff. Clients connect through the link they were sent.</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
