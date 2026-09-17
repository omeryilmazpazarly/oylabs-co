import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Greet | OY Labs',
  description: 'Greet privacy policy. Customer answers are saved as Shopify customer metafields; we store only flow configuration and anonymised analytics. GDPR compliant.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
