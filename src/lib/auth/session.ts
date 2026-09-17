import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, now } from '@/lib/messaging/db';
import { randomToken, sha256Hex } from '@/lib/messaging/crypto';
import { verifyPassword } from './password';

/**
 * Database-backed staff sessions. The cookie holds a random token; the
 * database stores only its SHA-256, so a leaked database cannot be replayed
 * as a login. Every protected page, server action and route handler calls
 * requireStaff() / getStaff() — there is no client-side gate.
 */

export const SESSION_COOKIE = 'oy_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface Staff {
  id: number;
  email: string;
  name: string;
}

export async function createSession(userId: number): Promise<void> {
  const token = randomToken();
  const expiresAt = now() + SESSION_TTL_MS;
  const db = getDb();
  db.prepare('DELETE FROM staff_sessions WHERE expires_at < ?').run(now());
  db.prepare('INSERT INTO staff_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(sha256Hex(token), userId, now(), expiresAt);
  db.prepare('UPDATE staff_users SET last_login_at = ? WHERE id = ?').run(now(), userId);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM staff_sessions WHERE token_hash = ?').run(sha256Hex(token));
  store.delete(SESSION_COOKIE);
}

/** Current staff member, or null. Memoised per request. */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb().prepare(`
    SELECT u.id, u.email, u.name
    FROM staff_sessions s JOIN staff_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).get(sha256Hex(token), now()) as Staff | undefined;
  return row ?? null;
});

/** For pages: redirect to /login when signed out. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect('/console/login');
  return staff;
}

/** For server actions and route handlers: throw instead of redirecting. */
export async function assertStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new Error('Not authorised');
  return staff;
}

/* ── Login throttling: 5 failures per email+IP per 15 minutes ─────────── */

const failures = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function loginBlocked(key: string): boolean {
  const entry = failures.get(key);
  return Boolean(entry && entry.resetAt > now() && entry.count >= MAX_FAILURES);
}

function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now()) failures.set(key, { count: 1, resetAt: now() + WINDOW_MS });
  else entry.count += 1;
}

export async function checkCredentials(email: string, password: string, throttleKey: string): Promise<Staff | null> {
  const row = getDb().prepare('SELECT id, email, name, password_hash FROM staff_users WHERE email = ?')
    .get(email) as (Staff & { password_hash: string }) | undefined;
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, row?.password_hash ?? 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAA');
  if (!row || !ok) {
    recordFailure(throttleKey);
    return null;
  }
  failures.delete(throttleKey);
  return { id: row.id, email: row.email, name: row.name };
}
