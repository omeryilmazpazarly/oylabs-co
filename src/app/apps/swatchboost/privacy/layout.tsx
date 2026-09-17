import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SwatchBoost | OY Labs',
  description: 'SwatchBoost privacy policy. We store only shop-level configuration data. No customer PII is collected or processed.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
