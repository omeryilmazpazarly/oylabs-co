'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertClient, destroyClientSession, switchWorkspace } from '@/lib/auth/client-session';
import {
  AccountError, changePassword, inviteMember, removeMember, revokeInvite, setMemberRole, updateProfile,
} from '@/lib/accounts/accounts';
import { rotateWorkspaceSecret, updateWorkspace } from '@/lib/messaging/workspaces';
import { assertCanConnect, ConnectError, createConnectLink, disconnectConnection, getConnection } from '@/lib/messaging/connections';
import { completeEmbeddedSignup, disconnectWaNumber, getWaNumber, startCoexistenceSync } from '@/lib/whatsapp/numbers';
import {
  buildSendComponents, createTemplate, deleteTemplate, getTemplate, syncTemplates, templateFormFields, updateTemplate, type TemplateDraft,
} from '@/lib/whatsapp/templates';
import { retryDelivery, sendTestDelivery } from '@/lib/messaging/deliveries';
import { sendMessage, SendError } from '@/lib/messaging/send';
import { getConversation } from '@/lib/messaging/conversations';
import { deleteConversationData } from '@/lib/messaging/deletion';
import { createCheckout, createPortalSession } from '@/lib/billing/subscriptions';
import { stripeConfigured } from '@/lib/billing/stripe';
import { isInterval, isPlanId } from '@/lib/billing/plans';
import { errorSummary, log } from '@/lib/log';
import type { ReplyState } from '@/components/messaging/ReplyBox';
import type { FormResult, SecretState } from '@/components/messaging/types';

/**
 * Client portal actions. The workspace always comes from the signed-in
 * session, never from form data, so one client can't act on another's data.
 */

