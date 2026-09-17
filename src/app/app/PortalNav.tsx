'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, CreditCard, FileText, LayoutDashboard, MessagesSquare, Plug, Settings, Users } from 'lucide-react';

const ITEMS = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/app/inbox', label: 'Inbox', icon: MessagesSquare },
  { href: '/app/connections', label: 'Connections', icon: Plug },
  { href: '/app/templates', label: 'Templates', icon: FileText, whatsappOnly: true },
  { href: '/app/developers', label: 'Developers', icon: Code2 },
  { href: '/app/team', label: 'Team', icon: Users },
  { href: '/app/billing', label: 'Billing', icon: CreditCard },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function PortalNav({ isOwner, hasWhatsApp }: { isOwner: boolean; hasWhatsApp?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
      {ITEMS.filter((i) => (isOwner || i.href !== '/app/billing') && (hasWhatsApp || !i.whatsappOnly)).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-elevated text-ink' : 'text-ink-dim hover:bg-elevated hover:text-ink'}`}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
