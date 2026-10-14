import { notFound } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { getWorkspaceApp } from '@/lib/apps/apps';
import { Badge, PageHeader } from '@/components/console/ui';
import { STATUS_LABEL, STATUS_TONE } from '../status';
import MobileTabs from './MobileTabs';

export default async function MobileAppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const ctx = await requireClient();
  const app = getWorkspaceApp(ctx.workspace.id, Number((await params).id));
  if (!app) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Mobile app" title={app.name} actions={<Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>} />
      <MobileTabs appId={app.id} />
      {children}
    </div>
  );
}
