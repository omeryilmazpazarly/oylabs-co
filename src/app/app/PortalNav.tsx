'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, CreditCard, FileText, LayoutDashboard, MessagesSquare, Plug, Settings, Smartphone, Users } from 'lucide-react';

const ITEMS = [
  { href: '/app/mobile', label: 'Mobile app', icon: Smartphone, appsOnly: true },
  { href: '/app', label: 'Overview', icon: LayoutDashboard, exact: true, messaging: true },
  { href: '/app/inbox', label: 'Inbox', icon: MessagesSquare, messaging: true },
  { href: '/app/connections', label: 'Connections', icon: Plug, messaging: true },
  { href: '/app/templates', label: 'Templates', icon: FileText, whatsappOnly: true, messaging: true },
  { href: '/app/developers', label: 'Developers', icon: Code2, messaging: true },
  { href: '/app/team', label: 'Team', icon: Users },
  // App-only businesses pay for their app on the app page; this is the messaging plan.
  { href: '/app/billing', label: 'Billing', icon: CreditCard, messaging: true },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

/** Messaging pages are hidden for businesses that only bought a mobile app. */
export default function PortalNav({ isOwner, hasWhatsApp, hasApps, appOnly }: { isOwner: boolean; hasWhatsApp?: boolean; hasApps?: boolean; appOnly?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
      {ITEMS.filter(
        (i) =>
          (isOwner || i.href !== '/app/billing') &&
          (hasWhatsApp || !i.whatsappOnly) &&
          (hasApps || !i.appsOnly) &&
          !(appOnly && i.messaging),
      ).map(({ href, label, icon: Icon, exact }) => {
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
