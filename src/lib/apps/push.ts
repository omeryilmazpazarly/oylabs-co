import 'server-only';
import { getDb, now } from '@/lib/messaging/db';
import { log, errorSummary } from '@/lib/log';
import { AppError } from './apps';

/**
 * Push notifications for the mobile apps, sent through Expo's push service
 * (https://docs.expo.dev/push-notifications/sending-notifications/). Expo relays to
 * Firebase (Android) and APNs (iOS) using the credentials uploaded to each app's
 * EAS project, so this server only holds device tokens.
 */

export type Topic = 'orderUpdates' | 'offers' | 'backInStock';
export const TOPICS: Topic[] = ['orderUpdates', 'offers', 'backInStock'];
export type Audience = 'all' | `topic:${Topic}` | `customer:${string}`;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TOKEN = /^Expo(nent)?PushToken\[[^\]]{10,}\]$/;
const BATCH = 100;

export interface DeviceInput {
  appId: number;
  pushToken: string;
  platform: 'android' | 'ios' | 'web';
  language?: string | null;
  customerId?: string | null;
  topics?: Topic[];
}

/** Registers or refreshes a device; returns its id. */
export function registerDevice(input: DeviceInput): number {
  const token = input.pushToken.trim();
  if (!TOKEN.test(token)) throw new AppError('Invalid push token.');
  if (!['android', 'ios', 'web'].includes(input.platform)) throw new AppError('Invalid platform.');
  const topics = JSON.stringify((input.topics ?? ['orderUpdates', 'backInStock']).filter((t) => TOPICS.includes(t)));
  const language = input.language?.slice(0, 5) || null;
  const customer = input.customerId?.trim().slice(0, 80) || null;
  const t = now();
  getDb()
    .prepare(
      `INSERT INTO mobile_app_devices (app_id, push_token, platform, language, customer_id, topics, created_at, last_seen_at)
       VALUES (@appId, @token, @platform, @language, @customer, @topics, @t, @t)
       ON CONFLICT (app_id, push_token) DO UPDATE SET
         platform = excluded.platform, language = excluded.language, customer_id = excluded.customer_id,
         topics = excluded.topics, last_seen_at = excluded.last_seen_at`,
    )
    .run({ appId: input.appId, token, platform: input.platform, language, customer, topics, t });
  const row = getDb().prepare('SELECT id FROM mobile_app_devices WHERE app_id = ? AND push_token = ?').get(input.appId, token) as { id: number };
  return row.id;
}

export function deviceStats(appId: number): { total: number; offers: number; android: number; ios: number } {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN EXISTS (SELECT 1 FROM json_each(topics) WHERE value = 'offers') THEN 1 ELSE 0 END) AS offers,
         SUM(platform = 'android') AS android, SUM(platform = 'ios') AS ios
       FROM mobile_app_devices WHERE app_id = ?`,
    )
    .get(appId) as { total: number; offers: number; android: number; ios: number };
}

/** Asks to be told when a sold-out variant is back. */
export function subscribeStockAlert(appId: number, pushToken: string, variantId: string, productHandle: string, productTitle?: string | null): void {
  const device = getDb().prepare('SELECT id FROM mobile_app_devices WHERE app_id = ? AND push_token = ?').get(appId, pushToken.trim()) as
    | { id: number }
    | undefined;
  if (!device) throw new AppError('Register the device first.');
  if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variantId)) throw new AppError('Invalid variant.');
  getDb()
    .prepare(
      `INSERT INTO mobile_app_stock_alerts (app_id, device_id, variant_id, product_handle, product_title, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (device_id, variant_id) DO UPDATE SET notified_at = NULL, created_at = excluded.created_at`,
    )
    .run(appId, device.id, variantId, productHandle.slice(0, 200), productTitle?.slice(0, 200) ?? null, now());
}

interface DeviceRow {
  id: number;
  push_token: string;
}

function audienceDevices(appId: number, audience: Audience): DeviceRow[] {
  if (audience === 'all') {
    return getDb().prepare('SELECT id, push_token FROM mobile_app_devices WHERE app_id = ?').all(appId) as DeviceRow[];
  }
  if (audience.startsWith('topic:')) {
    return getDb()
      .prepare(
        `SELECT id, push_token FROM mobile_app_devices
         WHERE app_id = ? AND EXISTS (SELECT 1 FROM json_each(topics) WHERE value = ?)`,
      )
      .all(appId, audience.slice('topic:'.length)) as DeviceRow[];
  }
  return getDb()
    .prepare('SELECT id, push_token FROM mobile_app_devices WHERE app_id = ? AND customer_id = ?')
    .all(appId, audience.slice('customer:'.length)) as DeviceRow[];
}

interface ExpoTicket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

/** Sends one message to many devices in batches; drops devices Expo says are gone. Returns how many were accepted. */
export async function deliver(devices: DeviceRow[], message: { title: string; body: string; link?: string | null }): Promise<number> {
  let accepted = 0;
  for (let i = 0; i < devices.length; i += BATCH) {
    const batch = devices.slice(i, i + BATCH);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(
        batch.map((d) => ({
          to: d.push_token,
          title: message.title,
          body: message.body,
          sound: 'default',
          data: message.link ? { link: message.link } : {},
        })),
      ),
    });
    if (!res.ok) throw new Error(`Expo push failed with HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: ExpoTicket[] };
    const gone: number[] = [];
    data.forEach((ticket, k) => {
      if (ticket.status === 'ok') accepted++;
      else if (ticket.details?.error === 'DeviceNotRegistered') gone.push(batch[k].id);
    });
    if (gone.length) {
      const del = getDb().prepare('DELETE FROM mobile_app_devices WHERE id = ?');
      getDb().transaction(() => gone.forEach((id) => del.run(id)))();
    }
  }
  return accepted;
}

