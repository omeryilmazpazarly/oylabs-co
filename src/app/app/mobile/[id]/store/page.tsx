import { Card, Notice, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { connectStoreAction, connectWebhooksAction, saveStoreAction } from '../../actions';
import { shopifyAppConfigured } from '@/lib/apps/shopify-oauth';
import { loadApp } from '../load';

const SHOPIFY_NOTICE: Record<string, string> = {
  connected: 'Shopify connected. Live stock and order notifications are on.',
  failed: 'Shopify did not finish the connection. Please try again.',
  shop: 'Type your .myshopify.com address to connect.',
  owner_only: 'Only the workspace owner can connect Shopify.',
  not_configured: 'One-click connection is not available yet. Use the advanced settings below.',
};

export default async function MobileStorePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ shopify?: string }> }) {
  const { app, isOwner } = await loadApp(params);
  const { shopify } = await searchParams;
  const oneClick = app.admin_token_enc && app.store_domain?.endsWith('.myshopify.com');
  const myshopify = app.store_domain?.endsWith('.myshopify.com') ? app.store_domain : '';
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
      <Card title="Your Shopify store" description="Type your store's address. Your app shows its products, prices and collections right away; checkout stays on Shopify.">
        <StatusForm action={connectStoreAction} submitLabel={app.store_domain ? 'Change store' : 'Connect store'} pendingText="Finding your store…" submitClassName={primaryBtn}>
          <input type="hidden" name="appId" value={app.id} />
          {app.store_domain && <p className="text-sm text-emerald-600">Connected: {app.store_domain}</p>}
          {field('address', 'Store address', null, 'The address customers visit, for example mystore.com.', app.store_domain ?? 'mystore.com')}
        </StatusForm>
      </Card>
      {shopify && SHOPIFY_NOTICE[shopify] && <Notice>{SHOPIFY_NOTICE[shopify]}</Notice>}
      {isOwner && shopifyAppConfigured() && (
        <Card
          title={oneClick ? 'Shopify connected' : 'Connect with Shopify (recommended)'}
          description={oneClick
            ? `Live stock, order updates and back-in-stock notifications are on for ${app.store_domain}.`
            : 'One click: approve the OY Labs app in your Shopify admin. Turns on live stock, order updates and back-in-stock notifications. No tokens to copy.'}
        >
          <form action="/api/shopify/connect" method="get" className="space-y-3">
            <input type="hidden" name="appId" value={app.id} />
            <div>
              <label htmlFor="shop" className={labelCls}>Your .myshopify.com address</label>
              <input id="shop" name="shop" defaultValue={myshopify} placeholder="my-store.myshopify.com" className={inputCls} />
              <p className="mt-1.5 text-xs text-ink-dim">Find it in Shopify admin, Settings → Domains.</p>
            </div>
            <button type="submit" className={oneClick ? secondaryBtn : primaryBtn}>{oneClick ? 'Reconnect Shopify' : 'Connect with Shopify'}</button>
          </form>
        </Card>
      )}
      <details className="rounded-2xl border border-line bg-panel p-5">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Advanced (optional): stock counts, customer accounts and order notifications</summary>
        <div className="mt-4">
        <StatusForm action={saveStoreAction} submitLabel="Save connection" pendingText="Saving…" submitClassName={primaryBtn}>
          <input type="hidden" name="appId" value={app.id} />
          {field('storeDomain', 'Store domain', app.store_domain, 'Your .myshopify.com domain.', 'my-store.myshopify.com')}
          {field('storefrontToken', 'Storefront API public access token', app.storefront_token, 'Optional. Adds live stock counts. The PUBLIC token (32 characters), never the private one.')}
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
        </div>
      </details>
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
