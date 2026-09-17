import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'crypto';

/**
 * scrypt password hashing (Node built-in, no native dependency).
 * Stored format: `scrypt$N$r$p$<salt b64url>$<hash b64url>`.
 * Kept free of `server-only` so scripts/create-staff-user.mjs can mirror it.
 */

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = await scrypt(password, Buffer.from(salt, 'base64url'), {
    N: Number(n), r: Number(r), p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const MIN_PASSWORD_LENGTH = 12;
