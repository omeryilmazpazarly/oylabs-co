import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/lib/messaging/crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('encryptSecret', () => {
  it('round-trips and never stores the plaintext', () => {
    const sealed = encryptSecret('EAAG-page-token');
    expect(sealed).not.toContain('EAAG');
    expect(decryptSecret(sealed)).toBe('EAAG-page-token');
  });

  it('uses a fresh IV each time', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'));
  });

  it('detects tampering', () => {
    const [v, iv, tag, ct] = encryptSecret('secret').split('.');
    const flipped = Buffer.from(ct, 'base64url');
    flipped[0] ^= 1;
    expect(() => decryptSecret([v, iv, tag, flipped.toString('base64url')].join('.'))).toThrow();
  });
});

describe('password hashing', () => {
  it('verifies the right password only', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('wrong password here', stored)).toBe(false);
  });
});
