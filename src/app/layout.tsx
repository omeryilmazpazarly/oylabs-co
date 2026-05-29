import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import CursorGlow from '@/components/effects/CursorGlow';
import PageBackground from '@/components/effects/PageBackground';
import { ThemeProvider } from '@/contexts/ThemeContext';

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
      {/*
        bg-[#000000] here is the SSR/no-JS fallback.
        Once JavaScript boots, PageBackground takes over and animates
        document.body.style.backgroundColor in real time.
      */}
      <body className="min-h-screen bg-[#000000] text-white antialiased">
        <ThemeProvider>
          {/* Reads global lightness → updates document.body bg at 60fps */}
          <PageBackground />
          <CursorGlow />
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
