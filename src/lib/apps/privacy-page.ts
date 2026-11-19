/**
 * The mobile app's privacy policy, published as a page in the merchant's own Shopify
 * store (the merchant is the app's publisher, so the policy is theirs). Kept free of
 * `server-only` so it can be tested directly.
 */

export const PRIVACY_PAGE_HANDLE = 'mobile-app-privacy';
export const PRIVACY_PAGE_TITLE = 'Mobile app privacy policy';

export interface PrivacyPageInput {
  storeName: string;
  contactEmail: string | null;
  storeUrl: string;
  /** Shown as the date the policy was last updated, e.g. "19 November 2026". */
  updated: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function privacyPageHtml(input: PrivacyPageInput): string {
  const name = escapeHtml(input.storeName.trim() || 'our store');
  const url = escapeHtml(input.storeUrl);
  const contact = input.contactEmail
    ? `<a href="mailto:${escapeHtml(input.contactEmail)}">${escapeHtml(input.contactEmail)}</a>`
    : `the contact page of <a href="${url}">${url}</a>`;
  return [
    `<p><em>Last updated: ${escapeHtml(input.updated)}</em></p>`,
    `<p>This policy explains what the ${name} mobile app for Android and iPhone collects and how it is used. It adds to the store's main privacy policy, which also applies to the app.</p>`,
    `<h2>What the app collects</h2>`,
    `<ul>`,
    `<li><strong>Your account and orders.</strong> When you sign in, add to your bag or check out, the app uses Shopify, the platform that runs ${name}. Shopify handles your account, addresses, orders and payments as it does on our website. The app does not store your card details.</li>`,
    `<li><strong>Notifications.</strong> If you allow notifications, the app saves a device code so we can send you order updates, back-in-stock alerts and offers. You can turn notifications off at any time in your phone's settings.</li>`,
    `<li><strong>Saved items and settings.</strong> Your saved items, language and recently viewed products are kept on your phone.</li>`,
    `<li><strong>App usage.</strong> The app may record which products are viewed and added to the bag, without your name, so we can improve the store.</li>`,
    `</ul>`,
    `<h2>Who helps run the app</h2>`,
    `<p>Shopify runs the store, the checkout and your account. OY Labs Ltd builds and hosts the app for ${name}, and processes notification codes and app settings for us. Apple and Google deliver notifications to your phone.</p>`,
    `<h2>Your choices</h2>`,
    `<p>You can delete the app at any time. To see, correct or delete the data held about you, contact us at ${contact}.</p>`,
    `<h2>Children</h2>`,
    `<p>The app is not meant for children under 13, and we do not knowingly collect their data.</p>`,
    `<h2>Changes</h2>`,
    `<p>If we change this policy, we will update the date at the top of this page.</p>`,
  ].join('\n');
}
