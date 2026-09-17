import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SwatchBoost — Multi-Color Upsell for Shopify | OY Labs',
  description: 'SwatchBoost intercepts Add to Cart on Shopify product pages, lets customers pick multiple colour variants at once, and applies automatic bulk discounts. RTL-ready. No code needed.',
  keywords: ['shopify app', 'color swatches', 'bulk discount', 'upsell', 'RTL', 'multi-color'],
  icons: {
    icon: '/apps/swatchboost/favicon.ico',
    apple: '/apps/swatchboost/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SwatchBoost — Multi-Color Upsell for Shopify',
    description: 'Add multiple colours at once — bulk discounts applied automatically at checkout.',
    type: 'website',
    images: [{ url: 'https://oylabs.co/apps/swatchboost/icon_1024x1024.png', width: 1200, height: 1200, alt: 'SwatchBoost' }],
  },
};

export default function SwatchBoostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
