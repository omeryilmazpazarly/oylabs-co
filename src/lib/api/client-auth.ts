import 'server-only';
import { getWorkspaceByApiKey } from '@/lib/messaging/workspaces';
import { decryptSecret } from '@/lib/messaging/crypto';
import { verifyClientSignature } from '@/lib/messaging/signatures';

/**
 * Authenticates a client system calling the OY Labs API:
 *   X-OYLABS-Key: oyk_...        (identifies the workspace)
 *   X-OYLABS-Timestamp: <unix s> (must be within 5 minutes)
 *   X-OYLABS-Signature: sha256=HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
 */
export type ClientAuth = { ok: true; workspaceId: number } | { ok: false; status: number; error: string };

export function authenticateClient(headers: Headers, rawBody: string): ClientAuth {
  const key = headers.get('x-oylabs-key');
  if (!key) return { ok: false, status: 401, error: 'missing_api_key' };
  const workspace = getWorkspaceByApiKey(key);
  if (!workspace) return { ok: false, status: 401, error: 'invalid_api_key' };
  const verdict = verifyClientSignature(decryptSecret(workspace.api_secret_enc), headers.get('x-oylabs-timestamp'), headers.get('x-oylabs-signature'), rawBody);
  if (!verdict.ok) return { ok: false, status: 401, error: `signature_${verdict.reason}` };
  return { ok: true, workspaceId: workspace.id };
}

/* Fixed-window limiter per workspace, in memory (single process). */
const windows = new Map<number, { start: number; count: number }>();

export function rateLimit(workspaceId: number, limit = 60, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const t = Date.now();
  const current = windows.get(workspaceId);
  if (!current || t - current.start >= windowMs) {
    windows.set(workspaceId, { start: t, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= limit, retryAfterSeconds: Math.ceil((current.start + windowMs - t) / 1000) };
}
