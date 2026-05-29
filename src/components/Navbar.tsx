'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useMotionTemplate, useMotionValueEvent,
} from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { usePageLightness } from '@/contexts/ThemeContext';

const NAV_LINKS = [
  { href: '/#systems',  label: 'Systems'    },
  { href: '/portfolio', label: 'Portfolio'  },
  { href: '/#stack',    label: 'Core Stack' },
  { href: '/#contact',  label: 'Contact'    },
];

export default function Navbar() {
  const pathname    = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── scroll-based opacity (0 = top, 1 = scrolled) ──────────────────────
  const scrolled = useMotionValue(0);
  useEffect(() => {
    const update = () => scrolled.set(window.scrollY > 20 ? 1 : 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [scrolled]);

  // ── page lightness from global context ────────────────────────────────
  const lightness = usePageLightness();

  // Background colour components (black ↔ white)
  const bgR = useTransform(lightness, [0, 1], [0,   255]);
  const bgG = useTransform(lightness, [0, 1], [0,   255]);
  const bgB = useTransform(lightness, [0, 1], [0,   255]);
  // Opacity: 0 at top, 0.88 when scrolled
  const bgA = useTransform(scrolled, [0, 1], [0, 0.88]);
  const headerBg = useMotionTemplate`rgba(${bgR},${bgG},${bgB},${bgA})`;

  // Border: transparent at top, coloured when scrolled (dark ↔ light border)
  const borderR = useTransform(lightness, [0, 1], [34,  228]);
  const borderG = useTransform(lightness, [0, 1], [34,  228]);
  const borderB = useTransform(lightness, [0, 1], [34,  231]);
  const borderA = useTransform(scrolled, [0, 1], [0, 1]);
  const headerBorder = useMotionTemplate`rgba(${borderR},${borderG},${borderB},${borderA})`;

  // Logo / nav text colours
  const logoColor  = useTransform(lightness, [0, 1], ['#ffffff', '#09090b']);
  const labelColor = useTransform(lightness, [0, 1], ['#71717a', '#52525b']);

  // CTA button: white-on-black in dark, black-on-white in light
  const ctaBg   = useTransform(lightness, [0, 1], ['#ffffff', '#09090b']);
  const ctaText = useTransform(lightness, [0, 1], ['#000000', '#ffffff']);

  // Mobile menu bg
  const [isLight, setIsLight] = useState(false);
  useMotionValueEvent(lightness, 'change', (v) => setIsLight(v > 0.45));

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor:    headerBg,
          borderBottomColor:  headerBorder,
          backdropFilter:     'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-0 select-none group">
            <motion.span
              style={{ color: logoColor }}
              className="font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity"
            >
              OY
            </motion.span>
            <motion.span
              style={{ color: labelColor }}
              className="font-light text-lg tracking-[0.2em] ml-1.5"
            >
              LABS
            </motion.span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-md transition-all duration-200 tracking-wide ${
                  isLight
                    ? 'text-[#52525b] hover:text-[#09090b] hover:bg-black/5'
                    : 'text-[#71717a] hover:text-white hover:bg-white/5'
                } ${pathname === link.href ? (isLight ? 'text-[#09090b] bg-black/8' : 'text-white bg-white/8') : ''}`}
                style={{ transition: 'color 0.4s ease, background-color 0.4s ease' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <motion.div
              style={{ backgroundColor: ctaBg }}
              className="rounded-full overflow-hidden"
            >
              <Link
                href="/#contact"
                style={{ transition: 'opacity 0.2s ease' }}
                className="block px-5 py-2 text-sm font-medium tracking-wide hover:opacity-80 active:scale-95"
              >
                <motion.span style={{ color: ctaText }}>Start a Project</motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile toggle */}
          <motion.button
            style={{ color: labelColor }}
            className="md:hidden transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0,   y: -10 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-16 left-0 right-0 z-40 backdrop-blur-md border-b p-6 flex flex-col gap-4 md:hidden transition-colors duration-500 ${
              isLight
                ? 'bg-white/90 border-[#e4e4e7]'
                : 'bg-black/95 border-[#222]'
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base tracking-wide transition-colors ${
                  isLight ? 'text-[#52525b] hover:text-[#09090b]' : 'text-[#71717a] hover:text-white'
                }`}
                style={{ transition: 'color 0.4s ease' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className={`mt-2 px-5 py-2.5 rounded-full text-sm font-medium text-center tracking-wide transition-colors duration-500 ${
                isLight ? 'bg-[#09090b] text-white' : 'bg-white text-black'
              }`}
            >
              Start a Project
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
