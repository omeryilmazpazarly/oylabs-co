import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, mockFetch, seedTemplate, seedWaNumber, seedWorkspace } from './helpers';
import { ingestWebhook } from '@/lib/messaging/events';
import { processDueEvents } from '@/lib/messaging/processor';
import { sendMessage, SendError, validateSendInput } from '@/lib/messaging/send';
import { buildWhatsAppBody } from '@/lib/whatsapp/send';
import { buildTemplateComponents, buildSendComponents, templateFormFields, type TemplateDraft } from '@/lib/whatsapp/templates';
import { activeChannelCount } from '@/lib/messaging/workspaces';
import { checkWaTokenExpiry, connectWithSystemToken } from '@/lib/whatsapp/numbers';
import type { Db } from '@/lib/messaging/db';

let db: Db;
let workspaceId: number;
beforeEach(() => {
  db = freshDb();
  workspaceId = seedWorkspace(db);
});
afterEach(() => { vi.unstubAllGlobals(); });

const SECOND = 1000;
const nowSeconds = () => Math.floor(Date.now() / 1000);

const waEnvelope = (field: string, value: Record<string, unknown>) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'WABA1', time: nowSeconds(), changes: [{ field, value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '447700900000', phone_number_id: 'PN1' }, ...value } }] }],
});

const inbound = (id: string, extra: Record<string, unknown> = {}) => waEnvelope('messages', {
  contacts: [{ profile: { name: 'Aisha' }, wa_id: '447911123456', user_id: 'BSUID_AISHA' }],
  messages: [{ from: '447911123456', from_user_id: 'BSUID_AISHA', id, timestamp: String(nowSeconds()), type: 'text', text: { body: 'Is the Quran class open?' }, ...extra }],
});

const counts = () => ({
  conversations: (db.prepare('SELECT COUNT(*) n FROM conversations').get() as { n: number }).n,
  messages: (db.prepare('SELECT COUNT(*) n FROM messages').get() as { n: number }).n,
  deliveries: (db.prepare('SELECT COUNT(*) n FROM deliveries').get() as { n: number }).n,
});

const lastEvent = () => JSON.parse((db.prepare('SELECT payload FROM deliveries ORDER BY id DESC LIMIT 1').get() as { payload: string }).payload);

describe('WhatsApp webhook intake', () => {
  it('stores one row per message, status, echo and contact change, and ignores repeats', () => {
    seedWaNumber(db, workspaceId);
    expect(ingestWebhook(inbound('wamid.1'))).toEqual({ stored: 1, duplicates: 0, skipped: 0 });
    expect(ingestWebhook(inbound('wamid.1'))).toEqual({ stored: 0, duplicates: 1, skipped: 0 });

    const statuses = waEnvelope('messages', { statuses: [{ id: 'wamid.out', status: 'delivered', timestamp: String(nowSeconds()), recipient_id: '447911123456' }] });
    expect(ingestWebhook(statuses).stored).toBe(1);
    expect(ingestWebhook(waEnvelope('smb_message_echoes', { message_echoes: [{ from: '447700900000', to: '447911123456', id: 'wamid.echo', timestamp: String(nowSeconds()), type: 'text', text: { body: 'Yes it is' } }] })).stored).toBe(1);
    expect(ingestWebhook(waEnvelope('smb_app_state_sync', { state_sync: [{ type: 'contact', contact: { full_name: 'Aisha Rahman', phone_number: '447911123456' }, action: 'add', metadata: { timestamp: '111' } }] })).stored).toBe(1);
    expect(ingestWebhook({ object: 'whatsapp_business_account', entry: [{ id: 'WABA1', changes: [{ field: 'flows', value: {} }] }] })).toEqual({ stored: 0, duplicates: 0, skipped: 1 });
  });
});

