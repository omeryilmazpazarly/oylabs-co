import { NextResponse, type NextRequest } from 'next/server';
import { stripeConfigured } from '@/lib/billing/stripe';
import { constructStripeEvent, handleStripeEvent } from '@/lib/billing/subscriptions';
import { errorSummary, log } from '@/lib/log';

/** Stripe webhook endpoint: https://oylabs.co/api/stripe/webhook */
export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return new NextResponse('Not configured', { status: 503 });
  const raw = await request.text();

  let event;
  try {
    event = constructStripeEvent(raw, request.headers.get('stripe-signature'));
  } catch {
    log.warn('stripe.webhook.signature_invalid');
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    log.info('stripe.webhook.handled', { type: event.type, outcome });
    return NextResponse.json({ received: true });
  } catch (err) {
    // Non-2xx makes Stripe retry with backoff.
    log.error('stripe.webhook.failed', { type: event.type, error: errorSummary(err) });
    return new NextResponse('Processing failed', { status: 500 });
  }
}