export interface CampaignInput {
  appId: number;
  title: string;
  body: string;
  link?: string | null;
  audience: Audience;
  userId?: number | null;
  staffId?: number | null;
}

/** Records and sends a campaign (marketing pushes go to devices that opted into offers). */
export async function sendCampaign(input: CampaignInput): Promise<{ id: number; sent: number }> {
  const title = input.title.trim().slice(0, 65);
  const body = input.body.trim().slice(0, 240);
  if (!title || !body) throw new AppError('Write a title and a message.');
  const link = input.link?.trim() || null;
  if (link && !link.startsWith('/')) throw new AppError('Links open a page in the app, e.g. /collection/summer or /product/pleated-skirt.');
  const t = now();
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO mobile_app_pushes (app_id, kind, title, body, link, audience, status, sent_by_user_id, sent_by_staff_id, created_at)
       VALUES (?, 'campaign', ?, ?, ?, ?, 'sending', ?, ?, ?)`,
    )
    .run(input.appId, title, body, link, input.audience, input.userId ?? null, input.staffId ?? null, t);
  const id = Number(lastInsertRowid);
  try {
    const sent = await deliver(audienceDevices(input.appId, input.audience), { title, body, link });
    getDb().prepare(`UPDATE mobile_app_pushes SET status = 'sent', sent_count = ?, sent_at = ? WHERE id = ?`).run(sent, now(), id);
    return { id, sent };
  } catch (err) {
    log.error('mobile_push_failed', { appId: input.appId, pushId: id, error: errorSummary(err) });
    getDb().prepare(`UPDATE mobile_app_pushes SET status = 'failed', error = ? WHERE id = ?`).run(String(err).slice(0, 300), id);
    throw new AppError('The notification could not be sent. Try again in a minute.');
  }
}

export function listPushes(appId: number, limit = 30) {
  return getDb()
    .prepare('SELECT * FROM mobile_app_pushes WHERE app_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(appId, limit) as {
    id: number;
    kind: string;
    title: string;
    body: string;
    link: string | null;
    audience: string;
    status: string;
    sent_count: number;
    error: string | null;
    created_at: number;
    sent_at: number | null;
  }[];
}

/** Automatic, per-customer push (order updates); recorded so the merchant can see what went out. */
export async function sendAutomatic(appId: number, kind: 'order_update' | 'back_in_stock', devices: DeviceRow[], message: { title: string; body: string; link?: string | null }) {
  if (!devices.length) return 0;
  const sent = await deliver(devices, message);
  getDb()
    .prepare(
      `INSERT INTO mobile_app_pushes (app_id, kind, title, body, link, audience, status, sent_count, created_at, sent_at)
       VALUES (?, ?, ?, ?, ?, 'automatic', 'sent', ?, ?, ?)`,
    )
    .run(appId, kind, message.title, message.body, message.link ?? null, sent, now(), now());
  return sent;
}

export function customerDevices(appId: number, customerId: string, topic: Topic): DeviceRow[] {
  return getDb()
    .prepare(
      `SELECT id, push_token FROM mobile_app_devices
       WHERE app_id = ? AND customer_id = ? AND EXISTS (SELECT 1 FROM json_each(topics) WHERE value = ?)`,
    )
    .all(appId, customerId, topic) as DeviceRow[];
}

/** Devices waiting on these variants, marked notified in the same step so nobody is told twice. */
export function claimStockAlerts(appId: number, variantIds: string[]): (DeviceRow & { product_handle: string; product_title: string | null })[] {
  if (!variantIds.length) return [];
  const marks = variantIds.map(() => '?').join(',');
  const rows = getDb()
    .prepare(
      `SELECT d.id, d.push_token, s.product_handle, s.product_title, s.id AS alert_id FROM mobile_app_stock_alerts s
       JOIN mobile_app_devices d ON d.id = s.device_id
       WHERE s.app_id = ? AND s.notified_at IS NULL AND s.variant_id IN (${marks})`,
    )
    .all(appId, ...variantIds) as (DeviceRow & { product_handle: string; product_title: string | null; alert_id: number })[];
  const mark = getDb().prepare('UPDATE mobile_app_stock_alerts SET notified_at = ? WHERE id = ?');
  getDb().transaction(() => rows.forEach((r) => mark.run(now(), r.alert_id)))();
  return rows;
}
