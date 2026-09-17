import { NextResponse, type NextRequest } from 'next/server';
import { metaConfigured } from '@/lib/messaging/env';
import { handleDataDeletionRequest } from '@/lib/messaging/deletion';
import { errorSummary, log } from '@/lib/log';

/** Meta Data Deletion Request callback: https://oylabs.co/api/meta/data-deletion */
export async function POST(request: NextRequest) {
  if (!metaConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get('signed_request');
  if (typeof signedRequest !== 'string') return NextResponse.json({ error: 'signed_request is required' }, { status: 400 });

  try {
    const result = await handleDataDeletionRequest(signedRequest);
    if (!result) return NextResponse.json({ error: 'invalid signed_request' }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    log.error('deletion.callback.failed', { error: errorSummary(err) });
    return NextResponse.json({ error: 'deletion_failed' }, { status: 500 });
  }
}
