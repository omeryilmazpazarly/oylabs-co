import Link from 'next/link';
import { requireClient } from '@/lib/auth/client-session';
import { listWaNumbers } from '@/lib/whatsapp/numbers';
import { listTemplates } from '@/lib/whatsapp/templates';
import { Badge, Card, PageHeader, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import { Notice } from '@/components/console/ui';
import { deleteTemplateAction, syncTemplatesAction } from '../actions';

export const metadata = { title: 'Message templates — OY Labs' };

const TONE: Record<string, 'green' | 'amber' | 'red' | undefined> = { APPROVED: 'green', PENDING: 'amber', IN_APPEAL: 'amber', PENDING_DELETION: 'amber', REJECTED: 'red', PAUSED: 'amber', DISABLED: 'red' };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ created?: string; updated?: string; synced?: string; error?: string }> }) {
  const { created, updated, synced, error } = await searchParams;
  const ctx = await requireClient();
  const isOwner = ctx.role === 'owner';
  const numbers = listWaNumbers(ctx.workspace.id).filter((n) => n.status !== 'disconnected');
  const templates = listTemplates(ctx.workspace.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="WhatsApp"
        title="Message templates"
        description="Approved templates let you message someone more than 24 hours after their last reply, or start a new WhatsApp conversation."
        actions={isOwner && numbers.length > 0 && (
          <div className="flex gap-2">
            <form action={syncTemplatesAction}><SubmitButton className={secondaryBtn} pendingText="Syncing…">Sync from WhatsApp</SubmitButton></form>
            <Link href="/app/templates/new" className={primaryBtn}>New template</Link>
          </div>
        )}
      />
      {(created || updated) && <div className="mb-6"><Notice tone="green">Sent to WhatsApp for review. The status updates here once Meta decides, usually within minutes.</Notice></div>}
      {synced && <div className="mb-6"><Notice tone="green">{synced} template{synced === '1' ? '' : 's'} synced from WhatsApp.</Notice></div>}
      {error && <div className="mb-6"><Notice tone="red">Could not reach WhatsApp. Please try again shortly.</Notice></div>}
      {numbers.length === 0 && (
        <div className="mb-6"><Notice tone="amber">Connect a WhatsApp number first.{' '}<Link href="/app/connections" className="underline">Go to connections</Link></Notice></div>
      )}
      <Card>
        {templates.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-ink">No templates yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-ink-dull">Create one for the messages you send often — order updates, appointment reminders, or a reply when someone writes outside opening hours.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {templates.map((t) => {
              const body = t.components.find((c) => c.type === 'BODY') as { text?: string } | undefined;
              return (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      {t.name}
                      <Badge tone={TONE[t.status]}>{t.status.replace(/_/g, ' ').toLowerCase()}</Badge>
                      <span className="text-xs font-normal text-ink-dull">{t.language} · {t.category.toLowerCase()}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 max-w-xl text-xs text-ink-dull">{body?.text}</p>
                    {t.rejected_reason && <p className="mt-1 text-xs text-red-300">Rejected: {t.rejected_reason.replace(/_/g, ' ').toLowerCase()}</p>}
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-3">
                      <Link href={`/app/templates/${t.id}`} className={secondaryBtn}>Edit</Link>
                      <form action={deleteTemplateAction}>
                        <input type="hidden" name="templateId" value={t.id} />
                        <SubmitButton className="text-xs text-red-300 hover:text-red-200" pendingText="Deleting…">Delete</SubmitButton>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
