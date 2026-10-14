import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { requireClient } from '@/lib/auth/client-session';
import { listApps } from '@/lib/apps/apps';
import { Badge, Card, EmptyState, PageHeader } from '@/components/console/ui';
import { STATUS_LABEL, STATUS_TONE } from './status';

export default async function MobileAppsPage() {
  const ctx = await requireClient();
  const apps = listApps(ctx.workspace.id);
  if (apps.length === 1) redirect(`/app/mobile/${apps[0].id}`);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Mobile app" title="Your shopping apps" description="Control your store app's branding, home banners and notifications. Changes reach phones without an app store update." />
      {apps.length === 0 ? (
        <Card>
          <EmptyState icon={<Smartphone size={20} />} title="No app yet">
            A branded iPhone and Android app for your Shopify store: live stock, cash on delivery, reviews, Arabic and English.
            One-time setup of $1,400, then an optional monthly care plan. Email{' '}
            <a className="text-ink underline" href="mailto:hi@oylabs.co?subject=Shopify%20mobile%20app">hi@oylabs.co</a> to start.
          </EmptyState>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Link key={a.id} href={`/app/mobile/${a.id}`} className="block rounded-2xl border border-line bg-panel p-5 hover:border-line-hi">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink">{a.name}</div>
                  <div className="text-xs text-ink-dim">{a.store_domain ?? 'No store linked yet'}</div>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
