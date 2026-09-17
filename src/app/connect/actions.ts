'use server';

import { getDb, now } from '@/lib/messaging/db';
import { ConnectError, resolveConnectLink } from '@/lib/messaging/connections';
import { completeEmbeddedSignup } from '@/lib/whatsapp/numbers';
import { syncTemplates } from '@/lib/whatsapp/templates';
import { errorSummary, log } from '@/lib/log';

/**
 * WhatsApp Embedded Signup from a single-use connect link, for when the
 * person who administers the WhatsApp account isn't an OY Labs user.
 */

const ERRORS: Record<string, string> = {
  limit: 'This account has reached the number of channels its plan includes.',
  billing: 'This account needs an active subscription before a WhatsApp number can be connected.',
  taken: 'That WhatsApp number is already connected to another OY Labs account.',
  expired_code: 'The WhatsApp window timed out. Please try again.',
  invalid: 'This link is not valid, or WhatsApp did not return the expected details.',
  expired: 'This link has expired. Ask your OY Labs contact for a new one.',
  used: 'This link has already been used. Ask your OY Labs contact for a new one.',
  meta: 'WhatsApp could not complete the connection. Please try again.',
};

export async function connectWhatsAppViaLinkAction(payload: { code: string; wabaId: string; phoneNumberId: string; coexistence: boolean; linkToken?: string }): Promise<{ error?: string }> {
  const link = resolveConnectLink(String(payload.linkToken ?? ''));
  if (!link.ok) return { error: ERRORS[link.reason] ?? ERRORS.invalid };
  try {
    await completeEmbeddedSignup({
      workspaceId: link.workspaceId,
      code: String(payload.code),
      wabaId: String(payload.wabaId),
      phoneNumberId: String(payload.phoneNumberId),
      coexistence: Boolean(payload.coexistence),
    });
  } catch (err) {
    if (err instanceof ConnectError) return { error: ERRORS[err.reason] ?? ERRORS.meta };
    log.error('whatsapp.connect_link.failed', { workspaceId: link.workspaceId, error: errorSummary(err) });
    return { error: ERRORS.meta };
  }
  // The link is single-use, like the Facebook flow.
  getDb().prepare('UPDATE connect_links SET used_at = ? WHERE id = ? AND used_at IS NULL').run(now(), link.linkId);
  void syncTemplates(link.workspaceId).catch(() => {});
  return {};
}