describe('WhatsApp message processing', () => {
  it('creates the conversation keyed by BSUID, keeps the phone number, and forwards the message', async () => {
    seedWaNumber(db, workspaceId);
    ingestWebhook(inbound('wamid.1'));
    await processDueEvents(10);

    expect(counts()).toEqual({ conversations: 1, messages: 1, deliveries: 1 });
    const conversation = db.prepare('SELECT * FROM conversations').get() as Record<string, unknown>;
    expect(conversation).toMatchObject({ channel: 'whatsapp', participant_id: 'BSUID_AISHA', participant_phone: '447911123456', participant_name: 'Aisha' });
    expect(conversation.last_inbound_at).toBeGreaterThan(0);

    const event = lastEvent();
    expect(event).toMatchObject({
      type: 'message.received', channel: 'whatsapp', direction: 'inbound', senderId: 'BSUID_AISHA', senderPhone: '447911123456',
      senderName: 'Aisha', text: 'Is the Quran class open?', pageId: null,
      whatsapp: { phoneNumberId: 'PN1', wabaId: 'WABA1', displayPhoneNumber: '447700900000' },
    });
  });

  it('exposes media through OY Labs rather than Meta links that need a token', async () => {
    seedWaNumber(db, workspaceId);
    ingestWebhook(waEnvelope('messages', {
      contacts: [{ profile: { name: 'Aisha' }, wa_id: '447911123456', user_id: 'BSUID_AISHA' }],
      messages: [{ from: '447911123456', from_user_id: 'BSUID_AISHA', id: 'wamid.img', timestamp: String(nowSeconds()), type: 'image', image: { id: '904050607', mime_type: 'image/jpeg', caption: 'Her certificate' } }],
    }));
    await processDueEvents(10);
    const event = lastEvent();
    expect(event.kind).toBe('image');
    expect(event.text).toBe('Her certificate');
    expect(event.attachments[0]).toMatchObject({ type: 'image', mediaId: '904050607', mimeType: 'image/jpeg', url: null });
    expect(event.attachments[0].mediaUrl).toMatch(/\/api\/v1\/media\/904050607$/);
  });

  it('matches a Business-app echo to the same conversation and marks it outbound', async () => {
    seedWaNumber(db, workspaceId, { coexistence: true });
    ingestWebhook(inbound('wamid.1'));
    ingestWebhook(waEnvelope('smb_message_echoes', { message_echoes: [{ from: '447700900000', to: '447911123456', id: 'wamid.echo', timestamp: String(nowSeconds()), type: 'text', text: { body: 'Yes, come at 5pm' } }] }));
    await processDueEvents(10);

    expect(counts().conversations).toBe(1);
    const echo = db.prepare("SELECT * FROM messages WHERE mid = 'wamid.echo'").get() as Record<string, unknown>;
    expect(echo).toMatchObject({ direction: 'outbound', source: 'business_app', status: 'sent', text: 'Yes, come at 5pm' });
    expect(lastEvent()).toMatchObject({ type: 'message.echo', direction: 'outbound', senderId: 'BSUID_AISHA' });
  });

  it('imports recent history but skips messages older than the retention period', async () => {
    seedWaNumber(db, workspaceId, { coexistence: true });
    const old = nowSeconds() - 120 * 24 * 60 * 60;
    const recent = nowSeconds() - 2 * 24 * 60 * 60;
    ingestWebhook(waEnvelope('history', {
      history: [{
        metadata: { phase: 1, chunk_order: 1, progress: 40 },
        threads: [{ id: '447911123456', messages: [
          { from: '447911123456', to: '447700900000', id: 'wamid.old', timestamp: String(old), type: 'text', text: { body: 'Old message' } },
          { from: '447700900000', to: '447911123456', id: 'wamid.recent', timestamp: String(recent), type: 'text', text: { body: 'Recent reply' } },
        ] }],
      }],
    }));
    await processDueEvents(10);

    expect(db.prepare("SELECT COUNT(*) n FROM messages WHERE mid = 'wamid.old'").get()).toEqual({ n: 0 });
    const kept = db.prepare("SELECT * FROM messages WHERE mid = 'wamid.recent'").get() as Record<string, number | string>;
    expect(kept).toMatchObject({ source: 'history', direction: 'outbound' });
    expect(kept.created_at).toBe(recent * SECOND); // dated by when it was sent, so retention treats it by age
    expect((db.prepare('SELECT history_status, history_progress FROM wa_numbers').get() as Record<string, unknown>)).toEqual({ history_status: 'in_progress', history_progress: 40 });
  });

  it('records delivery and read receipts, never going backwards', async () => {
    const numberId = seedWaNumber(db, workspaceId);
    db.prepare(`INSERT INTO conversations (workspace_id, wa_number_id, channel, participant_id, participant_phone, last_message_at, created_at)
                VALUES (?, ?, 'whatsapp', 'BSUID_AISHA', '447911123456', ?, ?)`).run(workspaceId, numberId, Date.now(), Date.now());
    db.prepare(`INSERT INTO messages (public_id, workspace_id, conversation_id, direction, source, kind, mid, text, status, meta_timestamp, created_at)
                VALUES ('msg_pub1', ?, 1, 'outbound', 'api', 'text', 'wamid.out', 'Hi', 'sent', ?, ?)`).run(workspaceId, Date.now(), Date.now());

    const status = (value: string) => waEnvelope('messages', { statuses: [{ id: 'wamid.out', status: value, timestamp: String(nowSeconds()), recipient_id: '447911123456', recipient_user_id: 'BSUID_AISHA' }] });
    ingestWebhook(status('read'));
    await processDueEvents(10);
    expect((db.prepare('SELECT status FROM messages WHERE mid = ?').get('wamid.out') as { status: string }).status).toBe('read');
    expect(lastEvent()).toMatchObject({ type: 'message.status', messageId: 'msg_pub1', status: { value: 'read' } });

    ingestWebhook(status('delivered'));
    await processDueEvents(10);
    expect((db.prepare('SELECT status FROM messages WHERE mid = ?').get('wamid.out') as { status: string }).status).toBe('read');
  });

  it('applies synced contact names, history refusals, template decisions and partner removal', async () => {
    const numberId = seedWaNumber(db, workspaceId, { coexistence: true });
    const templateId = seedTemplate(db, workspaceId, { status: 'PENDING' });
    const metaTemplateId = (db.prepare('SELECT template_id FROM wa_templates WHERE id = ?').get(templateId) as { template_id: string }).template_id;

    ingestWebhook(inbound('wamid.1'));
    ingestWebhook(waEnvelope('smb_app_state_sync', { state_sync: [{ type: 'contact', contact: { full_name: 'Aisha Rahman', phone_number: '+44 7911 123456' }, action: 'add', metadata: { timestamp: '1' } }] }));
    ingestWebhook(waEnvelope('history', { history: [{ errors: [{ code: 2593109, title: 'History sync is turned off' }] }] }));
    ingestWebhook({ object: 'whatsapp_business_account', entry: [{ id: 'WABA1', time: 1, changes: [{ field: 'message_template_status_update', value: { event: 'APPROVED', message_template_id: metaTemplateId, message_template_name: 'order_ready', reason: 'NONE' } }] }] });
    await processDueEvents(20);

    expect((db.prepare('SELECT name FROM wa_contacts WHERE phone = ?').get('447911123456') as { name: string }).name).toBe('Aisha Rahman');
    expect((db.prepare('SELECT history_status FROM wa_numbers WHERE id = ?').get(numberId) as { history_status: string }).history_status).toBe('declined');
    expect((db.prepare('SELECT status FROM wa_templates WHERE id = ?').get(templateId) as { status: string }).status).toBe('APPROVED');

    ingestWebhook({ object: 'whatsapp_business_account', entry: [{ id: 'WABA1', time: 2, changes: [{ field: 'account_update', value: { event: 'PARTNER_REMOVED' } }] }] });
    await processDueEvents(10);
    expect(db.prepare('SELECT status, token_enc FROM wa_numbers WHERE id = ?').get(numberId)).toEqual({ status: 'disconnected', token_enc: null });
  });
});

