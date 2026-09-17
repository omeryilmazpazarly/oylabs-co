import 'server-only';
import { getDb, now } from './db';
import { decryptSecret, encryptSecret, randomToken } from './crypto';
import type { BillingFields } from '@/lib/billing/entitlements';

export interface Workspace extends BillingFields {
  id: number;
  name: string;
  api_key: string;
  forward_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_interval: string | null;
  trial_used: number;
  created_at: number;
  updated_at: number;
}

export interface WorkspaceSummary extends Workspace {
  members: number;
  active_connections: number;
  attention_connections: number;
  conversations: number;
  dead_deliveries: number;
}

const COLUMNS = 'id, name, api_key, forward_url, created_at, updated_at, stripe_customer_id, stripe_subscription_id, plan, billing_interval, subscription_status, trial_ends_at, current_period_end, cancel_at_period_end, past_due_since, trial_used, complimentary, page_limit_override';

export function validateForwardUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Forwarding URL is not a valid URL.');
  }
  const localDev = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localDev) throw new Error('Forwarding URL must use https.');
  return url.toString();
}

export function createWorkspace(name: string, forwardUrl: string, opts: { complimentary?: boolean; pageLimit?: number | null } = {}): { workspace: Workspace; apiSecret: string } {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Workspace name is required.');
  const apiKey = `oyk_${randomToken(12)}`;
  const apiSecret = `oys_${randomToken(32)}`;
  const t = now();
  const { lastInsertRowid } = getDb().prepare(`
    INSERT INTO workspaces (name, api_key, api_secret_enc, forward_url, complimentary, page_limit_override, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(trimmed, apiKey, encryptSecret(apiSecret), validateForwardUrl(forwardUrl), opts.complimentary ? 1 : 0, opts.pageLimit ?? null, t, t);
  return { workspace: getWorkspace(Number(lastInsertRowid))!, apiSecret };
}

export function getWorkspace(id: number): Workspace | null {
  return (getDb().prepare(`SELECT ${COLUMNS} FROM workspaces WHERE id = ?`).get(id) as Workspace | undefined) ?? null;
}

export function getWorkspaceByApiKey(apiKey: string): (Workspace & { api_secret_enc: string }) | null {
  return (getDb().prepare(`SELECT ${COLUMNS}, api_secret_enc FROM workspaces WHERE api_key = ?`).get(apiKey) as
    (Workspace & { api_secret_enc: string }) | undefined) ?? null;
}

export function workspaceSecret(workspaceId: number): string {
  const row = getDb().prepare('SELECT api_secret_enc FROM workspaces WHERE id = ?').get(workspaceId) as { api_secret_enc: string } | undefined;
  if (!row) throw new Error('Workspace not found');
  return decryptSecret(row.api_secret_enc);
}

export function listWorkspaces(): WorkspaceSummary[] {
  return getDb().prepare(`
    SELECT ${COLUMNS.split(', ').map((c) => `w.${c}`).join(', ')},
      (SELECT COUNT(*) FROM workspace_members m WHERE m.workspace_id = w.id) AS members,
      (SELECT COUNT(*) FROM connections c WHERE c.workspace_id = w.id AND c.status = 'active')
        + (SELECT COUNT(*) FROM wa_numbers n WHERE n.workspace_id = w.id AND n.status = 'active') AS active_connections,
      (SELECT COUNT(*) FROM connections c WHERE c.workspace_id = w.id AND c.status = 'reconnect_needed')
        + (SELECT COUNT(*) FROM wa_numbers n WHERE n.workspace_id = w.id AND n.status = 'reconnect_needed') AS attention_connections,
      (SELECT COUNT(*) FROM conversations v WHERE v.workspace_id = w.id) AS conversations,
      (SELECT COUNT(*) FROM deliveries d WHERE d.workspace_id = w.id AND d.status = 'dead') AS dead_deliveries
    FROM workspaces w
    ORDER BY w.name COLLATE NOCASE
  `).all() as WorkspaceSummary[];
}

export function updateWorkspace(id: number, name: string, forwardUrl: string): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Workspace name is required.');
  getDb().prepare('UPDATE workspaces SET name = ?, forward_url = ?, updated_at = ? WHERE id = ?')
    .run(trimmed, validateForwardUrl(forwardUrl), now(), id);
}

/** Staff override: complimentary accounts never need a subscription. */
export function setComplimentary(id: number, complimentary: boolean, pageLimit: number | null): void {
  if (pageLimit !== null && (!Number.isInteger(pageLimit) || pageLimit < 0 || pageLimit > 500)) throw new Error('Page limit must be a whole number between 0 and 500.');
  getDb().prepare('UPDATE workspaces SET complimentary = ?, page_limit_override = ?, updated_at = ? WHERE id = ?')
    .run(complimentary ? 1 : 0, pageLimit, now(), id);
}

/** Channels counted against the plan: connected Facebook Pages (with their Instagram) plus WhatsApp numbers. */
export function activeChannelCount(workspaceId: number): number {
  return (getDb().prepare(`
    SELECT (SELECT COUNT(*) FROM connections WHERE workspace_id = @id AND status != 'disconnected')
         + (SELECT COUNT(*) FROM wa_numbers WHERE workspace_id = @id AND status != 'disconnected') AS n
  `).get({ id: workspaceId }) as { n: number }).n;
}

export function rotateWorkspaceSecret(id: number): string {
  const apiSecret = `oys_${randomToken(32)}`;
  getDb().prepare('UPDATE workspaces SET api_secret_enc = ?, updated_at = ? WHERE id = ?').run(encryptSecret(apiSecret), now(), id);
  return apiSecret;
}
