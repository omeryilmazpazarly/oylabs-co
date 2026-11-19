/**
 * The app's home inside the Shopify admin (embedded app, Polaris web components and
 * App Bridge). Plain HTML so it needs no client bundle. Free of `server-only` for tests.
 */

export interface HomeInput {
  apiKey: string;
  shop: string;
  /** Opens oylabs.co with this store ready to claim (signed, short-lived). */
  builderUrl: string;
  connected: boolean;
  products: number | null;
  privacyUrl: string | null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function homeHtml(input: HomeInput): string {
  const products = input.products === null
    ? 'Your products are being added to the app. This takes a minute for large stores.'
    : `${input.products} ${input.products === 1 ? 'product is' : 'products are'} available in your app.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="shopify-api-key" content="${esc(input.apiKey)}">
<title>OY Labs App Builder</title>
<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
<script src="https://cdn.shopify.com/shopifycloud/polaris-2.js"></script>
</head>
<body>
<s-page heading="OY Labs App Builder">
  ${input.connected
    ? '<s-banner tone="success" heading="Your store is connected">OY Labs is set up as a sales channel. Orders from your app show here in Shopify with OY Labs as the source.</s-banner>'
    : '<s-banner tone="warning" heading="Finishing setup">We could not finish connecting the sales channel. Reload this page in a minute. If it keeps happening, email hi@oylabs.co.</s-banner>'}
  <s-section heading="Your mobile app">
    <s-paragraph>Design your Android and iPhone app, send notifications and publish it to the stores in the App Builder.</s-paragraph>
    <s-button variant="primary" href="${esc(input.builderUrl)}" target="_blank">Open the App Builder</s-button>
  </s-section>
  <s-section heading="Products in your app">
    <s-paragraph id="product-count">${esc(products)}</s-paragraph>
    <s-paragraph color="subdued">New products are added to your app when you publish them to the OY Labs sales channel. You can choose channels for each product in Products.</s-paragraph>
    <s-stack direction="inline" gap="base">
      <s-button id="publish-all">Add all products to the app</s-button>
      <s-button variant="tertiary" href="shopify://admin/products" target="_top">Manage products</s-button>
    </s-stack>
  </s-section>
  <s-section heading="Privacy policy">
    ${input.privacyUrl
      ? `<s-paragraph>Your app's privacy policy is a page in your store, so you can edit it in Online Store › Pages.</s-paragraph><s-link href="${esc(input.privacyUrl)}" target="_blank">View the privacy policy</s-link>`
      : '<s-paragraph>Your app\'s privacy policy page is being created in your store.</s-paragraph>'}
  </s-section>
  <s-section>
    <s-paragraph>Need help? Email <s-link href="mailto:hi@oylabs.co">hi@oylabs.co</s-link> or read the <s-link href="https://oylabs.co/terms/app-builder" target="_blank">App Builder terms</s-link>.</s-paragraph>
  </s-section>
</s-page>
<script>
document.getElementById('publish-all').addEventListener('click', async (e) => {
  const button = e.currentTarget;
  button.loading = true;
  try {
    const res = await fetch('/api/shopify/channel/publish', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'failed');
    document.getElementById('product-count').textContent = data.products + (data.products === 1 ? ' product is' : ' products are') + ' available in your app.';
    shopify.toast.show('Products added to your app');
  } catch (err) {
    shopify.toast.show('Could not add products. Try again.', { isError: true });
  } finally {
    button.loading = false;
  }
});
</script>
</body>
</html>`;
}
