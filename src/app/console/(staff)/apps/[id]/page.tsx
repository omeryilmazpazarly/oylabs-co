import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth/session';
import { getApp } from '@/lib/apps/apps';
import { deviceStats } from '@/lib/apps/push';
import { getWorkspace } from '@/lib/messaging/workspaces';
import { Card, PageHeader, Stat, formatDate, inputCls, labelCls, primaryBtn } from '@/components/console/ui';
import { SecretField, StatusForm } from '@/components/console/client';
import { env } from '@/lib/messaging/env';
import { updateAppAction } from '../actions';

export default async function ConsoleAppPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const app = getApp(Number((await params).id));
  if (!app) notFound();
  const workspace = getWorkspace(app.workspace_id);
  const d = deviceStats(app.id);
  const configUrl = `${env.appBaseUrl()}/api/mobile/v1/config?key=${app.public_key}`;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={workspace?.name ?? 'App'} title={app.name} description={app.store_domain ?? 'No store linked yet'} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Phones" value={d.total ?? 0} hint={`${d.android ?? 0} Android · ${d.ios ?? 0} iOS`} />
        <Stat label="Setup fee" value={app.setup_paid_at ? 'Paid' : 'Unpaid'} hint={app.setup_paid_at ? formatDate(app.setup_paid_at) : '$1,400'} />
        <Stat label="Config version" value={app.config_version} hint={formatDate(app.updated_at)} />
      </div>
      <div className="space-y-6">
        <Card title="Build and status">
          <StatusForm action={updateAppAction} submitLabel="Save" pendingText="Saving…" submitClassName={primaryBtn}>
            <input type="hidden" name="appId" value={app.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelCls}>App name</label>
                <input id="name" name="name" defaultValue={app.name} className={inputCls} />
              </div>
              <div>
                <label htmlFor="status" className={labelCls}>Status</label>
                <select id="status" name="status" defaultValue={app.status} className={inputCls}>
                  <option value="setup">Setting up</option>
                  <option value="building">Building</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div>
                <label htmlFor="androidPackage" className={labelCls}>Android package</label>
                <input id="androidPackage" name="androidPackage" defaultValue={app.android_package ?? ''} placeholder="com.brand.app" className={inputCls} />
              </div>
              <div>
                <label htmlFor="iosBundleId" className={labelCls}>iOS bundle ID</label>
                <input id="iosBundleId" name="iosBundleId" defaultValue={app.ios_bundle_id ?? ''} placeholder="com.brand.app" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="easProjectId" className={labelCls}>EAS project ID</label>
                <input id="easProjectId" name="easProjectId" defaultValue={app.eas_project_id ?? ''} className={inputCls} />
              </div>
            </div>
            {!app.setup_paid_at && (
              <label className="flex items-center gap-3 text-sm text-ink"><input type="checkbox" name="setupPaid" className="h-4 w-4" />Setup fee received ($1,400)</label>
            )}
          </StatusForm>
        </Card>
        <Card title="Connecting the app" description="Put these in the app's client config (EXPO_PUBLIC_APP_KEY / EXPO_PUBLIC_CONFIG_URL).">
          <div className="space-y-4">
            <SecretField label="App key" value={app.public_key} />
            <SecretField label="Config URL" value={configUrl} />
          </div>
        </Card>
      </div>
    </div>
  );
}
