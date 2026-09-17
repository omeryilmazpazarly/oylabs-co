import 'server-only';
import { randomInt } from 'crypto';
import { getDb, now } from '@/lib/messaging/db';
import { decryptSecret, encryptSecret } from '@/lib/messaging/crypto';
import { assertCanAddChannel, ConnectError } from '@/lib/messaging/connections';
import * as metaGraph from '@/lib/messaging/graph';
import { errorSummary, log } from '@/lib/log';
import * as wa from './graph';

/**
 * WhatsApp numbers connected through Embedded Signup, either as a new
 * API-only number or in coexistence with the WhatsApp Business app.
 */

export type WaNumberStatus = 'active' | 'reconnect_needed' | 'disconnected';

export interface WaNumber {
  id: number;
  workspace_id: number;
  waba_id: string;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string | null;
  coexistence: number;
  quality_rating: string | null;
  status: WaNumberStatus;
  status_detail: string | null;
  history_status: 'requested' | 'in_progress' | 'complete' | 'declined' | 'failed' | null;
  history_progress: number | null;
  created_at: number;
  updated_at: number;
}

const COLUMNS = 'id, workspace_id, waba_id, phone_number_id, display_phone_number, verified_name, coexistence, quality_rating, status, status_detail, history_status, history_progress, created_at, updated_at';

export function listWaNumbers(workspaceId: number): WaNumber[] {
  return getDb().prepare(`SELECT ${COLUMNS} FROM wa_numbers WHERE workspace_id = ? ORDER BY status = 'active' DESC, display_phone_number`).all(workspaceId) as WaNumber[];
}

export function getWaNumber(id: number): WaNumber | null {
  return (getDb().prepare(`SELECT ${COLUMNS} FROM wa_numbers WHERE id = ?`).get(id) as WaNumber | undefined) ?? null;
}

export function waNumberByPhoneId(phoneNumberId: string): WaNumber | null {
  return (getDb().prepare(`SELECT ${COLUMNS} FROM wa_numbers WHERE phone_number_id = ?`).get(phoneNumberId) as WaNumber | undefined) ?? null;
}

export function waTokenFor(numberId: number): string | null {
  const row = getDb().prepare('SELECT token_enc FROM wa_numbers WHERE id = ?').get(numberId) as { token_enc: string | null } | undefined;
  return row?.token_enc ? decryptSecret(row.token_enc) : null;
}

export function markWaReconnectNeeded(numberId: number, detail: string) {
  getDb().prepare(`UPDATE wa_numbers SET status = 'reconnect_needed', status_detail = ?, updated_at = ? WHERE id = ? AND status = 'active'`)
    .run(detail.slice(0, 200), now(), numberId);
  log.warn('whatsapp.number.reconnect_needed', { numberId });
}

export interface SignupInput {
  workspaceId: number;
  code: string;
  wabaId: string;
  phoneNumberId: string;
  coexistence: boolean;
}

const ID_RE = /^\d{5,25}$/;

/**
 * Finishes Embedded Signup: exchanges the code, checks plan limits, subscribes
 * our app to the WhatsApp Business Account, registers new numbers, and for
 * coexistence starts the one-time contact and history sync.
 */
