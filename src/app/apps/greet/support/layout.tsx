import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support — Greet | OY Labs',
  description: 'Greet support. Email hello@oylabs.co and browse common questions about the onboarding popup, App Embed, and saving answers to Shopify customer profiles.',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
