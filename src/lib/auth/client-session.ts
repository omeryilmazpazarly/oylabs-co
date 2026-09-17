import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, now } from '@/lib/messaging/db';
import { randomToken, sha256Hex } from '@/lib/messaging/crypto';
import { getWorkspace, type Workspace } from '@/lib/messaging/workspaces';
import { userWorkspaces, type ClientUser, type Role } from '@/lib/accounts/accounts';
import { verifyPassword } from './password';
import { createThrottle } from './throttle';

/**
 * Client (customer) sessions, separate from staff sessions: different cookie,
 * table and guards. A session remembers the active workspace; every guard
 * re-checks membership, so removing someone from a team takes effect at once.
 */

export const CLIENT_COOKIE = 'oy_client';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface ClientContext {
  user: ClientUser;
  sessionHash: string;
  workspace: Workspace | null;
  role: Role | null;
  workspaces: { id: number; name: string; role: Role }[];
}

export async function createClientSession(userId: number, workspaceId: number | null): Promise<void> {
  const token = randomToken();
  const expiresAt = now() + SESSION_TTL_MS;
  const db = getDb();
  db.prepare('DELETE FROM client_sessions WHERE expires_at < ?').run(now());
  db.prepare('INSERT INTO client_sessions (token_hash, user_id, workspace_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(sha256Hex(token), userId, workspaceId, now(), expiresAt);
  db.prepare('UPDATE client_users SET last_login_at = ? WHERE id = ?').run(now(), userId);
  (await cookies()).set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function destroyClientSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM client_sessions WHERE token_hash = ?').run(sha256Hex(token));
  store.delete(CLIENT_COOKIE);
}

export const getClient = cache(async (): Promise<ClientContext | null> => {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const sessionHash = sha256Hex(token);
  const row = getDb().prepare(`
    SELECT u.id, u.email, u.name, u.email_verified_at, s.workspace_id
    FROM client_sessions s JOIN client_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(sessionHash, now()) as (ClientUser & { workspace_id: number | null }) | undefined;
  if (!row) return null;

  const workspaces = userWorkspaces(row.id);
  const active = workspaces.find((w) => w.id === row.workspace_id) ?? workspaces[0] ?? null;
  const { workspace_id: _ignored, ...user } = row;
  void _ignored;
  return {
    user,
    sessionHash,
    workspace: active ? getWorkspace(active.id) : null,
    role: active?.role ?? null,
    workspaces,
  };
});

export type ClientGuard = { verified?: boolean; owner?: boolean };

/** For portal pages: redirects instead of throwing. */
export async function requireClient(guard: ClientGuard = {}): Promise<ClientContext & { workspace: Workspace; role: Role }> {
  const ctx = await getClient();
  if (!ctx) redirect('/login');
  if (guard.verified !== false && !ctx.user.email_verified_at) redirect('/verify-email');
  if (!ctx.workspace || !ctx.role) redirect('/login?error=no_workspace');
  if (guard.owner && ctx.role !== 'owner') redirect('/app?error=owner_only');
  return ctx as ClientContext & { workspace: Workspace; role: Role };
}

/** For server actions: throws, never trusts a workspace id from the form. */
export async function assertClient(guard: ClientGuard = {}): Promise<ClientContext & { workspace: Workspace; role: Role }> {
  const ctx = await getClient();
  if (!ctx || !ctx.workspace || !ctx.role) throw new Error('Not signed in');
  if (guard.verified !== false && !ctx.user.email_verified_at) throw new Error('Email not verified');
  if (guard.owner && ctx.role !== 'owner') throw new Error('Only workspace owners can do this');
  return ctx as ClientContext & { workspace: Workspace; role: Role };
}

export async function switchWorkspace(workspaceId: number): Promise<boolean> {
  const ctx = await getClient();
  if (!ctx || !ctx.workspaces.some((w) => w.id === workspaceId)) return false;
  getDb().prepare('UPDATE client_sessions SET workspace_id = ? WHERE token_hash = ?').run(workspaceId, ctx.sessionHash);
  return true;
}

/* ── Sign-in ─────────────────────────────────────────────────────────── */

export const clientLoginThrottle = createThrottle(8, 15 * 60 * 1000);
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAA';

export async function checkClientCredentials(email: string, password: string, throttleKey: string): Promise<number | null> {
  const row = getDb().prepare('SELECT id, password_hash FROM client_users WHERE email = ?').get(email.trim().toLowerCase()) as { id: number; password_hash: string } | undefined;
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) {
    clientLoginThrottle.fail(throttleKey);
    return null;
  }
  clientLoginThrottle.clear(throttleKey);
  return row.id;
}
