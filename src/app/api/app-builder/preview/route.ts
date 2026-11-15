import type { NextRequest } from 'next/server';
import { AppError } from '@/lib/apps/apps';
import { previewConfig, storeSetup } from '@/lib/apps/autofill';
import { fail, ipOf, json, preflight } from '@/lib/apps/http';
import { isLayoutId } from '@/lib/apps/layouts';
import { createThrottle } from '@/lib/auth/throttle';
import { errorSummary, log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/** Previews hit the store and, once per store a day, the AI: 40 per IP per 10 minutes. */
const throttle = createThrottle(40, 10 * 60 * 1000);

/**
 * GET /api/app-builder/preview?store=mystore.com&layout=bold — the app a store would
 * get, in the same format as /api/mobile/v1/config. The landing page's live phone and
 * the sign-up page load it into the web build of the app.
 */
export async function GET(request: NextRequest) {
  const ip = ipOf(request.headers);
  if (throttle.blocked(ip)) return fail(429, 'rate_limited', 'Too many previews. Try again in a few minutes.');
  throttle.fail(ip);
  const store = request.nextUrl.searchParams.get('store') ?? '';
  const layoutParam = request.nextUrl.searchParams.get('layout');
  const layout = isLayoutId(layoutParam) ? layoutParam : 'classic';
  try {
    return json(200, previewConfig(await storeSetup(store), layout), { 'cache-control': 'public, max-age=300' });
  } catch (err) {
    if (err instanceof AppError) return fail(404, 'store_not_found', err.message);
    log.error('app_builder.preview_failed', { error: errorSummary(err) });
    return fail(502, 'preview_failed', 'We could not load that store right now.');
  }
}

export const OPTIONS = preflight;
