import { NextResponse, type NextRequest } from 'next/server';
import { metaConfigured } from '@/lib/messaging/env';
import { beginOAuth, ConnectError, STATE_COOKIE } from '@/lib/messaging/connections';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('link') ?? '';
  const back = new URL(`/connect/${encodeURIComponent(token)}`, request.nextUrl.origin);
  if (!metaConfigured()) {
    back.searchParams.set('error', 'not_configured');
    return NextResponse.redirect(back, 303);
  }
  try {
    const { dialogUrl, state } = beginOAuth(token);
    const response = NextResponse.redirect(dialogUrl, 303);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // sent on Facebook's top-level redirect back to us
      path: '/',
      maxAge: 30 * 60,
    });
    return response;
  } catch (err) {
    back.searchParams.set('error', err instanceof ConnectError ? err.reason : 'meta');
    return NextResponse.redirect(back, 303);
  }
}
