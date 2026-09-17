import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Every signature check in the messaging system lives here so the rules are
 * tested in one place. No `server-only` import: these are pure functions.
 */

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

/* ── Meta → OY Labs webhooks ─────────────────────────────────────────── */

/**
 * Verify Meta's `X-Hub-Signature-256: sha256=<hex>` header against the raw
 * request body. Must be computed over the exact bytes received.
 */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  return safeEqualHex(header.slice('sha256='.length), expected);
}

/* ── OY Labs ⇄ client systems ────────────────────────────────────────── */

export const REPLAY_WINDOW_SECONDS = 5 * 60;

/** HMAC-SHA256 over `${timestamp}.${body}` with the client's secret. */
export function signClientPayload(secret: string, timestamp: number, body: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex');
}

export type ClientSignatureResult = { ok: true } | { ok: false; reason: 'missing' | 'stale' | 'mismatch' };

export function verifyClientSignature(
  secret: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  body: string,
  nowMs: number = Date.now(),
): ClientSignatureResult {
  if (!timestampHeader || !signatureHeader?.startsWith('sha256=')) return { ok: false, reason: 'missing' };
  const timestamp = Number(timestampHeader);
  if (!Number.isInteger(timestamp) || Math.abs(nowMs / 1000 - timestamp) > REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: 'stale' };
  }
  const expected = signClientPayload(secret, timestamp, body).slice('sha256='.length);
  return safeEqualHex(signatureHeader.slice('sha256='.length), expected) ? { ok: true } : { ok: false, reason: 'mismatch' };
}

/* ── Meta signed_request (data deletion / deauthorize callbacks) ─────── */

export interface SignedRequestPayload {
  algorithm: string;
  user_id: string;
  issued_at?: number;
  expires?: number;
}

/** Returns the decoded payload, or null if malformed or the signature is wrong. */
export function parseSignedRequest(signedRequest: string, appSecret: string): SignedRequestPayload | null {
  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) return null;

  const expected = createHmac('sha256', appSecret).update(payload).digest();
  const actual = Buffer.from(encodedSig, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SignedRequestPayload;
    if (data.algorithm?.toUpperCase() !== 'HMAC-SHA256' || !data.user_id) return null;
    return data;
  } catch {
    return null;
  }
}
