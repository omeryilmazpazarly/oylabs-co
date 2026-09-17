import { NextResponse, type NextRequest } from 'next/server';
import { completeOAuth, ConnectError, STATE_COOKIE } from '@/lib/messaging/connections';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/connect/error?reason=${reason}`, request.nextUrl.origin), 303);

  if (params.get('error')) return fail('denied');
  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return fail('state');

  try {
    await completeOAuth(code, state, request.cookies.get(STATE_COOKIE)?.value);
  } catch (err) {
    return fail(err instanceof ConnectError ? err.reason : 'meta');
  }
  return NextResponse.redirect(new URL('/connect/select', request.nextUrl.origin), 303);
}
