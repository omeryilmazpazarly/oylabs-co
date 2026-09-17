import { vi } from 'vitest';
import { resetDbForTests, type Db } from '@/lib/messaging/db';
import { encryptSecret } from '@/lib/messaging/crypto';

export function freshDb(): Db {
  return resetDbForTests();
}

export function seedWorkspace(db: Db, opts: { name?: string; forwardUrl?: string | null; secret?: string; complimentary?: boolean; status?: string | null; plan?: string | null; pastDueSince?: number | null } = {}) {
  const t = Date.now();
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO workspaces (name, api_key, api_secret_enc, forward_url, complimentary, subscription_status, plan, past_due_since, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(opts.name ?? 'Minhaj Kids', `oyk_${Math.random().toString(36).slice(2)}`, encryptSecret(opts.secret ?? 'oys_client_secret'),
    opts.forwardUrl === undefined ? 'https://client.example/hooks/oylabs' : opts.forwardUrl,
    // Default to an in-service account so non-billing tests aren't affected by subscriptions.
    opts.complimentary ?? (opts.status === undefined) ? 1 : 0, opts.status ?? null, opts.plan ?? null, opts.pastDueSince ?? null, t, t);
  return Number(lastInsertRowid);
}

export function seedConnection(db: Db, workspaceId: number, opts: { pageId?: string; igId?: string | null; status?: string; metaUserId?: string } = {}) {
  const t = Date.now();
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO connections (workspace_id, page_id, page_name, ig_account_id, ig_username, meta_user_id, page_token_enc, status, created_at, updated_at)
    VALUES (?, ?, 'Minhaj Kids', ?, 'minhaj.kids', ?, ?, ?, ?, ?)
  `).run(workspaceId, opts.pageId ?? 'PAGE1', opts.igId === undefined ? 'IG1' : opts.igId, opts.metaUserId ?? 'ASID1',
    encryptSecret('page-token'), opts.status ?? 'active', t, t);
  return Number(lastInsertRowid);
}

/** Routes Graph API calls to handlers keyed by "METHOD path-substring"; anything else fails the test loudly. */
export function mockFetch(handlers: Record<string, (url: URL, init?: RequestInit) => { status?: number; body: unknown }>) {
  const calls: { method: string; url: URL; body?: unknown }[] = [];
  const fn = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const key = Object.keys(handlers).find((k) => {
      const [m, fragment] = k.split(' ');
      return m === method && `${url.host}${url.pathname}`.includes(fragment);
    });
    if (!key) throw new Error(`Unexpected fetch ${method} ${url.host}${url.pathname}`);
    const { status = 200, body } = handlers[key](url, init);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return calls;
}

export function seedWaNumber(db: Db, workspaceId: number, opts: { phoneNumberId?: string; wabaId?: string; display?: string; coexistence?: boolean; status?: string } = {}) {
  const t = Date.now();
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO wa_numbers (workspace_id, waba_id, phone_number_id, display_phone_number, verified_name, meta_user_id, token_enc, coexistence, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Minhaj Kids', 'ASID1', ?, ?, ?, ?, ?)
  `).run(workspaceId, opts.wabaId ?? 'WABA1', opts.phoneNumberId ?? 'PN1', opts.display ?? '447700900000',
    encryptSecret('wa-token'), opts.coexistence ? 1 : 0, opts.status ?? 'active', t, t);
  return Number(lastInsertRowid);
}

export function seedTemplate(db: Db, workspaceId: number, opts: { name?: string; status?: string; components?: unknown[]; parameterFormat?: string } = {}) {
  const components = opts.components ?? [{ type: 'BODY', text: 'Hello {{1}}, your order {{2}} is ready.' }];
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO wa_templates (workspace_id, waba_id, template_id, name, language, category, status, parameter_format, components, updated_at)
    VALUES (?, 'WABA1', ?, ?, 'en_US', 'UTILITY', ?, ?, ?, ?)
  `).run(workspaceId, `TPL${Math.random().toString(36).slice(2, 8)}`, opts.name ?? 'order_ready', opts.status ?? 'APPROVED',
    opts.parameterFormat ?? 'positional', JSON.stringify(components), Date.now());
  return Number(lastInsertRowid);
}