describe('WhatsApp sending', () => {
  const sendOk = () => mockFetch({ 'POST PN1/messages': () => ({ body: { messages: [{ id: 'wamid.sent' }], contacts: [{ input: '447911123456', wa_id: '447911123456', user_id: 'BSUID_AISHA' }] } }) });

  it('builds Meta request bodies for text, media and templates', () => {
    expect(buildWhatsAppBody({ text: 'Hello' }, { phone: '447911123456', bsuid: 'BSUID_AISHA' })).toEqual({
      messaging_product: 'whatsapp', recipient_type: 'individual', to: '447911123456', recipient: 'BSUID_AISHA', type: 'text', text: { body: 'Hello', preview_url: false },
    });
    expect(buildWhatsAppBody({ attachment: { type: 'document', url: 'https://x.test/a.pdf', filename: 'invoice.pdf', caption: 'Your invoice' } }, { phone: '4479', bsuid: null }))
      .toMatchObject({ type: 'document', document: { link: 'https://x.test/a.pdf', filename: 'invoice.pdf', caption: 'Your invoice' } });
    expect(buildWhatsAppBody({ template: { name: 'order_ready', language: 'en_US', components: [] } }, { phone: '4479', bsuid: null }))
      .toMatchObject({ type: 'template', template: { name: 'order_ready', language: { code: 'en_US' } } });
  });

  it('rejects input that WhatsApp would refuse', () => {
    expect(() => validateSendInput({ channel: 'whatsapp', recipientId: '4479', text: 'hi', tag: 'HUMAN_AGENT' })).toThrow(/tags are not used/i);
    expect(() => validateSendInput({ channel: 'whatsapp', recipientId: '4479' })).toThrow(/exactly one/i);
    expect(() => validateSendInput({ channel: 'whatsapp', recipientId: '4479', text: 'x', attachment: { type: 'image', url: 'https://x.test/a.jpg' } })).toThrow(/exactly one/i);
    expect(() => validateSendInput({ channel: 'whatsapp', recipientId: '4479', template: { name: 'Bad Name', language: 'en_US' } })).toThrow(/template.name/);
    expect(() => validateSendInput({ channel: 'messenger', recipientId: 'PSID', template: { name: 'x', language: 'en_US' } })).toThrow(/only available on WhatsApp/);
    validateSendInput({ channel: 'whatsapp', recipientId: '447911123456', template: { name: 'order_ready', language: 'en_US' } });
  });

  it('needs an open window for free-form replies but lets a template start a conversation', async () => {
    seedWaNumber(db, workspaceId);
    await expect(sendMessage({ workspaceId, channel: 'whatsapp', recipientId: '447911123456', text: 'Hello', source: 'api' }))
      .rejects.toMatchObject({ code: 'conversation_not_found' });

    const calls = sendOk();
    const result = await sendMessage({
      workspaceId, channel: 'whatsapp', recipientId: '+44 7911 123456',
      template: { name: 'order_ready', language: { code: 'en_US' }, components: [] }, source: 'api',
    });
    expect(result).toMatchObject({ channel: 'whatsapp', mid: 'wamid.sent', recipientId: 'BSUID_AISHA' });
    expect(calls[0].body).toMatchObject({ to: '447911123456', type: 'template' });
    const stored = db.prepare('SELECT kind, template, status FROM messages WHERE mid = ?').get('wamid.sent') as Record<string, string>;
    expect(stored.kind).toBe('template');
    expect(JSON.parse(stored.template).name).toBe('order_ready');
  });

  it('refuses a free-form reply more than 24 hours after the last customer message', async () => {
    const numberId = seedWaNumber(db, workspaceId);
    const old = Date.now() - 25 * 60 * 60 * 1000;
    db.prepare(`INSERT INTO conversations (workspace_id, wa_number_id, channel, participant_id, participant_phone, last_inbound_at, last_message_at, created_at)
                VALUES (?, ?, 'whatsapp', 'BSUID_AISHA', '447911123456', ?, ?, ?)`).run(workspaceId, numberId, old, old, old);
    await expect(sendMessage({ workspaceId, channel: 'whatsapp', recipientId: 'BSUID_AISHA', text: 'Still there?', source: 'api' }))
      .rejects.toMatchObject({ code: 'outside_messaging_window' });

    sendOk();
    await expect(sendMessage({ workspaceId, channel: 'whatsapp', recipientId: 'BSUID_AISHA', template: { name: 'order_ready', language: 'en_US' }, source: 'api' })).resolves.toMatchObject({ mid: 'wamid.sent' });
  });

  it('asks which number to use when the workspace has more than one', async () => {
    seedWaNumber(db, workspaceId);
    seedWaNumber(db, workspaceId, { phoneNumberId: 'PN2', display: '447700900001' });
    await expect(sendMessage({ workspaceId, channel: 'whatsapp', recipientId: '447911123456', template: { name: 'order_ready', language: 'en_US' }, source: 'api' }))
      .rejects.toMatchObject({ code: 'page_id_required' });
  });

  it('counts a WhatsApp number as one channel against the plan', () => {
    seedWaNumber(db, workspaceId);
    expect(activeChannelCount(workspaceId)).toBe(1);
    seedWaNumber(db, workspaceId, { phoneNumberId: 'PN2', status: 'disconnected' });
    expect(activeChannelCount(workspaceId)).toBe(1);
  });
});

