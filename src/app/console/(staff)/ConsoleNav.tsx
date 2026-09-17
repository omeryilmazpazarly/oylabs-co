'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessagesSquare, Building2, Images, Globe } from 'lucide-react';

const ITEMS = [
  { href: '/console', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/console/inbox', label: 'Inbox', icon: MessagesSquare },
  { href: '/console/workspaces/new', label: 'New workspace', icon: Building2 },
  { href: '/admin', label: 'Portfolio admin', icon: Images },
  { href: '/tech-provider', label: 'Public service page', icon: Globe },
];

export default function ConsoleNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? 'bg-elevated text-ink' : 'text-ink-dim hover:bg-elevated hover:text-ink'
            }`}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
