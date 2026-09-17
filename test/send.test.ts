import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, mockFetch, seedConnection, seedWorkspace } from './helpers';
import { sendMessage, SendError, validateSendInput } from '@/lib/messaging/send';
import { messagingWindow } from '@/lib/messaging/conversations';
import type { Db } from '@/lib/messaging/db';

const HOUR = 3600e3;
const NOW = 1_800_000_000_000;
let db: Db;
let ws: number;
let connectionId: number;

beforeEach(() => {
  db = freshDb();
  ws = seedWorkspace(db);
  connectionId = seedConnection(db, ws);
  delete process.env.META_HUMAN_AGENT_APPROVED;
});
afterEach(() => { vi.unstubAllGlobals(); });

function conversationWithInbound(lastInboundAt: number | null, channel = 'messenger', participant = 'PSID9') {
  db.prepare(`INSERT INTO conversations (workspace_id, connection_id, channel, participant_id, last_inbound_at, last_message_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(ws, connectionId, channel, participant, lastInboundAt, lastInboundAt ?? NOW, NOW);
}

async function expectSendError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof SendError && e.code === code);
}

describe('messagingWindow', () => {
  it('is open for 24h after the last inbound message, then closed unless Human Agent is approved', () => {
    expect(messagingWindow(NOW - 23 * HOUR, NOW, false).kind).toBe('open');
    expect(messagingWindow(NOW - 25 * HOUR, NOW, false).kind).toBe('closed');
    expect(messagingWindow(NOW - 25 * HOUR, NOW, true).kind).toBe('human_agent');
    expect(messagingWindow(NOW - 8 * 24 * HOUR, NOW, true).kind).toBe('closed');
    expect(messagingWindow(null, NOW, true).kind).toBe('closed');
  });
});

describe('validateSendInput', () => {
  const base = { workspaceId: 1, channel: 'messenger' as const, recipientId: 'P', source: 'api' as const };
  it('requires exactly one of text or attachment and enforces channel limits', () => {
    expect(() => validateSendInput({ ...base })).toThrow(SendError);
    expect(() => validateSendInput({ ...base, text: 'hi', attachment: { type: 'image', url: 'https://x' } })).toThrow(SendError);
    expect(() => validateSendInput({ ...base, text: 'x'.repeat(2001) })).toThrow(/2000/);
    expect(() => validateSendInput({ ...base, channel: 'instagram', text: 'é'.repeat(501) })).toThrow(/1000 bytes/);
    expect(() => validateSendInput({ ...base, attachment: { type: 'image', url: 'http://insecure' } })).toThrow(/https/);
    expect(() => validateSendInput({ ...base, text: 'hello' })).not.toThrow();
  });
});

describe('sendMessage', () => {
  it('sends a RESPONSE inside the window and records the outbound message', async () => {
    conversationWithInbound(NOW - HOUR);
    const calls = mockFetch({ 'POST /PAGE1/messages': () => ({ body: { recipient_id: 'PSID9', message_id: 'm.out' } }) });

    const result = await sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'Wa alaykum salam', source: 'api' }, NOW);

    expect(result).toMatchObject({ mid: 'm.out', replayed: false });
    expect(calls[0].body).toEqual({ recipient: { id: 'PSID9' }, messaging_type: 'RESPONSE', message: { text: 'Wa alaykum salam' } });
    expect(db.prepare('SELECT direction, source, mid FROM messages').get()).toEqual({ direction: 'outbound', source: 'api', mid: 'm.out' });
  });

  it('refuses outside the 24-hour window without calling Meta', async () => {
    conversationWithInbound(NOW - 25 * HOUR);
    const calls = mockFetch({});
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'late', source: 'api' }, NOW), 'outside_messaging_window');
    expect(calls).toHaveLength(0);
  });

  it('refuses HUMAN_AGENT unless the feature is approved, and uses the tag when it is', async () => {
    conversationWithInbound(NOW - 30 * HOUR);
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'x', tag: 'HUMAN_AGENT', source: 'api' }, NOW), 'human_agent_not_approved');

    process.env.META_HUMAN_AGENT_APPROVED = 'true';
    const calls = mockFetch({ 'POST /PAGE1/messages': () => ({ body: { message_id: 'm.tag' } }) });
    await sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'x', tag: 'HUMAN_AGENT', source: 'api' }, NOW);
    expect(calls[0].body).toMatchObject({ messaging_type: 'MESSAGE_TAG', tag: 'HUMAN_AGENT' });
  });

  it('refuses people who have never messaged the business', async () => {
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'STRANGER', text: 'hi', source: 'api' }, NOW), 'conversation_not_found');
  });

  it('flags the connection for reconnection when Meta rejects the token', async () => {
    conversationWithInbound(NOW - HOUR);
    mockFetch({ 'POST /PAGE1/messages': () => ({ status: 400, body: { error: { message: 'Session expired', code: 190 } } }) });
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'hi', source: 'api' }, NOW), 'reconnect_needed');
    expect(db.prepare('SELECT status FROM connections').get()).toEqual({ status: 'reconnect_needed' });
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'messenger', recipientId: 'PSID9', text: 'hi', source: 'api' }, NOW), 'reconnect_needed');
  });

  it('replays an idempotent request instead of sending twice', async () => {
    conversationWithInbound(NOW - HOUR);
    const calls = mockFetch({ 'POST /PAGE1/messages': () => ({ body: { message_id: 'm.once' } }) });
    const input = { workspaceId: ws, channel: 'messenger' as const, recipientId: 'PSID9', text: 'hi', source: 'api' as const, idempotencyKey: 'abc' };
    const first = await sendMessage(input, NOW);
    const second = await sendMessage(input, NOW);
    expect(second).toMatchObject({ id: first.id, replayed: true });
    expect(calls).toHaveLength(1);
  });

  it('never lets one workspace send through another workspace\'s Page', async () => {
    conversationWithInbound(NOW - HOUR);
    const stranger = seedWorkspace(db, { name: 'Stranger' });
    await expectSendError(sendMessage({ workspaceId: stranger, channel: 'messenger', recipientId: 'PSID9', text: 'hi', source: 'api', pageId: 'PAGE1' }, NOW), 'connection_not_found');
  });

  it('only sends on Instagram when the connection has a linked IG account', async () => {
    db.prepare('UPDATE connections SET ig_account_id = NULL').run();
    await expectSendError(sendMessage({ workspaceId: ws, channel: 'instagram', recipientId: 'IGSID', text: 'hi', source: 'api' }, NOW), 'connection_not_found');
  });
});
