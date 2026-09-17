import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Greet | OY Labs',
  description: 'Greet documentation. Set up multi-step onboarding flows, enable the App Embed, customise the design, and save customer answers to Shopify metafields.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
