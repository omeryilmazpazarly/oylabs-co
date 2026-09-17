import Link from 'next/link';

const NAV_LINKS = [
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/#systems', label: 'Services' },
  { href: '/tech-provider', label: 'Messaging Integration' },
  { href: '/#contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/data-deletion', label: 'Data Deletion' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line-sub py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-ink font-bold text-sm tracking-tight">OY</span>
          <span className="text-ink-dim font-light text-sm tracking-[0.2em] ml-1">LABS</span>
        </div>
        <p className="text-xs text-ink-dull tracking-wide">
          © {new Date().getFullYear()} OY Labs Ltd — All rights reserved.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-ink-dim hover:text-ink tracking-[0.15em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-line-sub flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <p className="text-xs text-ink-dull leading-relaxed">
          <span className="inline-block">OY Labs Ltd</span>
          <span className="mx-2" aria-hidden>·</span>
          <span className="inline-block">71-75 Shelton Street, Covent Garden,</span>{' '}
          <span className="inline-block">London WC2H 9JQ, United Kingdom</span>
          <span className="mx-2" aria-hidden>·</span>
          <a href="mailto:hi@oylabs.co" className="inline-block hover:text-ink transition-colors">
            hi@oylabs.co
          </a>
        </p>
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-ink-dull hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
