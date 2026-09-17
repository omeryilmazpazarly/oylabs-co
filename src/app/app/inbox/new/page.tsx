import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { now } from '@/lib/messaging/db';
import { serviceState } from '@/lib/billing/entitlements';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { sendableTemplates } from '@/lib/whatsapp/templates';
import { Card, Notice, PageHeader } from '@/components/console/ui';
import { TemplateSend } from '@/components/whatsapp/TemplateSend';
import { sendTemplateAction } from '../../actions';

export const metadata = { title: 'New WhatsApp message — OY Labs' };

export default async function NewWhatsAppMessagePage() {
  const ctx = await requireClient();
  if (!serviceState(ctx.workspace, now()).active) redirect('/app/inbox');
  if (!listWaNumbers(ctx.workspace.id).some((n) => n.status === 'active')) redirect('/app/inbox');

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="WhatsApp"
        title="New WhatsApp message"
        description="Starting a conversation always uses an approved template. Only message people who have agreed to hear from your business on WhatsApp."
      />
      <Card className="p-5">
        <TemplateSend action={sendTemplateAction} templates={sendableTemplates(ctx.workspace.id)} recipientField />
      </Card>
      <div className="mt-6">
        <Notice>Meta charges for messages you start, at its own WhatsApp rates.{' '}<Link href="/app/templates" className="underline">Manage templates</Link></Notice>
      </div>
    </div>
  );
}
