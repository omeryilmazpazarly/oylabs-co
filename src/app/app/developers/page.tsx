import Link from 'next/link';
import { requireClient } from '@/lib/auth/client-session';
import { listDeliveries } from '@/lib/messaging/deliveries';
import { Card, PageHeader } from '@/components/console/ui';
import { SecretField } from '@/components/console/client';
import { ForwardingForm, RotateSecretForm } from '@/components/messaging/panels';
import { DeliveriesTable } from '@/components/messaging/lists';
import { clientRetryDeliveryAction, clientRotateSecretAction, clientTestDeliveryAction, clientUpdateForwardingAction } from '../actions';

export default async function DevelopersPage() {
  const ctx = await requireClient();
  const w = ctx.workspace;
  const isOwner = ctx.role === 'owner';
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Developers"
        title="Connect your own system"
        description={<>Receive messages at your webhook and reply through the Send API. See the{' '}<Link href="/developers/messaging-api" className="text-ink underline">integration guide</Link>.</>}
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card title="Forwarding webhook" description="We POST every inbound Messenger and Instagram message here, signed with your API secret.">
            <ForwardingForm workspaceId={w.id} name={w.name} forwardUrl={w.forward_url} saveAction={clientUpdateForwardingAction} testAction={clientTestDeliveryAction} showName={false} canEdit={isOwner} />
          </Card>
          <Card title="Recent deliveries">
            <DeliveriesTable deliveries={listDeliveries(w.id)} workspaceId={w.id} retryAction={clientRetryDeliveryAction} />
          </Card>
        </div>
        <Card title="API credentials" className="lg:col-span-2" description="Send with X-OYLABS-Key and an HMAC signature made with your secret.">
          <div className="space-y-4">
            <SecretField label="API key" value={w.api_key} />
            {isOwner
              ? <RotateSecretForm workspaceId={w.id} action={clientRotateSecretAction} />
              : <p className="text-xs text-ink-dim">Ask a workspace owner for the API secret.</p>}
            <p className="text-xs text-ink-dim">Your secret was shown when the workspace was created. If you don&rsquo;t have it, rotate it to get a new one.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
