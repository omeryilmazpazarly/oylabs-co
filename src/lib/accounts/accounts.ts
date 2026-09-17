import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { randomToken, sha256Hex } from '@/lib/messaging/crypto';
import { env } from '@/lib/messaging/env';
import { createWorkspace } from '@/lib/messaging/workspaces';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';
import { sendAccountEmail } from '@/lib/email';
import { errorSummary, log } from '@/lib/log';

/**
 * Client accounts: users, their workspace memberships, and the single-use
 * email tokens behind verification, password reset and team invites.
 */

export type Role = 'owner' | 'member';
type TokenPurpose = 'verify_email' | 'reset_password' | 'invite';

const HOUR = 60 * 60 * 1000;
const TOKEN_TTL: Record<TokenPurpose, number> = { verify_email: 48 * HOUR, reset_password: 1 * HOUR, invite: 7 * 24 * HOUR };

export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

export interface ClientUser {
  id: number;
  email: string;
  name: string;
  email_verified_at: number | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normaliseEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value) || value.length > 254) throw new AccountError('Enter a valid email address.');
  return value;
}

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) throw new AccountError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
  if (password.length > 200) throw new AccountError('That password is too long.');
}

export function getUser(id: number): ClientUser | null {
  return (getDb().prepare('SELECT id, email, name, email_verified_at FROM client_users WHERE id = ?').get(id) as ClientUser | undefined) ?? null;
}

export function getUserByEmail(email: string): (ClientUser & { password_hash: string }) | null {
  return (getDb().prepare('SELECT id, email, name, email_verified_at, password_hash FROM client_users WHERE email = ?')
    .get(email.trim().toLowerCase()) as (ClientUser & { password_hash: string }) | undefined) ?? null;
}

/* ── Email tokens ────────────────────────────────────────────────────── */

interface TokenRow {
  token_hash: string;
  purpose: TokenPurpose;
  user_id: number | null;
  workspace_id: number | null;
  email: string;
  role: Role | null;
  data: string | null;
  expires_at: number;
  used_at: number | null;
}

