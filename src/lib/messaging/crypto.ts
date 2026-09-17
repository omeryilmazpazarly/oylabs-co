import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from './env';

/**
 * AES-256-GCM encryption for secrets at rest (Meta access tokens, client API
 * secrets). Output format: `v1.<iv>.<tag>.<ciphertext>`, each part base64url.
 * The version prefix leaves room for key rotation later.
 */

function loadKey(): Buffer {
  const key = Buffer.from(env.tokenEncryptionKey(), 'base64');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)');
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', loadKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptSecret(sealed: string): string {
  const [version, iv, tag, ciphertext] = sealed.split('.');
  if (version !== 'v1' || !iv || !tag || ciphertext === undefined) {
    throw new Error('Unrecognised encrypted secret format');
  }
  const decipher = createDecipheriv('aes-256-gcm', loadKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

/** Random URL-safe token, e.g. for connect links, sessions and API secrets. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex digest — used to store lookup tokens without storing the token. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
