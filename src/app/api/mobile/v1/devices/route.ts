import { type NextRequest } from 'next/server';
import { AppError } from '@/lib/apps/apps';
import { appFromKey, fail, ipOf, json, preflight, writeAllowed } from '@/lib/apps/http';
import { registerDevice, type Topic } from '@/lib/apps/push';

/** POST /api/mobile/v1/devices — registers or refreshes a device for push notifications. */
export async function POST(request: NextRequest) {
  if (!writeAllowed(ipOf(request.headers))) return fail(429, 'rate_limited', 'Too many requests.');
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, 'invalid_request', 'Body must be JSON.');
  }
  const app = appFromKey(typeof body.key === 'string' ? body.key : request.headers.get('x-app-key'));
  if (!app) return fail(404, 'unknown_app', 'No app with that key.');
  try {
    const id = registerDevice({
      appId: app.id,
      pushToken: String(body.pushToken ?? ''),
      platform: body.platform as 'android' | 'ios' | 'web',
      language: typeof body.language === 'string' ? body.language : null,
      customerId: typeof body.customerId === 'string' ? body.customerId : null,
      topics: Array.isArray(body.topics) ? (body.topics as Topic[]) : undefined,
    });
    return json(200, { ok: true, deviceId: id });
  } catch (err) {
    if (err instanceof AppError) return fail(400, 'invalid_request', err.message);
    throw err;
  }
}

export const OPTIONS = preflight;
