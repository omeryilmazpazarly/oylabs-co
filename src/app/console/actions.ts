'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertStaff, destroySession } from '@/lib/auth/session';
import {
  createWorkspace, getWorkspace, rotateWorkspaceSecret, setComplimentary, updateWorkspace,
} from '@/lib/messaging/workspaces';
import { AccountError, inviteMember, removeMember, revokeInvite } from '@/lib/accounts/accounts';
import { ConnectError, createConnectLink, disconnectConnection, getConnection, revokeConnectLink } from '@/lib/messaging/connections';
import { retryDelivery, sendTestDelivery } from '@/lib/messaging/deliveries';
import { sendMessage, SendError } from '@/lib/messaging/send';
import { getConversation } from '@/lib/messaging/conversations';
import { deleteConversationData } from '@/lib/messaging/deletion';
import { completeEmbeddedSignup, disconnectWaNumber, getWaNumber, startCoexistenceSync } from '@/lib/whatsapp/numbers';
import { syncTemplates } from '@/lib/whatsapp/templates';
import { errorSummary, log } from '@/lib/log';
import type { ReplyState } from '@/components/messaging/ReplyBox';
import type { FormResult, LinkState, SecretState } from '@/components/messaging/types';

const id = (fd: FormData, key: string) => {
  const value = Number(fd.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Invalid ${key}`);
  return value;
};

export async function logoutAction() {
  await destroySession();
  redirect('/console/login');
}

/* ── Workspaces ──────────────────────────────────────────────────────── */

export type CreateWorkspaceState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'created'; workspaceId: number; apiKey: string; apiSecret: string };

export async function createWorkspaceAction(_prev: CreateWorkspaceState, fd: FormData): Promise<CreateWorkspaceState> {
  await assertStaff();
  try {
    const complimentary = fd.get('complimentary') === 'on';
    const limitRaw = String(fd.get('pageLimit') ?? '').trim();
    const { workspace, apiSecret } = createWorkspace(String(fd.get('name') ?? ''), String(fd.get('forwardUrl') ?? ''), {
      complimentary,
      pageLimit: complimentary && limitRaw ? Number(limitRaw) : null,
    });
    revalidatePath('/console');
    return { status: 'created', workspaceId: workspace.id, apiKey: workspace.api_key, apiSecret };
  } catch (err) {
    return { status: 'error', message: errorSummary(err) };
  }
}


export async function updateWorkspaceAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await assertStaff();
  try {
    const workspaceId = id(fd, 'workspaceId');
    updateWorkspace(workspaceId, String(fd.get('name') ?? ''), String(fd.get('forwardUrl') ?? ''));
    revalidatePath(`/console/workspaces/${workspaceId}`);
    return { status: 'ok', message: 'Saved.' };
  } catch (err) {
    return { status: 'error', message: errorSummary(err) };
  }
}

export async function testDeliveryAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await assertStaff();
  const workspace = getWorkspace(id(fd, 'workspaceId'));
  if (!workspace?.forward_url) return { status: 'error', message: 'Save a forwarding URL first.' };
  const result = await sendTestDelivery(workspace.id, workspace.forward_url);
  return result.ok
    ? { status: 'ok', message: `Delivered — endpoint answered HTTP ${result.status}.` }
    : { status: 'error', message: `Failed — ${result.error ?? 'no response'}.` };
}


export async function rotateSecretAction(_prev: SecretState, fd: FormData): Promise<SecretState> {
  const staff = await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  const secret = rotateWorkspaceSecret(workspaceId);
  log.info('workspace.secret.rotated', { workspaceId, staffId: staff.id });
  return { status: 'rotated', secret };
}

/* ── Connections ─────────────────────────────────────────────────────── */


export async function createConnectLinkAction(_prev: LinkState, fd: FormData): Promise<LinkState> {
  const staff = await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  const link = createConnectLink(workspaceId, staff.id);
  revalidatePath(`/console/workspaces/${workspaceId}`);
  return { status: 'created', ...link };
}

/** Staff member is the Page admin: generate a link and go straight into the flow. */
export async function connectNowAction(fd: FormData) {
  const staff = await assertStaff();
  const { url } = createConnectLink(id(fd, 'workspaceId'), staff.id);
  redirect(new URL(url).pathname);
}

export async function revokeLinkAction(fd: FormData) {
  await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  revokeConnectLink(workspaceId, id(fd, 'linkId'));
  revalidatePath(`/console/workspaces/${workspaceId}`);
}

export async function disconnectAction(fd: FormData) {
  const staff = await assertStaff();
  const connection = getConnection(id(fd, 'connectionId'));
  if (!connection) return;
  await disconnectConnection(connection.id);
  log.info('connection.disconnect.requested', { connectionId: connection.id, staffId: staff.id });
  revalidatePath(`/console/workspaces/${connection.workspace_id}`);
}

export async function retryDeliveryAction(fd: FormData) {
  await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  retryDelivery(workspaceId, id(fd, 'deliveryId'));
  revalidatePath(`/console/workspaces/${workspaceId}`);
}

/* ── Inbox ───────────────────────────────────────────────────────────── */


export async function sendReplyAction(_prev: ReplyState, fd: FormData): Promise<ReplyState> {
  const staff = await assertStaff();
  const conversation = getConversation(id(fd, 'conversationId'));
  if (!conversation) return { status: 'error', message: 'Conversation not found.' };
  const text = String(fd.get('text') ?? '');
  const useHumanAgent = fd.get('humanAgent') === 'on';
  try {
    await sendMessage({
      workspaceId: conversation.workspace_id,
      channel: conversation.channel,
      recipientId: conversation.participant_id,
      text,
      tag: useHumanAgent ? 'HUMAN_AGENT' : undefined,
      source: 'console',
      staffId: staff.id,
    });
    revalidatePath('/console/inbox');
    return { status: 'sent', at: Date.now() };
  } catch (err) {
    return { status: 'error', message: err instanceof SendError ? err.message : 'Could not send the message.' };
  }
}

export async function deleteConversationAction(fd: FormData) {
  const staff = await assertStaff();
  const conversation = getConversation(id(fd, 'conversationId'));
  if (!conversation) redirect('/console/inbox');
  const code = deleteConversationData(conversation.id);
  log.info('conversation.deleted', { conversationId: conversation.id, staffId: staff.id });
  redirect(`/console/inbox?w=${conversation.workspace_id}&deleted=${code ?? ''}`);
}

/* ── Billing overrides & client team (staff) ─────────────────────────── */

export async function setComplimentaryAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const staff = await assertStaff();
  try {
    const workspaceId = id(fd, 'workspaceId');
    const complimentary = fd.get('complimentary') === 'on';
    const limitRaw = String(fd.get('pageLimit') ?? '').trim();
    setComplimentary(workspaceId, complimentary, limitRaw === '' ? null : Number(limitRaw));
    log.info('billing.override.updated', { workspaceId, complimentary, staffId: staff.id });
    revalidatePath(`/console/workspaces/${workspaceId}`);
    return { status: 'ok', message: 'Saved.' };
  } catch (err) {
    return { status: 'error', message: errorSummary(err) };
  }
}

export async function inviteClientAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  await assertStaff();
  try {
    const workspaceId = id(fd, 'workspaceId');
    const role = fd.get('role') === 'member' ? 'member' : 'owner';
    await inviteMember(workspaceId, String(fd.get('email') ?? ''), role, 'OY Labs');
    revalidatePath(`/console/workspaces/${workspaceId}`);
    return { status: 'ok', message: 'Invitation sent.' };
  } catch (err) {
    return { status: 'error', message: err instanceof AccountError ? err.message : 'Could not send the invitation.' };
  }
}

export async function staffRemoveMemberAction(fd: FormData) {
  await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  try {
    removeMember(workspaceId, id(fd, 'userId'));
  } catch (err) {
    if (!(err instanceof AccountError)) throw err;
  }
  revalidatePath(`/console/workspaces/${workspaceId}`);
}

export async function staffRevokeInviteAction(fd: FormData) {
  await assertStaff();
  const workspaceId = id(fd, 'workspaceId');
  revokeInvite(workspaceId, String(fd.get('tokenHash') ?? ''));
  revalidatePath(`/console/workspaces/${workspaceId}`);
}

/* ── WhatsApp (staff acting for a client workspace) ──────────────────── */

const WA_ERRORS: Record<string, string> = {
  limit: 'This workspace has reached its channel limit. Raise the plan or set a Page limit override.',
  billing: 'This workspace has no active subscription. Mark it complimentary or ask the client to choose a plan.',
  taken: 'That WhatsApp number is already connected to another workspace.',
  expired_code: 'The WhatsApp window timed out. Please try again.',
  invalid: 'WhatsApp did not return the expected details. Please try again.',
  meta: 'WhatsApp could not complete the connection. Please try again.',
};

export async function staffConnectWhatsAppAction(payload: { code: string; wabaId: string; phoneNumberId: string; coexistence: boolean; workspaceId?: number }): Promise<{ error?: string }> {
  await assertStaff();
  const workspaceId = Number(payload.workspaceId);
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) return { error: WA_ERRORS.invalid };
  try {
    await completeEmbeddedSignup({
      workspaceId,
      code: String(payload.code),
      wabaId: String(payload.wabaId),
      phoneNumberId: String(payload.phoneNumberId),
      coexistence: Boolean(payload.coexistence),
    });
  } catch (err) {
    if (err instanceof ConnectError) return { error: WA_ERRORS[err.reason] ?? WA_ERRORS.meta };
    log.error('whatsapp.staff_connect.failed', { workspaceId, error: errorSummary(err) });
    return { error: WA_ERRORS.meta };
  }
  void syncTemplates(workspaceId).catch(() => {});
  revalidatePath(`/console/workspaces/${workspaceId}`);
  return {};
}

export async function staffDisconnectWhatsAppAction(fd: FormData) {
  await assertStaff();
  const number = getWaNumber(id(fd, 'numberId'));
  if (number) {
    await disconnectWaNumber(number.id);
    revalidatePath(`/console/workspaces/${number.workspace_id}`);
  }
}

export async function staffRetryWhatsAppSyncAction(fd: FormData) {
  await assertStaff();
  const number = getWaNumber(id(fd, 'numberId'));
  if (number) {
    await startCoexistenceSync(number.id);
    revalidatePath(`/console/workspaces/${number.workspace_id}`);
  }
}