function createToken(purpose: TokenPurpose, fields: { userId?: number; workspaceId?: number; email: string; role?: Role; data?: object }): string {
  const token = randomToken(24);
  getDb().prepare(`
    INSERT INTO email_tokens (token_hash, purpose, user_id, workspace_id, email, role, data, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sha256Hex(token), purpose, fields.userId ?? null, fields.workspaceId ?? null, fields.email, fields.role ?? null,
    fields.data ? JSON.stringify(fields.data) : null, now(), now() + TOKEN_TTL[purpose]);
  return token;
}

function findToken(token: string, purpose: TokenPurpose): TokenRow | null {
  const row = getDb().prepare('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?').get(sha256Hex(token), purpose) as TokenRow | undefined;
  if (!row || row.used_at || row.expires_at < now()) return null;
  return row;
}

function markUsed(tokenHash: string) {
  getDb().prepare('UPDATE email_tokens SET used_at = ? WHERE token_hash = ?').run(now(), tokenHash);
}

/* ── Sign-up & verification ──────────────────────────────────────────── */

export interface SignupInput {
  name: string;
  company: string;
  email: string;
  password: string;
  plan?: string;
  interval?: string;
}

export async function signUp(input: SignupInput): Promise<{ userId: number; workspaceId: number }> {
  const name = input.name.trim();
  const company = input.company.trim();
  if (!name) throw new AccountError('Enter your name.');
  if (!company) throw new AccountError('Enter your business name.');
  const email = normaliseEmail(input.email);
  validatePassword(input.password);
  if (getUserByEmail(email)) throw new AccountError('An account with this email already exists. Sign in instead.');

  const passwordHash = await hashPassword(input.password);
  const db = getDb();
  const result = db.transaction(() => {
    const { lastInsertRowid } = db.prepare('INSERT INTO client_users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(email, name, passwordHash, now());
    const userId = Number(lastInsertRowid);
    const { workspace } = createWorkspace(company, '');
    db.prepare(`INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)`).run(workspace.id, userId, now());
    return { userId, workspaceId: workspace.id };
  })();

  try {
    await sendVerificationEmail(result.userId, { plan: input.plan, interval: input.interval });
  } catch (err) {
    // The account exists either way; the user can resend from the verification screen.
    log.error('account.verification_email.failed', { userId: result.userId, error: errorSummary(err) });
  }
  log.info('account.signup', { userId: result.userId, workspaceId: result.workspaceId });
  return result;
}

export async function sendVerificationEmail(userId: number, data: { plan?: string; interval?: string } = {}) {
  const user = getUser(userId);
  if (!user || user.email_verified_at) return;
  getDb().prepare(`UPDATE email_tokens SET used_at = ? WHERE user_id = ? AND purpose = 'verify_email' AND used_at IS NULL`).run(now(), userId);
  const token = createToken('verify_email', { userId, email: user.email, data });
  await sendAccountEmail({
    to: user.email,
    subject: 'Confirm your email — OY Labs',
    heading: 'Confirm your email address',
    intro: `Hi ${user.name}, confirm this is your email to finish setting up your OY Labs account.`,
    ctaLabel: 'Confirm email',
    ctaUrl: `${env.appBaseUrl()}/verify-email/${token}`,
    footnote: 'This link expires in 48 hours. If you did not create an account, ignore this email.',
  });
}

/** Returns the user and any plan choice carried from sign-up, or null if the link is invalid. */
export function verifyEmail(token: string): { userId: number; plan?: string; interval?: string } | null {
  const row = findToken(token, 'verify_email');
  if (!row?.user_id) return null;
  const db = getDb();
  db.transaction(() => {
    db.prepare('UPDATE client_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(now(), row.user_id);
    markUsed(row.token_hash);
  })();
  const data = row.data ? (JSON.parse(row.data) as { plan?: string; interval?: string }) : {};
  return { userId: row.user_id, ...data };
}

/* ── Password reset ──────────────────────────────────────────────────── */

/** Always resolves the same way, so the form can't be used to discover accounts. */
export async function requestPasswordReset(email: string): Promise<void> {
  let normalised: string;
  try {
    normalised = normaliseEmail(email);
  } catch {
    return;
  }
  const user = getUserByEmail(normalised);
  if (!user) return;
  const token = createToken('reset_password', { userId: user.id, email: user.email });
  await sendAccountEmail({
    to: user.email,
    subject: 'Reset your password — OY Labs',
    heading: 'Reset your password',
    intro: `Hi ${user.name}, use the button below to choose a new password for your OY Labs account.`,
    ctaLabel: 'Choose a new password',
    ctaUrl: `${env.appBaseUrl()}/reset-password/${token}`,
    footnote: 'This link expires in 1 hour and can be used once. If you did not ask for this, you can ignore it.',
  });
}

export function resetTokenValid(token: string): boolean {
  return Boolean(findToken(token, 'reset_password'));
}

export async function resetPassword(token: string, password: string): Promise<number> {
  const row = findToken(token, 'reset_password');
  if (!row?.user_id) throw new AccountError('This reset link is invalid or has expired. Request a new one.');
  validatePassword(password);
  const hash = await hashPassword(password);
  const db = getDb();
  db.transaction(() => {
    db.prepare('UPDATE client_users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(hash, now(), row.user_id);
    db.prepare('DELETE FROM client_sessions WHERE user_id = ?').run(row.user_id); // sign out everywhere
    markUsed(row.token_hash);
  })();
  log.info('account.password_reset', { userId: row.user_id });
  return row.user_id;
}

export async function changePassword(userId: number, password: string, keepSessionHash: string | null) {
  validatePassword(password);
  const hash = await hashPassword(password);
  const db = getDb();
  db.prepare('UPDATE client_users SET password_hash = ? WHERE id = ?').run(hash, userId);
  db.prepare('DELETE FROM client_sessions WHERE user_id = ? AND token_hash != ?').run(userId, keepSessionHash ?? '');
}

export function updateProfile(userId: number, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new AccountError('Enter your name.');
  getDb().prepare('UPDATE client_users SET name = ? WHERE id = ?').run(trimmed.slice(0, 120), userId);
}

/* ── Team ────────────────────────────────────────────────────────────── */

export interface Member {
  user_id: number;
  name: string;
  email: string;
  role: Role;
  created_at: number;
}

export function membership(workspaceId: number, userId: number): Role | null {
  const row = getDb().prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?').get(workspaceId, userId) as { role: Role } | undefined;
  return row?.role ?? null;
}

export function userWorkspaces(userId: number): { id: number; name: string; role: Role }[] {
  return getDb().prepare(`
    SELECT w.id, w.name, m.role FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
    WHERE m.user_id = ? ORDER BY m.created_at
  `).all(userId) as { id: number; name: string; role: Role }[];
}

export function listMembers(workspaceId: number): Member[] {
  return getDb().prepare(`
    SELECT m.user_id, u.name, u.email, m.role, m.created_at
    FROM workspace_members m JOIN client_users u ON u.id = m.user_id
    WHERE m.workspace_id = ? ORDER BY m.role = 'owner' DESC, u.name
  `).all(workspaceId) as Member[];
}

export function listPendingInvites(workspaceId: number): { email: string; role: Role; expires_at: number; token_hash: string }[] {
  return getDb().prepare(`
    SELECT email, role, expires_at, token_hash FROM email_tokens
    WHERE workspace_id = ? AND purpose = 'invite' AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC
  `).all(workspaceId, now()) as { email: string; role: Role; expires_at: number; token_hash: string }[];
}

export async function inviteMember(workspaceId: number, email: string, role: Role, invitedByName: string): Promise<void> {
  const normalised = normaliseEmail(email);
  const workspace = getDb().prepare('SELECT name FROM workspaces WHERE id = ?').get(workspaceId) as { name: string } | undefined;
  if (!workspace) throw new AccountError('Workspace not found.');
  const existing = getUserByEmail(normalised);
  if (existing && membership(workspaceId, existing.id)) throw new AccountError('That person is already a member.');

  // One live invite per email: re-inviting replaces the previous link.
  getDb().prepare(`UPDATE email_tokens SET used_at = ? WHERE workspace_id = ? AND purpose = 'invite' AND email = ? AND used_at IS NULL`).run(now(), workspaceId, normalised);
  const token = createToken('invite', { workspaceId, email: normalised, role });
  await sendAccountEmail({
    to: normalised,
    subject: `${invitedByName} invited you to ${workspace.name} on OY Labs`,
    heading: `Join ${workspace.name} on OY Labs`,
    intro: `${invitedByName} invited you to manage ${workspace.name}'s Messenger and Instagram messaging on OY Labs as ${role === 'owner' ? 'an owner' : 'a member'}.`,
    ctaLabel: 'Accept invitation',
    ctaUrl: `${env.appBaseUrl()}/invite/${token}`,
    footnote: 'This invitation expires in 7 days.',
  });
  log.info('team.invited', { workspaceId, role });
}

