'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const NAV_LINKS = [
  { href: '/#systems',  label: 'Systems'   },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/#stack',    label: 'Core Stack'},
  { href: '/#contact',  label: 'Contact'   },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
            ? 'bg-panel/80 backdrop-blur-md border-b border-line-sub'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-0 select-none group">
            <span className="text-ink font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity">OY</span>
            <span className="text-ink-dim font-light text-lg tracking-[0.2em] ml-1.5 group-hover:text-ink/60 transition-colors">LABS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-md transition-all duration-200 tracking-wide ${
                  pathname === link.href
                    ? 'text-ink bg-ink/8'
                    : 'text-ink-dim hover:text-ink hover:bg-ink/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: theme toggle + CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-hi transition-all duration-200"
            >
              {mounted ? (
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.span key="moon"
                      initial={{ opacity: 0, rotate: -20, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 20, scale: 0.8 }}
                      transition={{ duration: 0.15 }}>
                      <Moon size={14} />
                    </motion.span>
                  ) : (
                    <motion.span key="sun"
                      initial={{ opacity: 0, rotate: 20, scale: 0.8 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -20, scale: 0.8 }}
                      transition={{ duration: 0.15 }}>
                      <Sun size={14} />
                    </motion.span>
                  )}
                </AnimatePresence>
              ) : (
                <span className="w-3.5 h-3.5" />
              )}
            </button>

            <Link
              href="/#contact"
              className="px-5 py-2 rounded-full text-sm font-medium bg-cta text-cta-fg tracking-wide hover:opacity-85 transition-all duration-200 active:scale-95"
            >
              Start a Project
            </Link>
          </div>

          {/* Mobile right: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-dim hover:text-ink transition-colors"
            >
              {mounted && (isDark ? <Moon size={16} /> : <Sun size={16} />)}
            </button>
            <button
              className="text-ink-dim hover:text-ink transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
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
            className="fixed top-16 left-0 right-0 z-40 bg-panel/95 backdrop-blur-md border-b border-line px-6 py-5 flex flex-col gap-1 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-ink-dim hover:text-ink text-sm tracking-wide transition-colors py-3 border-b border-line-sub last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-3 px-5 py-3 rounded-full text-sm font-medium bg-cta text-cta-fg text-center tracking-wide"
            >
              Start a Project
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
