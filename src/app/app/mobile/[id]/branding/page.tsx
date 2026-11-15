import { Card, primaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { BrandingEditor, LocalizedField } from '@/components/apps/fields';
import { saveSettingsAction } from '../../actions';
import { loadApp } from '../load';

export default async function MobileBrandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { app, settings } = await loadApp(params);
  const b = settings.branding;
  return (
    <Card title="Branding" description="Layout, colours, logo and shapes. Everything was filled from your store; change anything you like.">
      <StatusForm action={saveSettingsAction} submitLabel="Save branding" pendingText="Saving…" submitClassName={primaryBtn} className="space-y-6">
        <input type="hidden" name="appId" value={app.id} />
        <BrandingEditor appId={app.id} appKey={app.public_key} layout={settings.layout} colors={b.colors} radius={b.radius} buttonStyle={b.buttonStyle} wordmark={b.wordmark} logoUrl={b.logoUrl} />
        <LocalizedField name="branding.tagline" label="Tagline under the name" value={b.tagline} maxLength={60} />
      </StatusForm>
    </Card>
  );
}
