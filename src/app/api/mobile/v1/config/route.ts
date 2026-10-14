import { NextResponse, type NextRequest } from 'next/server';
import { buildPublicConfig } from '@/lib/apps/apps';
import { appFromKey, CORS, fail, json, preflight } from '@/lib/apps/http';
import { env } from '@/lib/messaging/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mobile/v1/config?key=oyapp_… — the app's live settings, store link and home
 * sections. Apps cache it and send If-None-Match; an unchanged config costs a 304.
 */
export async function GET(request: NextRequest) {
  const app = appFromKey(request.nextUrl.searchParams.get('key') ?? request.headers.get('x-app-key'));
  if (!app) return fail(404, 'unknown_app', 'No app with that key.');
  const etag = `"${app.id}-${app.config_version}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers: { ...CORS, etag } });
  }
  return json(200, buildPublicConfig(app, env.appBaseUrl()), {
    etag,
    'cache-control': 'public, max-age=60, stale-while-revalidate=600',
  });
}

export const OPTIONS = preflight;
