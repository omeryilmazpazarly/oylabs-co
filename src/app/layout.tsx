import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/effects/CursorGlow';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OY Labs — Technical Systems Architecture',
  description:
    'High-end Technical Systems Architecture, Custom Web/Mobile Applications, and Serverless Automation Workflows.',
  keywords: ['systems architecture', 'web applications', 'serverless', 'automation', 'mobile apps'],
  openGraph: {
    title: 'OY Labs — Technical Systems Architecture',
    description: 'High-end Technical Systems Architecture, Custom Web/Mobile Applications, and Serverless Automation Workflows.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#000000] text-white antialiased">
        <CursorGlow />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
