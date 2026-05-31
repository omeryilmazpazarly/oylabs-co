import Link from 'next/link';

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
        <div className="flex items-center gap-6">
          {[
            { href: '/portfolio', label: 'Portfolio' },
            { href: '/#systems', label: 'Services' },
            { href: '/#contact', label: 'Contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-ink-dim hover:text-ink tracking-[0.15em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
