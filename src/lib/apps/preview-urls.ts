/** The web build of the real app (storefront-app demo client), served next to the landing page. */
export const APP_PREVIEW_ORIGIN = 'https://oylabs.co';
const BASE = `${APP_PREVIEW_ORIGIN}/app-preview`;

/** The app a store would get, before it has an account (landing page, sign-up). */
export const storePreviewUrl = (store: string, layout: string) => `${BASE}/preview?store=${encodeURIComponent(store)}&layout=${encodeURIComponent(layout)}`;
/** An existing app exactly as its dashboard saved it. */
export const appPreviewUrl = (appKey: string) => `${BASE}/preview?key=${encodeURIComponent(appKey)}`;
