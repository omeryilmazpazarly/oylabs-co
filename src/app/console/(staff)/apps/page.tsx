import Link from 'next/link';
import { requireStaff } from '@/lib/auth/session';
import { listAllApps } from '@/lib/apps/apps';
import { deviceStats } from '@/lib/apps/push';
import { listWorkspaces } from '@/lib/messaging/workspaces';
import { Badge, Card, EmptyState, PageHeader, formatDate, inputCls, labelCls, primaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { STATUS_LABEL, STATUS_TONE } from '@/app/app/mobile/status';
import { createAppAction } from './actions';

export default async function ConsoleAppsPage() {
  await requireStaff();
  const apps = listAllApps();
  const workspaces = listWorkspaces();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Products" title="Mobile apps" description="White-label Shopify apps. $1,400 one-time setup, optional monthly care plan." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="All apps" className="lg:col-span-3">
          {apps.length === 0 ? (
            <EmptyState title="No apps yet">Create the first one for a client workspace.</EmptyState>
          ) : (
            <ul className="-my-2 divide-y divide-line-sub">
              {apps.map((a) => {
                const d = deviceStats(a.id);
                return (
                  <li key={a.id}>
                    <Link href={`/console/apps/${a.id}`} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink">{a.name}</div>
                        <div className="truncate text-xs text-ink-dim">{a.workspace_name} · {a.store_domain ?? 'no store'} · {d.total ?? 0} phones</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {a.setup_paid_at ? <Badge tone="green">Paid {formatDate(a.setup_paid_at)}</Badge> : <Badge tone="amber">Setup unpaid</Badge>}
                        <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="New app" className="lg:col-span-2">
          <StatusForm action={createAppAction} submitLabel="Create app" pendingText="Creating…" submitClassName={primaryBtn}>
            <div>
              <label htmlFor="workspaceId" className={labelCls}>Client workspace</label>
              <select id="workspaceId" name="workspaceId" required className={inputCls}>
                {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-ink-dim">Create the workspace first under New workspace if the client is new.</p>
            </div>
            <div>
              <label htmlFor="name" className={labelCls}>App name</label>
              <input id="name" name="name" required placeholder="Leyla" className={inputCls} />
            </div>
            <div>
              <label htmlFor="slug" className={labelCls}>Slug</label>
              <input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" placeholder="leyla" className={inputCls} />
              <p className="mt-1.5 text-xs text-ink-dim">Matches the client folder in the app repo (clients/&lt;slug&gt;).</p>
            </div>
          </StatusForm>
        </Card>
      </div>
    </div>
  );
}
