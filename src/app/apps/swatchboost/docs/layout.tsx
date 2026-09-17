import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SwatchBoost Documentation | OY Labs',
  description: 'Complete documentation for SwatchBoost — installation, customizer, RTL setup, discount configuration, billing, and troubleshooting.',
  icons: {
    icon: '/apps/swatchboost/favicon.ico',
    apple: '/apps/swatchboost/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SwatchBoost Documentation',
    description: 'Getting started, customizer, RTL/Arabic support, discount setup, plans, and troubleshooting.',
    type: 'website',
    images: [{ url: 'https://oylabs.co/apps/swatchboost/icon_1024x1024.png', width: 1200, height: 1200, alt: 'SwatchBoost' }],
  },
};

export default function SwatchBoostDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
