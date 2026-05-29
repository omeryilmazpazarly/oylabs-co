import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#111] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-white font-bold text-sm tracking-tight">OY</span>
          <span className="text-[#71717a] font-light text-sm tracking-[0.2em] ml-1">LABS</span>
        </div>
        <p className="text-xs text-[#3f3f46] tracking-wide">
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
              className="text-xs text-[#71717a] hover:text-white tracking-[0.15em] uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