describe('templates', () => {
  const draft = (over: Partial<TemplateDraft> = {}): TemplateDraft => ({
    wabaId: 'WABA1', name: 'order_ready', language: 'en_US', category: 'UTILITY',
    header: { format: 'NONE' }, body: { text: 'Hello {{1}}, order {{2}} is ready.', examples: ['Aisha', 'A-1001'] },
    footer: '', buttons: [], ...over,
  });

  it('builds the components Meta expects, with examples for every variable', () => {
    const { components, parameterFormat } = buildTemplateComponents(draft());
    expect(parameterFormat).toBe('POSITIONAL');
    expect(components).toEqual([{ type: 'BODY', text: 'Hello {{1}}, order {{2}} is ready.', example: { body_text: [['Aisha', 'A-1001']] } }]);

    const named = buildTemplateComponents(draft({ body: { text: 'Hi {{name}}, order {{order_id}} is ready.', examples: ['Aisha', 'A-1001'] } }));
    expect(named.parameterFormat).toBe('NAMED');
    expect(named.components[0]).toMatchObject({ example: { body_text_named_params: [{ param_name: 'name', example: 'Aisha' }, { param_name: 'order_id', example: 'A-1001' }] } });
  });

  it('catches the mistakes WhatsApp would reject', () => {
    expect(() => buildTemplateComponents(draft({ body: { text: 'Hello {{1}}', examples: [] } }))).toThrow(/example value/i);
    expect(() => buildTemplateComponents(draft({ body: { text: 'Hello {{2}}', examples: ['x'] } }))).toThrow(/in order from/i);
    expect(() => buildTemplateComponents(draft({ body: { text: 'Hi {{1}} {{name}}', examples: ['a', 'b'] } }))).toThrow(/not both/i);
    expect(() => buildTemplateComponents(draft({ name: 'Order Ready' }))).toThrow(/lowercase/i);
    expect(() => buildTemplateComponents(draft({ header: { format: 'IMAGE' } }))).toThrow(/example file/i);
    expect(() => buildTemplateComponents(draft({ buttons: [{ type: 'URL', text: 'Track', url: 'http://x.test' }] }))).toThrow(/https/i);
    expect(() => buildTemplateComponents(draft({ footer: 'x'.repeat(61) }))).toThrow(/footer/i);
  });

  it('groups quick replies first and keeps link and call buttons', () => {
    const { components } = buildTemplateComponents(draft({
      buttons: [
        { type: 'URL', text: 'Track', url: 'https://x.test/{{1}}', example: ['A-1001'] },
        { type: 'QUICK_REPLY', text: 'Thanks' },
        { type: 'PHONE_NUMBER', text: 'Call us', phone_number: '+442012345678' },
      ],
    }));
    const buttons = (components[1] as { buttons: { type: string }[] }).buttons;
    expect(buttons.map((b) => b.type)).toEqual(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']);
  });

  it('turns the send form values into template parameters', () => {
    const id = seedTemplate(db, workspaceId, {
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Order {{1}}' },
        { type: 'BODY', text: 'Hello {{1}}, collect it by {{2}}.' },
        { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Track', url: 'https://x.test/{{1}}' }] },
      ],
    });
    const template = db.prepare('SELECT * FROM wa_templates WHERE id = ?').get(id) as { components: string } & Record<string, never>;
    const parsed = { ...template, components: JSON.parse(template.components) } as never;

    expect(templateFormFields(parsed)).toMatchObject({ header: 'text', bodyVariables: ['1', '2'], urlVariable: true });
    expect(buildSendComponents(parsed, { header: 'A-1001', body: ['Aisha', 'Friday'], url: 'A-1001' })).toEqual([
      { type: 'header', parameters: [{ type: 'text', text: 'A-1001' }] },
      { type: 'body', parameters: [{ type: 'text', text: 'Aisha' }, { type: 'text', text: 'Friday' }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: 'A-1001' }] },
    ]);
  });
});