export function revokeInvite(workspaceId: number, tokenHash: string) {
  getDb().prepare(`UPDATE email_tokens SET used_at = ? WHERE token_hash = ? AND workspace_id = ? AND purpose = 'invite'`).run(now(), tokenHash, workspaceId);
}

export function inviteDetails(token: string): { email: string; role: Role; workspaceId: number; workspaceName: string } | null {
  const row = findToken(token, 'invite');
  if (!row?.workspace_id) return null;
  const workspace = getDb().prepare('SELECT name FROM workspaces WHERE id = ?').get(row.workspace_id) as { name: string } | undefined;
  return workspace ? { email: row.email, role: row.role ?? 'member', workspaceId: row.workspace_id, workspaceName: workspace.name } : null;
}

/** Joins the invited workspace. The signed-in user's email must match the invitation. */
export function acceptInvite(token: string, userId: number): number {
  const row = findToken(token, 'invite');
  const user = getUser(userId);
  if (!row?.workspace_id || !user) throw new AccountError('This invitation is invalid or has expired.');
  if (user.email.toLowerCase() !== row.email.toLowerCase()) throw new AccountError(`This invitation was sent to ${row.email}. Sign in with that email to accept it.`);
  const db = getDb();
  db.transaction(() => {
    db.prepare(`INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, ?, ?)`)
      .run(row.workspace_id, userId, row.role ?? 'member', now());
    // Opening the emailed link proves ownership of the address.
    db.prepare('UPDATE client_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(now(), userId);
    markUsed(row.token_hash);
  })();
  log.info('team.joined', { workspaceId: row.workspace_id, userId });
  return row.workspace_id;
}

/** Creates the account for someone arriving from an invitation (email already proven by the link). */
export async function signUpFromInvite(token: string, name: string, password: string): Promise<{ userId: number; workspaceId: number }> {
  const invite = inviteDetails(token);
  if (!invite) throw new AccountError('This invitation is invalid or has expired.');
  if (getUserByEmail(invite.email)) throw new AccountError('You already have an account. Sign in to accept the invitation.');
  if (!name.trim()) throw new AccountError('Enter your name.');
  validatePassword(password);
  const hash = await hashPassword(password);
  const { lastInsertRowid } = getDb().prepare('INSERT INTO client_users (email, name, password_hash, email_verified_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(invite.email, name.trim(), hash, now(), now());
  const userId = Number(lastInsertRowid);
  return { userId, workspaceId: acceptInvite(token, userId) };
}

export function removeMember(workspaceId: number, userId: number) {
  const db = getDb();
  db.transaction(() => {
    const role = membership(workspaceId, userId);
    if (!role) return;
    if (role === 'owner') {
      const owners = (db.prepare(`SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id = ? AND role = 'owner'`).get(workspaceId) as { n: number }).n;
      if (owners <= 1) throw new AccountError('A workspace needs at least one owner.');
    }
    db.prepare('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?').run(workspaceId, userId);
    db.prepare('UPDATE client_sessions SET workspace_id = NULL WHERE user_id = ? AND workspace_id = ?').run(userId, workspaceId);
  })();
}

export function setMemberRole(workspaceId: number, userId: number, role: Role) {
  const db = getDb();
  db.transaction(() => {
    const current = membership(workspaceId, userId);
    if (!current) throw new AccountError('Member not found.');
    if (current === 'owner' && role === 'member') {
      const owners = (db.prepare(`SELECT COUNT(*) AS n FROM workspace_members WHERE workspace_id = ? AND role = 'owner'`).get(workspaceId) as { n: number }).n;
      if (owners <= 1) throw new AccountError('A workspace needs at least one owner.');
    }
    db.prepare('UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?').run(role, workspaceId, userId);
  })();
}
