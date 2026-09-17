import { describe, expect, it } from 'vitest';
import { createHmac } from 'crypto';
import {
  parseSignedRequest, signClientPayload, verifyClientSignature, verifyMetaSignature,
} from '@/lib/messaging/signatures';

describe('verifyMetaSignature', () => {
  const secret = 'app-secret';
  const body = '{"object":"page","entry":[]}';
  const good = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  it('accepts the signature Meta computes over the raw body', () => {
    expect(verifyMetaSignature(body, good, secret)).toBe(true);
  });

  it('rejects a body that was altered after signing', () => {
    expect(verifyMetaSignature(body.replace('page', 'instagram'), good, secret)).toBe(false);
  });

  it('rejects missing, malformed and wrong-secret signatures', () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, good.replace('sha256=', 'sha1='), secret)).toBe(false);
    expect(verifyMetaSignature(body, 'sha256=zz', secret)).toBe(false);
    expect(verifyMetaSignature(body, good, 'other-secret')).toBe(false);
  });
});

describe('client signatures', () => {
  const secret = 'client-secret';
  const body = '{"channel":"messenger"}';
  const nowMs = 1_800_000_000_000;
  const ts = nowMs / 1000;

  it('round-trips a fresh signature', () => {
    expect(verifyClientSignature(secret, String(ts), signClientPayload(secret, ts, body), body, nowMs)).toEqual({ ok: true });
  });

  it('rejects requests outside the 5-minute replay window', () => {
    const old = ts - 301;
    expect(verifyClientSignature(secret, String(old), signClientPayload(secret, old, body), body, nowMs))
      .toEqual({ ok: false, reason: 'stale' });
  });

  it('rejects a signature made with a different timestamp or body', () => {
    expect(verifyClientSignature(secret, String(ts), signClientPayload(secret, ts - 1, body), body, nowMs))
      .toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyClientSignature(secret, String(ts), signClientPayload(secret, ts, body), body + ' ', nowMs))
      .toEqual({ ok: false, reason: 'mismatch' });
  });

  it('reports missing headers', () => {
    expect(verifyClientSignature(secret, null, null, body, nowMs)).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('parseSignedRequest', () => {
  const secret = 'app-secret';
  function make(payload: object, signWith = secret) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', signWith).update(encoded).digest('base64url');
    return `${sig}.${encoded}`;
  }

  it('decodes a request signed with the app secret', () => {
    const parsed = parseSignedRequest(make({ algorithm: 'HMAC-SHA256', user_id: '42', issued_at: 1 }), secret);
    expect(parsed?.user_id).toBe('42');
  });

  it('rejects forged, malformed or incomplete requests', () => {
    expect(parseSignedRequest(make({ algorithm: 'HMAC-SHA256', user_id: '42' }, 'wrong'), secret)).toBeNull();
    expect(parseSignedRequest('not-a-signed-request', secret)).toBeNull();
    expect(parseSignedRequest(make({ algorithm: 'HMAC-SHA256' }), secret)).toBeNull();
  });
});