const num = (fd: FormData, key: string) => {
  const value = Number(fd.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Invalid ${key}`);
  return value;
};

const friendly = (err: unknown, fallback: string) => (err instanceof AccountError ? err.message : fallback);

export async function clientLogoutAction() {
  await destroyClientSession();
  redirect('/login');
}

export async function switchWorkspaceAction(fd: FormData) {
  await assertClient({ verified: false });
  await switchWorkspace(num(fd, 'workspaceId'));
  redirect('/app');
}

/* ── Billing ─────────────────────────────────────────────────────────── */

export async function startCheckoutAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const plan = fd.get('plan');
  const interval = fd.get('interval');
  if (!isPlanId(plan) || !isInterval(interval)) redirect('/app/billing?error=plan');
  if (!stripeConfigured()) redirect('/app/billing?error=unavailable');
  let url: string;
  try {
    url = await createCheckout(ctx.workspace, ctx.user.email, plan, interval);
  } catch (err) {
    log.error('billing.checkout.failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    redirect('/app/billing?error=stripe');
  }
  redirect(url);
}

export async function openBillingPortalAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  let url: string;
  try {
    url = await createPortalSession(ctx.workspace, '/app/billing', fd.get('flow') === 'update');
  } catch (err) {
    log.error('billing.portal.failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    redirect('/app/billing?error=stripe');
  }
  redirect(url);
}

/* ── Connections ─────────────────────────────────────────────────────── */

export async function clientConnectAction() {
  const ctx = await assertClient({ owner: true });
  try {
    assertCanConnect(ctx.workspace.id, '__new__');
  } catch (err) {
    redirect(`/app/connections?error=${err instanceof ConnectError ? err.reason : 'meta'}`);
  }
  const { url } = createConnectLink(ctx.workspace.id, null);
  redirect(new URL(url).pathname);
}

export async function clientDisconnectAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const connection = getConnection(num(fd, 'connectionId'));
  if (!connection || connection.workspace_id !== ctx.workspace.id) return;
  await disconnectConnection(connection.id);
  log.info('connection.disconnect.client', { connectionId: connection.id, userId: ctx.user.id });
  revalidatePath('/app/connections');
}

/* ── Developers ──────────────────────────────────────────────────────── */

export async function clientUpdateForwardingAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ owner: true });
  try {
    updateWorkspace(ctx.workspace.id, ctx.workspace.name, String(fd.get('forwardUrl') ?? ''));
    revalidatePath('/app/developers');
    return { status: 'ok', message: 'Saved.' };
  } catch (err) {
    return { status: 'error', message: errorSummary(err) };
  }
}

export async function clientTestDeliveryAction(): Promise<FormResult> {
  const ctx = await assertClient();
  if (!ctx.workspace.forward_url) return { status: 'error', message: 'Save a forwarding URL first.' };
  const result = await sendTestDelivery(ctx.workspace.id, ctx.workspace.forward_url);
  return result.ok
    ? { status: 'ok', message: `Delivered — your endpoint answered HTTP ${result.status}.` }
    : { status: 'error', message: `Failed — ${result.error ?? 'no response'}.` };
}

export async function clientRotateSecretAction(): Promise<SecretState> {
  const ctx = await assertClient({ owner: true });
  const secret = rotateWorkspaceSecret(ctx.workspace.id);
  log.info('workspace.secret.rotated', { workspaceId: ctx.workspace.id, userId: ctx.user.id });
  return { status: 'rotated', secret };
}

export async function clientRetryDeliveryAction(fd: FormData) {
  const ctx = await assertClient();
  retryDelivery(ctx.workspace.id, num(fd, 'deliveryId'));
  revalidatePath('/app/developers');
}

/* ── Inbox ───────────────────────────────────────────────────────────── */

export async function clientReplyAction(_prev: ReplyState, fd: FormData): Promise<ReplyState> {
  const ctx = await assertClient();
  const conversation = getConversation(num(fd, 'conversationId'));
  if (!conversation || conversation.workspace_id !== ctx.workspace.id) return { status: 'error', message: 'Conversation not found.' };
  try {
    await sendMessage({
      workspaceId: ctx.workspace.id,
      channel: conversation.channel,
      recipientId: conversation.participant_id,
      text: String(fd.get('text') ?? ''),
      tag: conversation.channel !== 'whatsapp' && fd.get('humanAgent') === 'on' ? 'HUMAN_AGENT' : undefined,
      source: 'console',
      userId: ctx.user.id,
    });
    revalidatePath('/app/inbox');
    return { status: 'sent', at: Date.now() };
  } catch (err) {
    return { status: 'error', message: err instanceof SendError ? err.message : 'Could not send the message.' };
  }
}

/** Sends an approved WhatsApp template: to an existing conversation, or to a new number. */
export async function sendTemplateAction(_prev: ReplyState, fd: FormData): Promise<ReplyState> {
  const ctx = await assertClient();
  const template = getTemplate(ctx.workspace.id, num(fd, 'templateId'));
  if (!template) return { status: 'error', message: 'Template not found.' };

  let recipientId: string;
  if (fd.get('conversationId')) {
    const conversation = getConversation(num(fd, 'conversationId'));
    if (!conversation || conversation.workspace_id !== ctx.workspace.id) return { status: 'error', message: 'Conversation not found.' };
    recipientId = conversation.participant_id;
  } else {
    recipientId = String(fd.get('phone') ?? '').replace(/[^\d+]/g, '');
    if (!/^\+?\d{7,15}$/.test(recipientId)) return { status: 'error', message: 'Enter the WhatsApp number in international format, for example +44 7700 900123.' };
  }

  const fields = templateFormFields(template);
  const values = {
    header: fields.header === 'none' ? undefined : String(fd.get('header') ?? ''),
    body: fd.getAll('body').map((v) => String(v)),
    url: fields.urlVariable ? String(fd.get('url') ?? '') : undefined,
  };
  try {
    const result = await sendMessage({
      workspaceId: ctx.workspace.id,
      channel: 'whatsapp',
      recipientId,
      template: { name: template.name, language: { code: template.language }, components: buildSendComponents(template, values) },
      source: 'console',
      userId: ctx.user.id,
    });
    revalidatePath('/app/inbox');
    if (!fd.get('conversationId')) redirect(`/app/inbox?c=${result.conversationId}`);
    return { status: 'sent', at: Date.now() };
  } catch (err) {
    if (err instanceof SendError) return { status: 'error', message: err.message };
    throw err;
  }
}

export async function clientDeleteConversationAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const conversation = getConversation(num(fd, 'conversationId'));
  if (!conversation || conversation.workspace_id !== ctx.workspace.id) redirect('/app/inbox');
  const code = deleteConversationData(conversation.id);
  redirect(`/app/inbox?deleted=${code ?? ''}`);
}

/* ── Team ────────────────────────────────────────────────────────────── */

export async function inviteAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ owner: true });
  try {
    await inviteMember(ctx.workspace.id, String(fd.get('email') ?? ''), fd.get('role') === 'owner' ? 'owner' : 'member', ctx.user.name);
    revalidatePath('/app/team');
    return { status: 'ok', message: 'Invitation sent.' };
  } catch (err) {
    return { status: 'error', message: friendly(err, 'Could not send the invitation.') };
  }
}

export async function revokeInviteAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  revokeInvite(ctx.workspace.id, String(fd.get('tokenHash') ?? ''));
  revalidatePath('/app/team');
}

export async function removeMemberAction(fd: FormData) {
  const ctx = await assertClient();
  const userId = num(fd, 'userId');
  const leaving = userId === ctx.user.id;
  if (!leaving && ctx.role !== 'owner') throw new Error('Only workspace owners can remove members');
  try {
    removeMember(ctx.workspace.id, userId);
  } catch (err) {
    redirect(`/app/team?error=${encodeURIComponent(friendly(err, 'Could not remove member.'))}`);
  }
  if (leaving) redirect('/app');
  revalidatePath('/app/team');
}

export async function setRoleAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  try {
    setMemberRole(ctx.workspace.id, num(fd, 'userId'), fd.get('role') === 'owner' ? 'owner' : 'member');
  } catch (err) {
    redirect(`/app/team?error=${encodeURIComponent(friendly(err, 'Could not change role.'))}`);
  }
  revalidatePath('/app/team');
}

/* ── Settings ────────────────────────────────────────────────────────── */

export async function updateProfileAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ verified: false });
  try {
    updateProfile(ctx.user.id, String(fd.get('name') ?? ''));
    if (ctx.role === 'owner' && fd.has('workspaceName')) {
      updateWorkspace(ctx.workspace.id, String(fd.get('workspaceName') ?? ''), ctx.workspace.forward_url ?? '');
    }
    revalidatePath('/app', 'layout');
    return { status: 'ok', message: 'Saved.' };
  } catch (err) {
    return { status: 'error', message: friendly(err, errorSummary(err)) };
  }
}

export async function changePasswordAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ verified: false });
  const { checkClientCredentials } = await import('@/lib/auth/client-session');
  const current = String(fd.get('currentPassword') ?? '');
  const next = String(fd.get('newPassword') ?? '');
  if (!(await checkClientCredentials(ctx.user.email, current, `pw|${ctx.user.id}`))) return { status: 'error', message: 'Your current password is incorrect.' };
  try {
    await changePassword(ctx.user.id, next, ctx.sessionHash);
    return { status: 'ok', message: 'Password changed. Other devices were signed out.' };
  } catch (err) {
    return { status: 'error', message: friendly(err, 'Could not change the password.') };
  }
}

/* ── WhatsApp ────────────────────────────────────────────────────────── */

const WA_CONNECT_ERRORS: Record<string, string> = {
  limit: 'You have reached the number of channels your plan includes. Upgrade to connect another.',
  billing: 'Choose a plan (or update billing) before connecting a WhatsApp number.',
  taken: 'That WhatsApp number is already connected to another OY Labs account.',
  expired_code: 'The WhatsApp window timed out. Please try again.',
  invalid: 'WhatsApp did not return the expected details. Please try again.',
  meta: 'WhatsApp could not complete the connection. Please try again.',
};

export async function connectWhatsAppAction(payload: { code: string; wabaId: string; phoneNumberId: string; coexistence: boolean }): Promise<{ error?: string }> {
  const ctx = await assertClient({ owner: true });
  try {
    await completeEmbeddedSignup({
      workspaceId: ctx.workspace.id,
      code: String(payload.code),
      wabaId: String(payload.wabaId),
      phoneNumberId: String(payload.phoneNumberId),
      coexistence: Boolean(payload.coexistence),
    });
  } catch (err) {
    if (err instanceof ConnectError) return { error: WA_CONNECT_ERRORS[err.reason] ?? WA_CONNECT_ERRORS.meta };
    log.error('whatsapp.connect.failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    return { error: WA_CONNECT_ERRORS.meta };
  }
  void syncTemplates(ctx.workspace.id).catch(() => {});
  revalidatePath('/app/connections');
  return {};
}

export async function disconnectWhatsAppAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const number = getWaNumber(num(fd, 'numberId'));
  if (number && number.workspace_id === ctx.workspace.id) await disconnectWaNumber(number.id);
  revalidatePath('/app/connections');
}

export async function retryWhatsAppSyncAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const number = getWaNumber(num(fd, 'numberId'));
  if (number && number.workspace_id === ctx.workspace.id) await startCoexistenceSync(number.id);
  revalidatePath('/app/connections');
}

export async function syncTemplatesAction() {
  const ctx = await assertClient({ owner: true });
  let count: number;
  try {
    count = await syncTemplates(ctx.workspace.id);
  } catch (err) {
    log.warn('whatsapp.templates.sync_failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    redirect('/app/templates?error=sync');
  }
  revalidatePath('/app/templates');
  redirect(`/app/templates?synced=${count}`);
}

function templateDraftFrom(fd: FormData): TemplateDraft {
  const str = (key: string) => String(fd.get(key) ?? '').trim();
  const buttons: TemplateDraft['buttons'] = [];
  for (let i = 0; i < 10; i++) {
    const type = str(`buttonType${i}`);
    const text = str(`buttonText${i}`);
    if (!type || !text) continue;
    if (type === 'URL') buttons.push({ type: 'URL', text, url: str(`buttonUrl${i}`), example: str(`buttonExample${i}`) ? [str(`buttonExample${i}`)] : undefined });
    else if (type === 'PHONE_NUMBER') buttons.push({ type: 'PHONE_NUMBER', text, phone_number: str(`buttonPhone${i}`) });
    else buttons.push({ type: 'QUICK_REPLY', text });
  }
  return {
    wabaId: str('wabaId'),
    name: str('name').toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
    language: str('language') || 'en_US',
    category: (str('category') || 'UTILITY') as TemplateDraft['category'],
    header: { format: (str('headerFormat') || 'NONE') as TemplateDraft['header']['format'], text: str('headerText'), example: str('headerExample') },
    body: { text: String(fd.get('bodyText') ?? ''), examples: fd.getAll('bodyExample').map((v) => String(v)) },
    footer: str('footer'),
    buttons,
  };
}

async function sampleFrom(fd: FormData): Promise<{ name: string; type: string; bytes: Buffer } | undefined> {
  const file = fd.get('sample');
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > 16 * 1024 * 1024) throw new AccountError('The example file must be 16 MB or smaller.');
  return { name: file.name, type: file.type || 'application/octet-stream', bytes: Buffer.from(await file.arrayBuffer()) };
}

export async function createTemplateAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ owner: true });
  try {
    await createTemplate(ctx.workspace.id, templateDraftFrom(fd), await sampleFrom(fd));
  } catch (err) {
    if (err instanceof SendError || err instanceof AccountError) return { status: 'error', message: err.message };
    log.error('whatsapp.template.create_failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    return { status: 'error', message: 'WhatsApp rejected the template. Check the details and try again.' };
  }
  revalidatePath('/app/templates');
  redirect('/app/templates?created=1');
}

export async function updateTemplateAction(_prev: FormResult, fd: FormData): Promise<FormResult> {
  const ctx = await assertClient({ owner: true });
  const id = num(fd, 'templateId');
  try {
    await updateTemplate(ctx.workspace.id, id, templateDraftFrom(fd), await sampleFrom(fd));
  } catch (err) {
    if (err instanceof SendError || err instanceof AccountError) return { status: 'error', message: err.message };
    log.error('whatsapp.template.update_failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    return { status: 'error', message: 'WhatsApp rejected the change. Check the details and try again.' };
  }
  revalidatePath('/app/templates');
  redirect('/app/templates?updated=1');
}

export async function deleteTemplateAction(fd: FormData) {
  const ctx = await assertClient({ owner: true });
  const id = num(fd, 'templateId');
  if (getTemplate(ctx.workspace.id, id)) {
    try {
      await deleteTemplate(ctx.workspace.id, id);
    } catch (err) {
      log.warn('whatsapp.template.delete_failed', { workspaceId: ctx.workspace.id, error: errorSummary(err) });
    }
  }
  revalidatePath('/app/templates');
}
