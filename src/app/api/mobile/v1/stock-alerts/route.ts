import { type NextRequest } from 'next/server';
import { AppError } from '@/lib/apps/apps';
import { appFromKey, fail, ipOf, json, preflight, writeAllowed } from '@/lib/apps/http';
import { subscribeStockAlert } from '@/lib/apps/push';

/** POST /api/mobile/v1/stock-alerts — "Notify me when back in stock" for one variant. */
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
    subscribeStockAlert(app.id, String(body.pushToken ?? ''), String(body.variantId ?? ''), String(body.productHandle ?? ''),
      typeof body.productTitle === 'string' ? body.productTitle : null);
    return json(200, { ok: true });
  } catch (err) {
    if (err instanceof AppError) return fail(400, 'invalid_request', err.message);
    throw err;
  }
}

export const OPTIONS = preflight;
