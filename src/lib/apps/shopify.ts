import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/lib/messaging/env';
import { log, errorSummary } from '@/lib/log';
import { adminToken, AppError, type MobileApp } from './apps';
import { claimStockAlerts, customerDevices, sendAutomatic } from './push';

/**
 * Shopify → app notifications. When a store adds an Admin API token (custom app with
 * read_orders, read_inventory and read_products),
 * we subscribe to order and inventory webhooks and turn them into pushes:
 * shipped / out for delivery / delivered for the customer's devices, and
 * back-in-stock for devices that asked about a sold-out variant.
 */

const API_VERSION = '2026-07';
export const WEBHOOK_TOPICS = ['FULFILLMENTS_CREATE', 'FULFILLMENT_EVENTS_CREATE', 'ORDERS_CANCELLED', 'INVENTORY_LEVELS_UPDATE'] as const;

export function verifyWebhook(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const given = Buffer.from(hmacHeader, 'base64');
  return given.length === digest.length && timingSafeEqual(given, digest);
}

async function admin<T>(app: MobileApp, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = adminToken(app);
  if (!token || !app.store_domain) throw new AppError('Add the store\'s Admin API token first.');
  const res = await fetch(`https://${app.store_domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-shopify-access-token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new AppError(`Shopify answered ${res.status}. Check the Admin API token.`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors || !json.data) throw new AppError('Shopify rejected the request. Check the token\'s permissions.');
  return json.data;
}

/** Subscribes the store's webhooks to this server. Safe to run again (existing ones are kept). */
export async function registerWebhooks(app: MobileApp): Promise<number> {
  const callbackUrl = `${env.appBaseUrl()}/api/mobile/v1/shopify/${app.id}`;
  const existing = await admin<{ webhookSubscriptions: { nodes: { topic: string; uri: string }[] } }>(
    app,
    `query { webhookSubscriptions(first: 50) { nodes { topic uri } } }`,
  );
  const have = new Set(existing.webhookSubscriptions.nodes.filter((n) => n.uri === callbackUrl).map((n) => n.topic));
  let created = 0;
  for (const topic of WEBHOOK_TOPICS) {
    if (have.has(topic)) continue;
    const data = await admin<{ webhookSubscriptionCreate: { userErrors: { message: string }[] } }>(
      app,
      `mutation ($topic: WebhookSubscriptionTopic!, $url: String!) {
         webhookSubscriptionCreate(topic: $topic, webhookSubscription: { uri: $url, format: JSON }) {
           userErrors { message }
         }
       }`,
      { topic, url: callbackUrl },
    );
    if (data.webhookSubscriptionCreate.userErrors.length) throw new AppError(data.webhookSubscriptionCreate.userErrors[0].message);
    created++;
  }
  return created;
}

type Payload = Record<string, unknown>;
const customerOf = (p: Payload): string | null => {
  const c = (p.customer as Payload | undefined) ?? ((p.order as Payload | undefined)?.customer as Payload | undefined);
  const id = c?.id ?? p.customer_id;
  return id ? String(id) : null;
};

const SHIPMENT_COPY: Record<string, { en: string; ar: string }> = {
  in_transit: { en: 'Your order is on its way', ar: 'طلبك في الطريق إليك' },
  out_for_delivery: { en: 'Your order is out for delivery today', ar: 'طلبك خرج للتوصيل اليوم' },
  delivered: { en: 'Your order was delivered', ar: 'تم تسليم طلبك' },
};

/** Handles one verified webhook. Returns how many pushes went out. */
export async function handleWebhook(app: MobileApp, topic: string, p: Payload): Promise<number> {
  try {
    switch (topic) {
      case 'fulfillments/create': {
        const customer = customerOf(p);
        if (!customer) return 0;
        const order = String((p.name as string | undefined) ?? '');
        return await sendAutomatic(app.id, 'order_update', customerDevices(app.id, customer, 'orderUpdates'), {
          title: 'Your order has shipped',
          body: order ? `Order ${order} is on its way. Tap to track it.` : 'Tap to track it.',
          link: '/orders',
        });
      }
      case 'fulfillment_events/create': {
        const status = String(p.status ?? '');
        const copy = SHIPMENT_COPY[status];
        const customer = customerOf(p);
        if (!copy || !customer) return 0;
        return await sendAutomatic(app.id, 'order_update', customerDevices(app.id, customer, 'orderUpdates'), {
          title: copy.en,
          body: copy.ar,
          link: '/orders',
        });
      }
      case 'orders/cancelled': {
        const customer = customerOf(p);
        if (!customer) return 0;
        return await sendAutomatic(app.id, 'order_update', customerDevices(app.id, customer, 'orderUpdates'), {
          title: 'Your order was cancelled',
          body: `Order ${String(p.name ?? '')} was cancelled. Contact us if you have a question.`,
          link: '/orders',
        });
      }
      case 'inventory_levels/update': {
        if (!(Number(p.available) > 0) || !p.inventory_item_id) return 0;
        const data = await admin<{ inventoryItem: { variants: { nodes: { id: string }[] } } | null }>(
          app,
          `query ($id: ID!) { inventoryItem(id: $id) { variants(first: 1) { nodes { id } } } }`,
          { id: `gid://shopify/InventoryItem/${p.inventory_item_id}` },
        );
        const variantId = data.inventoryItem?.variants.nodes[0]?.id;
        if (!variantId) return 0;
        const waiting = claimStockAlerts(app.id, [variantId]);
        let sent = 0;
        for (const handle of new Set(waiting.map((w) => w.product_handle))) {
          const group = waiting.filter((w) => w.product_handle === handle);
          sent += await sendAutomatic(app.id, 'back_in_stock', group, {
            title: 'Back in stock',
            body: `${group[0].product_title ?? 'The piece you wanted'} is available again. Grab it before it sells out.`,
            link: `/product/${handle}`,
          });
        }
        return sent;
      }
      default:
        return 0;
    }
  } catch (err) {
    log.error('mobile_webhook_failed', { appId: app.id, topic, error: errorSummary(err) });
    return 0;
  }
}