export async function completeEmbeddedSignup(input: SignupInput): Promise<WaNumber> {
  if (!input.code || !ID_RE.test(input.wabaId) || !ID_RE.test(input.phoneNumberId)) throw new ConnectError('invalid');
  const db = getDb();
  const existing = waNumberByPhoneId(input.phoneNumberId);
  if (existing && existing.workspace_id !== input.workspaceId && existing.status !== 'disconnected') throw new ConnectError('taken');
  assertCanAddChannel(input.workspaceId, Boolean(existing && existing.workspace_id === input.workspaceId && existing.status !== 'disconnected'));

  let token: string;
  let info: wa.PhoneNumberInfo;
  let metaUserId: string | null = null;
  try {
    token = (await wa.exchangeSignupCode(input.code)).access_token;
    metaUserId = (await metaGraph.debugToken(token)).user_id ?? null;
    info = await wa.getPhoneNumber(input.phoneNumberId, token);
    await wa.subscribeWaba(input.wabaId, token);
  } catch (err) {
    log.warn('whatsapp.signup.failed', { step: 'exchange_or_subscribe', error: errorSummary(err) });
    throw new ConnectError(err instanceof metaGraph.GraphError && err.httpStatus === 400 && /code/i.test(err.message) ? 'expired_code' : 'meta');
  }

  let pin: string | null = null;
  if (!input.coexistence) {
    pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
    try {
      await wa.registerNumber(input.phoneNumberId, token, pin);
    } catch (err) {
      log.warn('whatsapp.signup.register_failed', { error: errorSummary(err) });
      throw new ConnectError('meta');
    }
  }

  const t = now();
  db.prepare(`
    INSERT INTO wa_numbers (workspace_id, waba_id, phone_number_id, display_phone_number, verified_name, meta_user_id, token_enc, pin_enc,
                            coexistence, quality_rating, status, status_detail, history_status, created_at, updated_at)
    VALUES (@workspaceId, @wabaId, @phoneNumberId, @display, @verifiedName, @metaUserId, @token, @pin, @coexistence, @quality, 'active', NULL, NULL, @t, @t)
    ON CONFLICT(phone_number_id) DO UPDATE SET
      workspace_id = excluded.workspace_id, waba_id = excluded.waba_id, display_phone_number = excluded.display_phone_number,
      verified_name = excluded.verified_name, meta_user_id = excluded.meta_user_id, token_enc = excluded.token_enc,
      pin_enc = COALESCE(excluded.pin_enc, wa_numbers.pin_enc), coexistence = excluded.coexistence, quality_rating = excluded.quality_rating,
      status = 'active', status_detail = NULL, updated_at = excluded.updated_at
  `).run({
    workspaceId: input.workspaceId, wabaId: input.wabaId, phoneNumberId: input.phoneNumberId,
    display: info.display_phone_number, verifiedName: info.verified_name ?? null, metaUserId,
    token: encryptSecret(token), pin: pin ? encryptSecret(pin) : null, coexistence: input.coexistence ? 1 : 0,
    quality: info.quality_rating ?? null, t,
  });
  const number = waNumberByPhoneId(input.phoneNumberId)!;
  log.info('whatsapp.number.connected', { workspaceId: input.workspaceId, numberId: number.id, coexistence: input.coexistence });

  if (input.coexistence) await startCoexistenceSync(number.id);
  return getWaNumber(number.id)!;
}

/** One-time contact + history sync for coexistence numbers (Meta allows it once, within 24 hours of onboarding). */
export async function startCoexistenceSync(numberId: number): Promise<void> {
  const number = getWaNumber(numberId);
  const token = waTokenFor(numberId);
  if (!number || !token || !number.coexistence) return;
  const db = getDb();
  try {
    await wa.requestSmbSync(number.phone_number_id, token, 'smb_app_state_sync');
    await wa.requestSmbSync(number.phone_number_id, token, 'history');
    db.prepare(`UPDATE wa_numbers SET history_status = 'requested', history_progress = 0, updated_at = ? WHERE id = ?`).run(now(), numberId);
  } catch (err) {
    db.prepare(`UPDATE wa_numbers SET history_status = 'failed', updated_at = ? WHERE id = ?`).run(now(), numberId);
    log.warn('whatsapp.coexistence.sync_failed', { numberId, error: errorSummary(err) });
  }
}

/** Stops webhooks (when no other connected number shares the WhatsApp Business Account) and deletes the token. */
export async function disconnectWaNumber(numberId: number): Promise<void> {
  const number = getWaNumber(numberId);
  if (!number) return;
  const token = waTokenFor(numberId);
  const db = getDb();
  const siblings = (db.prepare(`SELECT COUNT(*) AS n FROM wa_numbers WHERE waba_id = ? AND id != ? AND status != 'disconnected'`).get(number.waba_id, numberId) as { n: number }).n;
  if (token && siblings === 0) {
    try {
      await wa.unsubscribeWaba(number.waba_id, token);
    } catch (err) {
      log.warn('whatsapp.unsubscribe.failed', { numberId, error: errorSummary(err) });
    }
  }
  db.prepare(`UPDATE wa_numbers SET status = 'disconnected', status_detail = 'Disconnected', token_enc = NULL, updated_at = ? WHERE id = ?`).run(now(), numberId);
  // Synced address-book contacts go with the number; templates go when no connected number uses the account any more.
  db.prepare('DELETE FROM wa_contacts WHERE wa_number_id = ?').run(numberId);
  if (siblings === 0) db.prepare('DELETE FROM wa_templates WHERE waba_id = ? AND workspace_id = ?').run(number.waba_id, number.workspace_id);
  log.info('whatsapp.number.disconnected', { numberId });
}
