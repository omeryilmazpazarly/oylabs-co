import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, mockFetch, seedConnection, seedWorkspace } from './helpers';
import { ingestWebhook } from '@/lib/messaging/events';
import { processDueEvents, routeEvent } from '@/lib/messaging/processor';
import type { Db } from '@/lib/messaging/db';

let db: Db;
beforeEach(() => { db = freshDb(); });
afterEach(() => { vi.unstubAllGlobals(); });

const messengerText = (mid: string, text = 'Hello, is the Quran class still open?') => ({
  object: 'page',
  entry: [{ id: 'PAGE1', time: 1, messaging: [{ sender: { id: 'PSID9' }, recipient: { id: 'PAGE1' }, timestamp: 1_800_000_000_000, message: { mid, text } }] }],
});

describe('ingestWebhook', () => {
  it('stores each message once even when Meta redelivers', () => {
    expect(ingestWebhook(messengerText('m.1'))).toEqual({ stored: 1, duplicates: 0, skipped: 0 });
    expect(ingestWebhook(messengerText('m.1'))).toEqual({ stored: 0, duplicates: 1, skipped: 0 });
  });

  it('ignores unknown objects and non-message items such as read receipts', () => {
    expect(ingestWebhook({ object: 'user', entry: [] }).stored).toBe(0);
    const read = { object: 'page', entry: [{ id: 'PAGE1', messaging: [{ sender: { id: 'P' }, read: { watermark: 1 } }] }] };
    expect(ingestWebhook(read)).toEqual({ stored: 0, duplicates: 0, skipped: 1 });
  });
});

describe('routeEvent', () => {
  it('routes Messenger by Page ID and Instagram by IG account ID to the owning workspace', () => {
    const minhaj = seedWorkspace(db);
    const other = seedWorkspace(db, { name: 'Other' });
    seedConnection(db, minhaj, { pageId: 'PAGE1', igId: 'IG1' });
    seedConnection(db, other, { pageId: 'PAGE2', igId: 'IG2' });

    expect(routeEvent('page', 'PAGE1')).toMatchObject({ channel: 'messenger', connection: { workspace_id: minhaj } });
    expect(routeEvent('instagram', 'IG2')).toMatchObject({ channel: 'instagram', connection: { workspace_id: other } });
    expect(routeEvent('instagram', 'PAGE1')).toBeNull();
    expect(routeEvent('page', 'UNKNOWN')).toBeNull();
  });

  it('does not route to disconnected connections', () => {
    seedConnection(db, seedWorkspace(db), { status: 'disconnected' });
    expect(routeEvent('page', 'PAGE1')).toBeNull();
  });
});

describe('processDueEvents', () => {
  it('creates the conversation, stores the message, opens the window and queues a forward with the sender name', async () => {
    const ws = seedWorkspace(db);
    seedConnection(db, ws);
    const calls = mockFetch({ 'GET /PSID9': () => ({ body: { first_name: 'Aisha', last_name: 'Khan', profile_pic: 'https://cdn/p.jpg' } }) });

    ingestWebhook(messengerText('m.1'));
    await processDueEvents();

    const conv = db.prepare('SELECT * FROM conversations').get() as Record<string, unknown>;
    expect(conv).toMatchObject({ channel: 'messenger', participant_id: 'PSID9', participant_name: 'Aisha Khan', last_inbound_at: 1_800_000_000_000 });
    expect(db.prepare('SELECT direction, source, text FROM messages').get()).toEqual({ direction: 'inbound', source: 'customer', text: 'Hello, is the Quran class still open?' });

    const delivery = db.prepare('SELECT payload, status FROM deliveries').get() as { payload: string; status: string };
    expect(delivery.status).toBe('pending');
    expect(JSON.parse(delivery.payload)).toMatchObject({
      type: 'message.received', clientId: String(ws), channel: 'messenger', direction: 'inbound',
      pageId: 'PAGE1', igAccountId: null, senderId: 'PSID9', senderName: 'Aisha Khan', mid: 'm.1',
    });
    expect(calls[0].url.searchParams.get('appsecret_proof')).toMatch(/^[0-9a-f]{64}$/);
    expect(db.prepare('SELECT status FROM webhook_events').get()).toEqual({ status: 'done' });
  });

  it('marks events for unknown Pages as ignored without failing', async () => {
    ingestWebhook(messengerText('m.1'));
    await processDueEvents();
    expect(db.prepare('SELECT status FROM webhook_events').get()).toEqual({ status: 'ignored' });
  });

  it('records page-inbox echoes as outbound without forwarding and without reopening the window', async () => {
    const ws = seedWorkspace(db);
    seedConnection(db, ws);
    ingestWebhook({ object: 'page', entry: [{ id: 'PAGE1', messaging: [{ sender: { id: 'PAGE1' }, recipient: { id: 'PSID9' }, timestamp: 5, message: { mid: 'm.echo', text: 'Yes!', is_echo: true } }] }] });
    await processDueEvents();
    expect(db.prepare('SELECT direction, source FROM messages').get()).toEqual({ direction: 'outbound', source: 'page_inbox' });
    expect(db.prepare('SELECT last_inbound_at FROM conversations').get()).toEqual({ last_inbound_at: null });
    expect(db.prepare('SELECT COUNT(*) AS n FROM deliveries').get()).toEqual({ n: 0 });
  });

  it('handles Instagram messages with attachments and still forwards when the profile lookup fails', async () => {
    const ws = seedWorkspace(db);
    seedConnection(db, ws, { igId: 'IG1' });
    mockFetch({ 'GET /IGSID7': () => ({ status: 400, body: { error: { message: 'nope', code: 100 } } }) });
    ingestWebhook({ object: 'instagram', entry: [{ id: 'IG1', messaging: [{ sender: { id: 'IGSID7' }, recipient: { id: 'IG1' }, timestamp: 9, message: { mid: 'ig.1', attachments: [{ type: 'image', payload: { url: 'https://lookaside/img' } }] } }] }] });
    await processDueEvents();
    const payload = JSON.parse((db.prepare('SELECT payload FROM deliveries').get() as { payload: string }).payload);
    expect(payload).toMatchObject({ channel: 'instagram', igAccountId: 'IG1', senderName: null, attachments: [{ type: 'image', url: 'https://lookaside/img' }] });
  });

  it('removes our copy when the customer unsends a message', async () => {
    const ws = seedWorkspace(db, { forwardUrl: null });
    seedConnection(db, ws);
    mockFetch({ 'GET /PSID9': () => ({ body: {} }) });
    ingestWebhook(messengerText('m.1'));
    await processDueEvents();
    ingestWebhook({ object: 'page', entry: [{ id: 'PAGE1', messaging: [{ sender: { id: 'PSID9' }, recipient: { id: 'PAGE1' }, timestamp: 2, message: { mid: 'm.1', is_deleted: true } }] }] });
    await processDueEvents();
    expect(db.prepare('SELECT COUNT(*) AS n FROM messages').get()).toEqual({ n: 0 });
  });
});
