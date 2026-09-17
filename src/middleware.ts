import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain routing for product domains.
 *
 * greet.oylabs.co is a Shopify app marketing/legal subdomain. It points at the
 * same Next.js app (via nginx → port 3000), and this middleware rewrites its
 * paths onto the existing /apps/greet routes so that:
 *
 *   greet.oylabs.co/          → /apps/greet
 *   greet.oylabs.co/privacy   → /apps/greet/privacy
 *   greet.oylabs.co/support   → /apps/greet/support
 *   greet.oylabs.co/docs      → /apps/greet/docs
 *
 * The apex (oylabs.co) is unaffected — those routes keep serving normally, and
 * /apps/greet/* remains reachable there too as the canonical location.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];

  if (host === 'greet.oylabs.co') {
    const url = req.nextUrl.clone();
    const p = url.pathname;

    // Already targeting the greet app tree — leave it.
    if (p.startsWith('/apps/greet')) return NextResponse.next();

    if (p === '/' || p === '') {
      url.pathname = '/apps/greet';
    } else {
      url.pathname = `/apps/greet${p}`;
    }
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

/**
 * Run on everything except Next internals and static assets, so the host rewrite
 * applies to real page requests but not to /_next, images, or the favicon.
 */
export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
};
