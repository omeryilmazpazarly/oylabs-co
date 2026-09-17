import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'crypto';
import { freshDb, mockFetch, seedConnection, seedWorkspace } from './helpers';
import { getDeletionStatus, handleDataDeletionRequest, handleDeauthorize, deleteConversationData } from '@/lib/messaging/deletion';
import { purgeExpiredData } from '@/lib/messaging/worker';
import type { Db } from '@/lib/messaging/db';

let db: Db;
beforeEach(() => { db = freshDb(); });
afterEach(() => { vi.unstubAllGlobals(); });

function signed(userId: string, secret = process.env.META_APP_SECRET!) {
  const payload = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: userId, issued_at: 1 })).toString('base64url');
  return `${createHmac('sha256', secret).update(payload).digest('base64url')}.${payload}`;
}

function seedMessage(ws: number, connectionId: number, createdAt = Date.now()) {
  const { lastInsertRowid } = db.prepare(`INSERT INTO conversations (workspace_id, connection_id, channel, participant_id, last_message_at, created_at) VALUES (?, ?, 'messenger', ?, ?, ?)`)
    .run(ws, connectionId, `PSID${Math.random()}`, createdAt, createdAt);
  db.prepare(`INSERT INTO messages (public_id, workspace_id, conversation_id, direction, source, text, status, meta_timestamp, created_at) VALUES (?, ?, ?, 'inbound', 'customer', 'hi', 'received', ?, ?)`)
    .run(`msg_${Math.random()}`, ws, lastInsertRowid, createdAt, createdAt);
  return Number(lastInsertRowid);
}

describe('data deletion callback', () => {
  it('deletes the connections this Meta user authorised with their messages, and returns a status URL and code', async () => {
    const ws = seedWorkspace(db);
    const mine = seedConnection(db, ws, { pageId: 'PAGE1', igId: 'IG1', metaUserId: 'ASID1' });
    const theirs = seedConnection(db, ws, { pageId: 'PAGE2', igId: 'IG2', metaUserId: 'ASID2' });
    seedMessage(ws, mine);
    seedMessage(ws, theirs);
    const calls = mockFetch({ 'DELETE /PAGE1/subscribed_apps': () => ({ body: { success: true } }) });

    const res = await handleDataDeletionRequest(signed('ASID1'));

    expect(res?.url).toBe(`https://oylabs.test/data-deletion/status?code=${res?.confirmation_code}`);
    expect(res?.confirmation_code).toMatch(/^DEL[A-Z0-9]{10}$/);
    expect(calls.map((c) => c.method)).toEqual(['DELETE']);
    expect(db.prepare('SELECT page_id FROM connections').all()).toEqual([{ page_id: 'PAGE2' }]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get()).toEqual({ n: 1 });
    expect(getDeletionStatus(res!.confirmation_code)).toMatchObject({ status: 'completed' });
  });

  it('still returns a code when nothing is stored for the user', async () => {
    const res = await handleDataDeletionRequest(signed('NOBODY'));
    expect(getDeletionStatus(res!.confirmation_code)).toMatchObject({ status: 'no_data' });
  });

  it('rejects forged requests', async () => {
    expect(await handleDataDeletionRequest(signed('ASID1', 'wrong-secret'))).toBeNull();
  });
});

describe('deauthorize callback', () => {
  it('disconnects and wipes tokens for that user', async () => {
    seedConnection(db, seedWorkspace(db), { metaUserId: 'ASID1' });
    expect(await handleDeauthorize(signed('ASID1'))).toBe(true);
    expect(db.prepare('SELECT status, page_token_enc FROM connections').get()).toEqual({ status: 'disconnected', page_token_enc: null });
  });
});

describe('staff conversation deletion', () => {
  it('removes one conversation and records a completed request', () => {
    const ws = seedWorkspace(db);
    const conv = seedMessage(ws, seedConnection(db, ws));
    const code = deleteConversationData(conv);
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get()).toEqual({ n: 0 });
    expect(getDeletionStatus(code!)).toMatchObject({ status: 'completed' });
  });
});

describe('purgeExpiredData', () => {
  it('deletes messages older than 90 days and keeps recent ones', () => {
    const ws = seedWorkspace(db);
    const conn = seedConnection(db, ws);
    const now = 1_800_000_000_000;
    seedMessage(ws, conn, now - 91 * 86400e3);
    seedMessage(ws, conn, now - 10 * 86400e3);
    const result = purgeExpiredData(now);
    expect(result).toMatchObject({ messages: 1, conversations: 1 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get()).toEqual({ n: 1 });
  });
});
