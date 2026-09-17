import { beforeEach, describe, expect, it, vi } from 'vitest';

const sent: { to: string; ctaUrl: string; subject: string }[] = [];
vi.mock('@/lib/email', () => ({
  sendAccountEmail: vi.fn(async (opts: { to: string; ctaUrl: string; subject: string }) => { sent.push(opts); }),
}));

import { freshDb } from './helpers';
import {
  acceptInvite, AccountError, inviteDetails, inviteMember, listMembers, removeMember, requestPasswordReset, resetPassword,
  setMemberRole, signUp, signUpFromInvite, verifyEmail,
} from '@/lib/accounts/accounts';
import { verifyPassword } from '@/lib/auth/password';
import type { Db } from '@/lib/messaging/db';

let db: Db;
beforeEach(() => { db = freshDb(); sent.length = 0; });

const tokenFrom = (url: string) => url.split('/').pop()!;
const signupInput = { name: 'Sara Ali', company: 'Minhaj Kids', email: 'Sara@Example.com', password: 'correct horse battery', plan: 'growth', interval: 'year' };

describe('sign-up and email verification', () => {
  it('creates the user as owner of a new, unsubscribed workspace and sends a verification link carrying the plan choice', async () => {
    const { userId, workspaceId } = await signUp(signupInput);
    expect(listMembers(workspaceId)).toMatchObject([{ user_id: userId, email: 'sara@example.com', role: 'owner' }]);
    expect(db.prepare('SELECT complimentary, subscription_status FROM workspaces WHERE id = ?').get(workspaceId)).toEqual({ complimentary: 0, subscription_status: null });

    const result = verifyEmail(tokenFrom(sent[0].ctaUrl));
    expect(result).toEqual({ userId, plan: 'growth', interval: 'year' });
    expect(verifyEmail(tokenFrom(sent[0].ctaUrl))).toBeNull(); // single use
  });

  it('rejects duplicate emails (case-insensitive) and weak passwords', async () => {
    await signUp(signupInput);
    await expect(signUp({ ...signupInput, email: 'sara@EXAMPLE.com' })).rejects.toThrow(/already exists/);
    await expect(signUp({ ...signupInput, email: 'new@example.com', password: 'short' })).rejects.toThrow(AccountError);
  });
});

describe('password reset', () => {
  it('sends nothing for unknown emails, and a used link cannot be replayed', async () => {
    await requestPasswordReset('nobody@example.com');
    expect(sent).toHaveLength(0);

    const { userId } = await signUp(signupInput);
    db.prepare('INSERT INTO client_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run('abc', userId, Date.now(), Date.now() + 1e6);
    await requestPasswordReset('sara@example.com');
    const token = tokenFrom(sent.at(-1)!.ctaUrl);

    await resetPassword(token, 'a brand new passphrase');
    const hash = (db.prepare('SELECT password_hash FROM client_users WHERE id = ?').get(userId) as { password_hash: string }).password_hash;
    expect(await verifyPassword('a brand new passphrase', hash)).toBe(true);
    expect(db.prepare('SELECT COUNT(*) AS n FROM client_sessions').get()).toEqual({ n: 0 });
    await expect(resetPassword(token, 'another passphrase!!')).rejects.toThrow(/invalid or has expired/);
  });
});

describe('team invitations', () => {
  it('lets a new person join via the emailed link, only for the invited address', async () => {
    const owner = await signUp(signupInput);
    await inviteMember(owner.workspaceId, 'Omar@example.com', 'member', 'Sara Ali');
    const token = tokenFrom(sent.at(-1)!.ctaUrl);
    expect(inviteDetails(token)).toMatchObject({ email: 'omar@example.com', role: 'member', workspaceName: 'Minhaj Kids' });

    const stranger = await signUp({ ...signupInput, email: 'eve@example.com', company: 'Eve Co' });
    expect(() => acceptInvite(token, stranger.userId)).toThrow(/sent to omar@example.com/);

    const joined = await signUpFromInvite(token, 'Omar Haddad', 'omar strong passphrase');
    expect(joined.workspaceId).toBe(owner.workspaceId);
    expect(listMembers(owner.workspaceId).map((m) => [m.email, m.role])).toEqual([['sara@example.com', 'owner'], ['omar@example.com', 'member']]);
    expect(inviteDetails(token)).toBeNull();
  });

  it('never leaves a workspace without an owner', async () => {
    const owner = await signUp(signupInput);
    expect(() => removeMember(owner.workspaceId, owner.userId)).toThrow(/at least one owner/);
    expect(() => setMemberRole(owner.workspaceId, owner.userId, 'member')).toThrow(/at least one owner/);
  });

  it('refuses to invite someone who is already a member', async () => {
    const owner = await signUp(signupInput);
    await expect(inviteMember(owner.workspaceId, 'sara@example.com', 'member', 'Sara')).rejects.toThrow(/already a member/);
  });
});
