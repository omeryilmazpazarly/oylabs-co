import { redirect } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { Card, PageHeader } from '@/components/console/ui';
import { TemplateForm } from '@/components/whatsapp/TemplateForm';
import { createTemplateAction } from '../../actions';

export const metadata = { title: 'New template — OY Labs' };

export default async function NewTemplatePage() {
  const ctx = await requireClient();
  if (ctx.role !== 'owner') redirect('/app/templates');
  const numbers = listWaNumbers(ctx.workspace.id).filter((n) => n.status !== 'disconnected');
  if (numbers.length === 0) redirect('/app/templates');

  const wabas = [...new Map(numbers.map((n) => [n.waba_id, { id: n.waba_id, label: n.verified_name || n.display_phone_number }])).values()];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="WhatsApp" title="New message template" description="WhatsApp reviews every template before it can be sent." />
      <Card className="p-5">
        <TemplateForm action={createTemplateAction} wabas={wabas} canEditBasics />
      </Card>
    </div>
  );
}
