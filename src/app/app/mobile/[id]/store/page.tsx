import { Card, Notice, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { connectWebhooksAction, saveStoreAction } from '../../actions';
import { loadApp } from '../load';

export default async function MobileStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { app, isOwner } = await loadApp(params);
  const field = (name: string, label: string, value: string | null, hint?: string, placeholder?: string) => (
    <div>
      <label htmlFor={name} className={labelCls}>{label}</label>
      <input id={name} name={name} defaultValue={value ?? ''} placeholder={placeholder} disabled={!isOwner} className={inputCls} />
      {hint && <p className="mt-1.5 text-xs text-ink-dim">{hint}</p>}
    </div>
  );
  return (
    <div className="space-y-6">
      {!isOwner && <Notice>Only the workspace owner can change the store connection.</Notice>}
      <Card title="Shopify store" description="The store your app sells from. Shopify admin → Sales channels → Headless → your storefront.">
        <StatusForm action={saveStoreAction} submitLabel="Save connection" pendingText="Saving…" submitClassName={primaryBtn}>
          <input type="hidden" name="appId" value={app.id} />
          {field('storeDomain', 'Store domain', app.store_domain, 'Your .myshopify.com domain.', 'my-store.myshopify.com')}
          {field('storefrontToken', 'Storefront API public access token', app.storefront_token, 'The PUBLIC token (32 characters). Never paste the private token here.')}
          <div className="border-t border-line-sub pt-4 text-xs font-semibold text-ink">Customer accounts (sign-in, orders, addresses)</div>
          {field('customerShopId', 'Shop ID', app.customer_shop_id, 'The number in your Customer Account endpoints.')}
          {field('customerClientId', 'Customer Account API client ID', app.customer_client_id)}
          {field('customerApiEndpoint', 'Customer Account GraphQL endpoint', app.customer_api_endpoint, undefined, 'https://shopify.com/<shop id>/account/customer/api/2026-07/graphql')}
          {field('customerAuthEndpoint', 'Authentication base URL', app.customer_auth_endpoint, undefined, 'https://shopify.com/authentication/<shop id>')}
          <div className="border-t border-line-sub pt-4 text-xs font-semibold text-ink">Order and back-in-stock notifications (optional)</div>
          <div>
            <label htmlFor="adminToken" className={labelCls}>Admin API access token</label>
            <input id="adminToken" name="adminToken" type="password" placeholder={app.admin_token_enc ? 'Saved — leave blank to keep' : 'shpat_…'} disabled={!isOwner} className={inputCls} />
            <p className="mt-1.5 text-xs text-ink-dim">From a custom app (Settings → Apps → Develop apps) with read_orders, read_inventory and read_products. Stored encrypted.</p>
          </div>
          <div>
            <label htmlFor="webhookSecret" className={labelCls}>API secret key of that app</label>
            <input id="webhookSecret" name="webhookSecret" type="password" placeholder={app.webhook_secret_enc ? 'Saved — leave blank to keep' : ''} disabled={!isOwner} className={inputCls} />
            <p className="mt-1.5 text-xs text-ink-dim">Used to verify that notifications really come from Shopify.</p>
          </div>
        </StatusForm>
      </Card>
      {isOwner && app.admin_token_enc && app.webhook_secret_enc && (
        <Card title="Connect notifications" description="Subscribes your store's order and stock updates, so customers get shipped, delivered and back-in-stock pushes.">
          <StatusForm action={connectWebhooksAction} submitLabel="Connect Shopify notifications" pendingText="Connecting…" submitClassName={secondaryBtn}>
            <input type="hidden" name="appId" value={app.id} />
          </StatusForm>
        </Card>
      )}
    </div>
  );
}
