import 'server-only';
import { call, graphUrl, proof, GraphError } from '@/lib/messaging/graph';
import { env } from '@/lib/messaging/env';

/**
 * WhatsApp Cloud API and Business Management API calls. All use the
 * business integration system-user token issued by Embedded Signup.
 */

/** Embedded Signup (JS SDK pop-up) codes are exchanged without a redirect_uri and expire in ~30 seconds. */
export function exchangeSignupCode(code: string) {
  return call<{ access_token: string }>('GET', 'oauth/access_token', null, {
    client_id: env.metaAppId(),
    client_secret: env.metaAppSecret(),
    code,
  });
}

export interface PhoneNumberInfo {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
  platform_type?: string;
  code_verification_status?: string;
}

export function getPhoneNumber(phoneNumberId: string, token: string) {
  return call<PhoneNumberInfo>('GET', phoneNumberId, token, {
    fields: 'id,display_phone_number,verified_name,quality_rating,platform_type,code_verification_status',
  });
}

export function subscribeWaba(wabaId: string, token: string) {
  return call<{ success: boolean }>('POST', `${wabaId}/subscribed_apps`, token);
}

export function unsubscribeWaba(wabaId: string, token: string) {
  return call<{ success: boolean }>('DELETE', `${wabaId}/subscribed_apps`, token);
}

/** Only for numbers that are not in coexistence (those are already registered by the Business app). */
export function registerNumber(phoneNumberId: string, token: string, pin: string) {
  return call<{ success: boolean }>('POST', `${phoneNumberId}/register`, token, {}, { messaging_product: 'whatsapp', pin });
}

/** Coexistence: must be called once each, within 24 hours of onboarding. */
export function requestSmbSync(phoneNumberId: string, token: string, syncType: 'smb_app_state_sync' | 'history') {
  return call<{ request_id: string }>('POST', `${phoneNumberId}/smb_app_data`, token, {}, { messaging_product: 'whatsapp', sync_type: syncType });
}

export type WaSendBody = Record<string, unknown> & { messaging_product: 'whatsapp' };

export function sendWhatsApp(phoneNumberId: string, token: string, body: WaSendBody) {
  return call<{ messages: { id: string }[]; contacts?: { input: string; wa_id?: string; user_id?: string }[] }>('POST', `${phoneNumberId}/messages`, token, {}, body);
}

export function getMedia(mediaId: string, token: string, phoneNumberId?: string) {
  return call<{ url: string; mime_type: string; file_size?: string | number; id: string }>('GET', mediaId, token, phoneNumberId ? { phone_number_id: phoneNumberId } : {});
}

/** Streams a media file. Meta's media URLs need the token and expire after 5 minutes. */
export async function downloadMedia(url: string, token: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30_000), cache: 'no-store' });
  if (!res.ok) throw new GraphError(`Media download failed with HTTP ${res.status}`, res.status);
  return res;
}

/* ── Templates ───────────────────────────────────────────────────────── */

export interface MetaTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  parameter_format?: string;
  components?: unknown[];
  rejected_reason?: string;
}

export async function listTemplates(wabaId: string, token: string): Promise<MetaTemplate[]> {
  const out: MetaTemplate[] = [];
  let after: string | undefined;
  do {
    const res = await call<{ data: MetaTemplate[]; paging?: { cursors?: { after?: string }; next?: string } }>('GET', `${wabaId}/message_templates`, token, {
      fields: 'id,name,language,category,status,parameter_format,components,rejected_reason',
      limit: 100,
      after,
    });
    out.push(...res.data);
    after = res.paging?.next ? res.paging.cursors?.after : undefined;
  } while (after && out.length < 2000);
  return out;
}

export function createTemplate(wabaId: string, token: string, body: Record<string, unknown>) {
  return call<{ id: string; status: string; category: string }>('POST', `${wabaId}/message_templates`, token, {}, body);
}

export function editTemplate(templateId: string, token: string, body: Record<string, unknown>) {
  return call<{ success: boolean }>('POST', templateId, token, {}, body);
}

export function deleteTemplate(wabaId: string, token: string, name: string, templateId: string) {
  return call<{ success: boolean }>('DELETE', `${wabaId}/message_templates`, token, { name, hsm_id: templateId });
}

/**
 * Resumable Upload API: turns a sample file into the header_handle Meta needs
 * when a template has an image, video or document header.
 */
export async function uploadTemplateSample(token: string, file: { name: string; type: string; bytes: Buffer }): Promise<string> {
  const session = await call<{ id: string }>('POST', `${env.metaAppId()}/uploads`, token, {
    file_name: file.name,
    file_length: file.bytes.length,
    file_type: file.type,
  });
  const res = await fetch(graphUrl(session.id, { appsecret_proof: proof(token) }), {
    method: 'POST',
    headers: { Authorization: `OAuth ${token}`, file_offset: '0' },
    body: new Uint8Array(file.bytes),
    signal: AbortSignal.timeout(60_000),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { h?: string; error?: { message?: string; code?: number } };
  if (!res.ok || !json.h) throw new GraphError(json.error?.message || `Upload failed with HTTP ${res.status}`, res.status, json.error?.code);
  return json.h;
}
