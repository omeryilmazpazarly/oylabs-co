import 'server-only';
import { createHmac } from 'crypto';
import { env } from './env';

/**
 * Minimal Graph API client. Every call sends `appsecret_proof` so the app can
 * run with "Require App Secret" enabled in the Meta dashboard. URLs and bodies
 * are never logged (they carry tokens and message content).
 */

export class GraphError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly code?: number,
    public readonly subcode?: number,
    public readonly fbtraceId?: string,
  ) {
    super(message);
    this.name = 'GraphError';
  }

  /** The token was revoked, expired, or lost the permissions it needs. */
  get tokenInvalid(): boolean {
    return this.code === 190 || this.code === 102 || this.code === 200 && this.subcode === 2018065;
  }

  /** Meta refused the send because the customer hasn't messaged recently enough. */
  get outsideWindow(): boolean {
    return this.code === 10 && this.subcode === 2018278;
  }

  get rateLimited(): boolean {
    return this.code === 4 || this.code === 17 || this.code === 32 || this.code === 613;
  }
}

export type Params = Record<string, string | number | boolean | undefined>;

export function graphUrl(path: string, params: Params = {}): string {
  const url = new URL(`https://graph.facebook.com/${env.metaGraphVersion()}/${path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export function proof(token: string): string {
  return createHmac('sha256', env.metaAppSecret()).update(token).digest('hex');
}

export async function call<T>(method: 'GET' | 'POST' | 'DELETE', path: string, token: string | null, params: Params = {}, body?: unknown): Promise<T> {
  const query: Params = { ...params };
  if (token) {
    query.access_token = token;
    query.appsecret_proof = proof(token);
  }
  const res = await fetch(graphUrl(path, query), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string } };
  if (!res.ok || json.error) {
    const e = json.error ?? {};
    throw new GraphError(e.message || `Graph API HTTP ${res.status}`, res.status, e.code, e.error_subcode, e.fbtrace_id);
  }
  return json as T;
}

/* ── Login for Business ──────────────────────────────────────────────── */

export function loginDialogUrl(state: string, redirectUri: string): string {
  const url = new URL(`https://www.facebook.com/${env.metaGraphVersion()}/dialog/oauth`);
  url.searchParams.set('client_id', env.metaAppId());
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('config_id', env.metaLoginConfigId());
  // Business integration system-user tokens use the authorization-code grant.
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('override_default_response_type', 'true');
  return url.toString();
}

export function exchangeCode(code: string, redirectUri: string) {
  return call<{ access_token: string; token_type?: string; expires_in?: number }>('GET', 'oauth/access_token', null, {
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    redirect_uri: redirectUri,
    code,
  });
}

export async function debugToken(token: string) {
  const res = await call<{ data: { type?: string; user_id?: string; expires_at?: number; is_valid?: boolean; scopes?: string[] } }>(
    'GET', 'debug_token', null, { input_token: token, access_token: `${env.metaAppId()}|${env.metaAppSecret()}` },
  );
  return res.data;
}

/** Only used if the Login configuration issues a user token instead of a system-user token. */
export function exchangeLongLivedUserToken(token: string) {
  return call<{ access_token: string; expires_in?: number }>('GET', 'oauth/access_token', null, {
    grant_type: 'fb_exchange_token',
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    fb_exchange_token: token,
  });
}

export function getMe(token: string) {
  return call<{ id: string; name?: string }>('GET', 'me', token, { fields: 'id,name' });
}

export async function getClientBusinessId(token: string): Promise<string | null> {
  try {
    const res = await call<{ client_business_id?: string }>('GET', 'me', token, { fields: 'client_business_id' });
    return res.client_business_id ?? null;
  } catch {
    return null; // user tokens don't expose this field
  }
}

export interface GrantedPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
}

export async function listGrantedPages(token: string): Promise<GrantedPage[]> {
  const pages: GrantedPage[] = [];
  let after: string | undefined;
  do {
    const res = await call<{ data: GrantedPage[]; paging?: { cursors?: { after?: string }; next?: string } }>('GET', 'me/accounts', token, {
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      limit: 100,
      after,
    });
    pages.push(...res.data);
    after = res.paging?.next ? res.paging.cursors?.after : undefined;
  } while (after && pages.length < 500);
  return pages;
}

/* ── Webhook subscription ────────────────────────────────────────────── */

export const PAGE_SUBSCRIBED_FIELDS = ['messages', 'messaging_postbacks', 'message_echoes'];

export function subscribePage(pageId: string, pageToken: string) {
  return call<{ success: boolean }>('POST', `${pageId}/subscribed_apps`, pageToken, {
    subscribed_fields: PAGE_SUBSCRIBED_FIELDS.join(','),
  });
}

export function unsubscribePage(pageId: string, pageToken: string) {
  return call<{ success: boolean }>('DELETE', `${pageId}/subscribed_apps`, pageToken);
}

/* ── Messaging ───────────────────────────────────────────────────────── */

export interface SendBody {
  recipient: { id: string };
  messaging_type: 'RESPONSE' | 'MESSAGE_TAG';
  tag?: 'HUMAN_AGENT';
  message: { text: string } | { attachment: { type: string; payload: { url: string; is_reusable?: boolean } } };
}

/** Works for both Messenger and the Page-linked Instagram account. */
export function sendPageMessage(pageId: string, pageToken: string, body: SendBody) {
  return call<{ recipient_id: string; message_id: string }>('POST', `${pageId}/messages`, pageToken, {}, body);
}

export async function fetchProfile(channel: 'messenger' | 'instagram', userId: string, pageToken: string): Promise<{ name: string | null; picture: string | null }> {
  if (channel === 'messenger') {
    const p = await call<{ first_name?: string; last_name?: string; profile_pic?: string }>('GET', userId, pageToken, {
      fields: 'first_name,last_name,profile_pic',
    });
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || null;
    return { name, picture: p.profile_pic ?? null };
  }
  const p = await call<{ name?: string; username?: string; profile_pic?: string }>('GET', userId, pageToken, {
    fields: 'name,username,profile_pic',
  });
  return { name: p.name || (p.username ? `@${p.username}` : null), picture: p.profile_pic ?? null };
}
