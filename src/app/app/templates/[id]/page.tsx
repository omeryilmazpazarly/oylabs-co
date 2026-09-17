import { notFound, redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { getTemplate } from '@/lib/whatsapp/templates';
import { Card, Notice, PageHeader } from '@/components/console/ui';
import { TemplateForm } from '@/components/whatsapp/TemplateForm';
import { updateTemplateAction } from '../../actions';

export const metadata = { title: 'Edit template — OY Labs' };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireClient();
  if (ctx.role !== 'owner') redirect('/app/templates');
  const template = getTemplate(ctx.workspace.id, Number(id));
  if (!template) notFound();

  const numbers = listWaNumbers(ctx.workspace.id).filter((n) => n.status !== 'disconnected');
  const wabas = [...new Map(numbers.map((n) => [n.waba_id, { id: n.waba_id, label: n.verified_name || n.display_phone_number }])).values()];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="WhatsApp" title={`Edit ${template.name}`} description="The name and language cannot be changed. Saving sends the template back to WhatsApp for review." />
      {template.status === 'APPROVED' && (
        <div className="mb-6"><Notice tone="amber">An approved template can be edited once a day, and up to 10 times a month.</Notice></div>
      )}
      <Card className="p-5">
        <TemplateForm action={updateTemplateAction} wabas={wabas} template={template} canEditBasics={false} />
      </Card>
    </div>
  );
}