describe('WhatsApp token expiry', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const seedOwner = (email: string) => {
    const { lastInsertRowid } = db.prepare(`INSERT INTO client_users (email, name, password_hash, email_verified_at, created_at) VALUES (?, 'Owner', 'x', ?, ?)`)
      .run(email, Date.now(), Date.now());
    db.prepare(`INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)`).run(workspaceId, Number(lastInsertRowid), Date.now());
  };

  it('reminds owners once, a week before, and flags the number when access lapses', async () => {
    seedOwner('owner@brightkids.test');
    const soon = seedWaNumber(db, workspaceId);
    const later = seedWaNumber(db, workspaceId, { phoneNumberId: 'PN2' });
    const gone = seedWaNumber(db, workspaceId, { phoneNumberId: 'PN3' });
    const now = Date.now();
    db.prepare('UPDATE wa_numbers SET token_expires_at = ? WHERE id = ?').run(now + 3 * DAY, soon);
    db.prepare('UPDATE wa_numbers SET token_expires_at = ? WHERE id = ?').run(now + 30 * DAY, later);
    db.prepare('UPDATE wa_numbers SET token_expires_at = ? WHERE id = ?').run(now - 1000, gone);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(await checkWaTokenExpiry(now)).toEqual({ expired: 1, reminded: 1 });
    expect(log.mock.calls.some(([line]) => String(line).includes('owner@brightkids.test') && String(line).includes('Reconnect WhatsApp'))).toBe(true);
    expect((db.prepare('SELECT status FROM wa_numbers WHERE id = ?').get(gone) as { status: string }).status).toBe('reconnect_needed');
    expect((db.prepare('SELECT status FROM wa_numbers WHERE id = ?').get(later) as { status: string }).status).toBe('active');

    // Running again the same hour sends nothing new.
    expect(await checkWaTokenExpiry(now + 60_000)).toEqual({ expired: 0, reminded: 0 });
    log.mockRestore();
  });
});

