import { NextResponse, type NextRequest } from 'next/server';
import { metaConfigured } from '@/lib/messaging/env';
import { handleDeauthorize } from '@/lib/messaging/deletion';

/** Meta Deauthorize callback: https://oylabs.co/api/meta/deauthorize */
export async function POST(request: NextRequest) {
  if (!metaConfigured()) return new NextResponse(null, { status: 503 });
  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get('signed_request');
  if (typeof signedRequest !== 'string' || !(await handleDeauthorize(signedRequest))) {
    return new NextResponse(null, { status: 400 });
  }
  return new NextResponse(null, { status: 200 });
}
