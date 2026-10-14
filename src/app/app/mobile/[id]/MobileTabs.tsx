'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '', label: 'Overview' },
  { href: '/store', label: 'Store' },
  { href: '/branding', label: 'Branding' },
  { href: '/content', label: 'Text & contact' },
  { href: '/home', label: 'Home banners' },
  { href: '/notifications', label: 'Notifications' },
];

export default function MobileTabs({ appId }: { appId: number }) {
  const pathname = usePathname();
  const base = `/app/mobile/${appId}`;
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-line-sub">
      {TABS.map((t) => {
        const href = base + t.href;
        const active = t.href ? pathname.startsWith(href) : pathname === base;
        return (
          <Link key={t.label} href={href} className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${active ? 'border-ink text-ink' : 'border-transparent text-ink-dim hover:text-ink'}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
