import Link from 'next/link';
import { inviteDetails, getUserByEmail } from '@/lib/accounts/accounts';
import { getClient } from '@/lib/auth/client-session';
import { Notice } from '@/components/console/ui';
import AuthShell from '../../AuthShell';
import { AcceptInviteForm, InviteSignupForm } from '../../forms';

export const metadata = { title: 'Join your team — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = inviteDetails(token);
  if (!invite) {
    return (
      <AuthShell title="Invitation expired" subtitle="Invitations work once and expire after 7 days.">
        <p className="text-center text-sm text-ink-dim">Ask your workspace owner to send a new one.</p>
      </AuthShell>
    );
  }

  const ctx = await getClient();
  const subtitle = `You've been invited to ${invite.workspaceName} as ${invite.role === 'owner' ? 'an owner' : 'a member'}.`;

  if (ctx) {
    const matches = ctx.user.email.toLowerCase() === invite.email.toLowerCase();
    return (
      <AuthShell title={`Join ${invite.workspaceName}`} subtitle={subtitle}>
        {matches
          ? <AcceptInviteForm token={token} />
          : <Notice tone="amber">This invitation was sent to {invite.email}, but you&rsquo;re signed in as {ctx.user.email}. Sign out and sign in with the invited email.</Notice>}
      </AuthShell>
    );
  }

  if (getUserByEmail(invite.email)) {
    return (
      <AuthShell title={`Join ${invite.workspaceName}`} subtitle={subtitle}>
        <p className="mb-4 text-sm text-ink-dim">You already have an OY Labs account with {invite.email}. Sign in, then open this link again to accept.</p>
        <Link href="/login" className="block text-center text-sm text-ink underline">Sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide title={`Join ${invite.workspaceName}`} subtitle={subtitle}>
      <InviteSignupForm token={token} email={invite.email} />
    </AuthShell>
  );
}
