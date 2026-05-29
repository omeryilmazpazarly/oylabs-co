'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/#systems',  label: 'Systems'   },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/#stack',    label: 'Core Stack'},
  { href: '/#contact',  label: 'Contact'   },
];

export default function Navbar() {
  const pathname    = usePathname();
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* On any page other than the homepage, always show the solid bar
     so it stays readable over hero images / dark page backgrounds. */
  const isHome   = pathname === '/';
  const solidBar = !isHome || scrolled;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solidBar
            ? 'bg-black/80 backdrop-blur-md border-b border-[#1a1a1a]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-0 select-none group">
            <span className="text-white font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity">OY</span>
            <span className="text-[#71717a] font-light text-lg tracking-[0.2em] ml-1.5 group-hover:text-white/60 transition-colors">LABS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-md transition-all duration-200 tracking-wide ${
                  pathname === link.href
                    ? 'text-white bg-white/8'
                    : 'text-[#71717a] hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex">
            <Link
              href="/#contact"
              className="px-5 py-2 rounded-full text-sm font-medium bg-white text-black tracking-wide hover:bg-[#e4e4e7] transition-all duration-200 active:scale-95"
            >
              Start a Project
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#71717a] hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#222] p-6 flex flex-col gap-4 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[#71717a] hover:text-white text-base tracking-wide transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-5 py-2.5 rounded-full text-sm font-medium bg-white text-black text-center tracking-wide"
            >
              Start a Project
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