describe('direct WhatsApp connection (system-user token)', () => {
  const TOKEN = 'EAA' + 'x'.repeat(120);
  const graphOk = (scopes = ['whatsapp_business_management', 'whatsapp_business_messaging'], expiresAt = 0) => mockFetch({
    'GET debug_token': () => ({ body: { data: { is_valid: true, user_id: 'SYSUSER1', expires_at: expiresAt, scopes } } }),
    'GET 109876543210987': () => ({ body: { id: '109876543210987', display_phone_number: '+44 20 3951 5794', verified_name: 'OY Labs', quality_rating: 'GREEN' } }),
    'POST 102030405060708/subscribed_apps': () => ({ body: { success: true } }),
    'POST 109876543210987/register': () => ({ body: { success: true } }),
  });
  const input = { wabaId: '102030405060708', phoneNumberId: '109876543210987', token: TOKEN };

  it('checks the token, subscribes the account and stores a never-expiring connection', async () => {
    const calls = graphOk();
    const number = await connectWithSystemToken({ workspaceId, ...input });
    expect(number).toMatchObject({ status: 'active', coexistence: 0, display_phone_number: '+44 20 3951 5794', token_expires_at: null });
    expect(calls.map((c) => `${c.method} ${c.url.pathname.split('/').slice(2).join('/')}`)).toEqual([
      'GET debug_token', 'GET 109876543210987', 'POST 102030405060708/subscribed_apps',
    ]);
    expect(activeChannelCount(workspaceId)).toBe(1);
  });

  it('registers the number only when asked, with the chosen PIN', async () => {
    const calls = graphOk();
    await connectWithSystemToken({ workspaceId, ...input, registerPin: '482913' });
    const register = calls.find((c) => c.url.pathname.endsWith('/register'));
    expect(register?.body).toEqual({ messaging_product: 'whatsapp', pin: '482913' });
  });

  it('explains what is wrong instead of connecting', async () => {
    graphOk(['whatsapp_business_messaging']);
    await expect(connectWithSystemToken({ workspaceId, ...input })).rejects.toThrow(/missing: whatsapp_business_management/);
    await expect(connectWithSystemToken({ workspaceId, ...input, wabaId: 'abc' })).rejects.toThrow(/WhatsApp Business Account ID/);
    await expect(connectWithSystemToken({ workspaceId, ...input, registerPin: '12' })).rejects.toThrow(/6 digits/);
    await expect(connectWithSystemToken({ workspaceId, ...input, token: 'short' })).rejects.toThrow(/system-user access token/);
    expect(activeChannelCount(workspaceId)).toBe(0);
  });
});
