import { Badge, Card, EmptyState, Notice, formatDate, inputCls, labelCls, primaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { deviceStats, listPushes } from '@/lib/apps/push';
import { sendPushAction } from '../../actions';
import { loadApp } from '../load';

const KIND: Record<string, string> = { campaign: 'Campaign', order_update: 'Order update', back_in_stock: 'Back in stock' };

export default async function MobileNotificationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { app } = await loadApp(params);
  const stats = deviceStats(app.id);
  const pushes = listPushes(app.id);
  return (
    <div className="space-y-6">
      <Card title="Send a notification" description={`${stats.total ?? 0} phones have notifications on; ${stats.offers ?? 0} accept offers.`}>
        <StatusForm action={sendPushAction} submitLabel="Send now" pendingText="Sending…" submitClassName={primaryBtn} resetOnSuccess>
          <input type="hidden" name="appId" value={app.id} />
          <div>
            <label htmlFor="title" className={labelCls}>Title</label>
            <input id="title" name="title" required maxLength={65} placeholder="New in: the Summer edit" className={inputCls} />
          </div>
          <div>
            <label htmlFor="body" className={labelCls}>Message</label>
            <textarea id="body" name="body" required maxLength={240} rows={3} placeholder="Light linen sets just landed. Cash on delivery across Egypt." className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="link" className={labelCls}>Opens (optional)</label>
              <input id="link" name="link" placeholder="/collection/summer-collection" className={inputCls} />
            </div>
            <div>
              <label htmlFor="audience" className={labelCls}>Send to</label>
              <select id="audience" name="audience" defaultValue="offers" className={inputCls}>
                <option value="offers">Customers who accept offers</option>
                <option value="all">Everyone (service updates only)</option>
              </select>
            </div>
          </div>
        </StatusForm>
      </Card>
      {!app.admin_token_enc && (
        <Notice>Automatic order and back-in-stock notifications start once you add your Shopify Admin token under Store.</Notice>
      )}
      <Card title="History">
        {pushes.length === 0 ? (
          <EmptyState title="Nothing sent yet" />
        ) : (
          <ul className="divide-y divide-line-sub">
            {pushes.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{p.title}</div>
                  <div className="truncate text-xs text-ink-dim">{p.body}</div>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone={p.status === 'sent' ? 'green' : p.status === 'failed' ? 'red' : 'amber'}>{KIND[p.kind] ?? p.kind}</Badge>
                  <div className="mt-1 text-xs text-ink-dim">{p.sent_count} · {formatDate(p.sent_at ?? p.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
