import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, mockFetch, seedWorkspace } from './helpers';
import { deliverDue, enqueueDelivery, RETRY_DELAYS_MS, type ForwardEvent } from '@/lib/messaging/deliveries';
import { verifyClientSignature } from '@/lib/messaging/signatures';
import type { Db } from '@/lib/messaging/db';

let db: Db;
beforeEach(() => { db = freshDb(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function queue(ws: number) {
  const event = { id: 'evt_1', type: 'message.received', clientId: String(ws) } as ForwardEvent;
  enqueueDelivery(db, ws, null as unknown as number, event);
}

describe('deliverDue', () => {
  it('signs the exact body with the client secret so the client can verify it', async () => {
    const ws = seedWorkspace(db, { secret: 'oys_abc' });
    queue(ws);
    let captured: { headers: Headers; body: string } | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      captured = { headers: new Headers(init.headers), body: String(init.body) };
      return new Response('ok', { status: 200 });
    }));

    await deliverDue();

    expect(captured!.headers.get('X-OYLABS-Event-Id')).toBe('evt_1');
    const verdict = verifyClientSignature('oys_abc', captured!.headers.get('X-OYLABS-Timestamp'), captured!.headers.get('X-OYLABS-Signature'), captured!.body);
    expect(verdict).toEqual({ ok: true });
    expect(db.prepare('SELECT status, attempts FROM deliveries').get()).toEqual({ status: 'delivered', attempts: 1 });
  });

  it('backs off after failures and gives up (dead letter) after the last retry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_800_000_000_000);
    const ws = seedWorkspace(db);
    queue(ws);
    mockFetch({ 'POST client.example': () => ({ status: 500, body: {} }) });

    await deliverDue();
    let row = db.prepare('SELECT status, attempts, next_attempt_at, last_status FROM deliveries').get() as Record<string, number | string>;
    expect(row).toMatchObject({ status: 'pending', attempts: 1, last_status: 500, next_attempt_at: 1_800_000_000_000 + RETRY_DELAYS_MS[0] });

    await deliverDue(); // not due yet
    expect((db.prepare('SELECT attempts FROM deliveries').get() as { attempts: number }).attempts).toBe(1);

    for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
      vi.setSystemTime(Date.now() + 13 * 3600e3);
      await deliverDue();
    }
    row = db.prepare('SELECT status, attempts FROM deliveries').get() as Record<string, number | string>;
    expect(row).toEqual({ status: 'dead', attempts: RETRY_DELAYS_MS.length + 1 });
  });

  it('treats redirects as failures rather than following them', async () => {
    const ws = seedWorkspace(db);
    queue(ws);
    mockFetch({ 'POST client.example': () => ({ status: 302, body: {} }) });
    await deliverDue();
    expect(db.prepare('SELECT status, last_status FROM deliveries').get()).toEqual({ status: 'pending', last_status: 302 });
  });
});
