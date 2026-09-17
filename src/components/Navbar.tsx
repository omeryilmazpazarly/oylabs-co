'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ArrowUpRight, Layers, Wallet, MessageSquare } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

/* ── Mega-menu data — add new columns here ──────────────────────── */
const SHOPIFY_MEGA: {
  title: string;
  items: { label: string; description: string; href: string; icon: React.ReactNode }[];
}[] = [
  {
    title: 'Apps',
    items: [
      {
        label: 'Greet',
        description: 'Multi-step onboarding popup. Saves preferences to Shopify customer profiles.',
        href: '/apps/greet',
        icon: <MessageSquare size={14} />,
      },
      {
        label: 'SwatchBoost',
        description: 'Multi-colour upsell with live bulk discounts. Native RTL & Arabic support.',
        href: '/apps/SwatchBoost',
        icon: <Layers size={14} />,
      },
    ],
  },
];

/* ── Products mega-menu data ────────────────────────────────────── */
const PRODUCTS_MEGA: {
  title: string;
  items: { label: string; description: string; href: string; icon: React.ReactNode; external?: boolean }[];
}[] = [
  {
    title: 'Apps',
    items: [
      {
        label: 'Klair',
        description: 'Personal finance tracker. Multi-currency, AI receipt scanning, no bank login.',
        href: 'https://klair.pro',
        icon: <Wallet size={14} />,
        external: true,
      },
    ],
  },
];

const PLAIN_LINKS = [
  { href: '/#systems',  label: 'Systems'   },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/#stack',    label: 'Core Stack'},
  { href: '/#contact',  label: 'Contact'   },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [shopifyOpen,  setShopifyOpen]  = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileShopifyOpen,  setMobileShopifyOpen]  = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const shopifyRef  = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme, mounted } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mega menus on outside click */
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (shopifyRef.current  && !shopifyRef.current.contains(e.target as Node))  setShopifyOpen(false);
      if (productsRef.current && !productsRef.current.contains(e.target as Node)) setProductsOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
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
            {PLAIN_LINKS.map((link) => (
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

            {/* Shopify mega-menu trigger */}
            <div
              ref={shopifyRef}
              className="relative"
              onMouseEnter={() => setShopifyOpen(true)}
              onMouseLeave={() => setShopifyOpen(false)}
            >
              <button
                onClick={() => setShopifyOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-all duration-200 tracking-wide ${
                  shopifyOpen ? 'text-ink bg-ink/8' : 'text-ink-dim hover:text-ink hover:bg-ink/5'
                }`}
              >
                Shopify Apps
                <motion.svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  animate={{ rotate: shopifyOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="opacity-50"
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>

              {/* Mega panel */}
              <AnimatePresence>
                {shopifyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[280px] rounded-2xl border border-line bg-panel shadow-xl overflow-hidden"
                    style={{ boxShadow: '0 20px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    {/* Inner padding */}
                    <div className="p-3 flex gap-3">
                      {SHOPIFY_MEGA.map((col) => (
                        <div key={col.title} className="flex-1 min-w-[200px]">
                          {/* Column header */}
                          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-ink-dull px-3 py-2">
                            {col.title}
                          </p>
                          {col.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setShopifyOpen(false)}
                              className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-ink/5 transition-colors duration-150"
                            >
                              <span className="mt-0.5 w-6 h-6 rounded-md bg-ink/6 border border-line flex items-center justify-center flex-shrink-0 text-ink-dull group-hover:text-ink group-hover:border-line-hi transition-colors">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-ink leading-none mb-1 flex items-center gap-1">
                                  {item.label}
                                  <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                </p>
                                <p className="text-[11px] text-ink-dull leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Footer bar */}
                    <div className="border-t border-line-sub px-5 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-ink-ghost tracking-wide">Shopify Partner</span>
                      <Link
                        href="/portfolio?filter=APPS_PLUGINS"
                        onClick={() => setShopifyOpen(false)}
                        className="text-[11px] text-ink-dull hover:text-ink flex items-center gap-1 transition-colors"
                      >
                        View all apps
                        <ArrowUpRight size={10} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Products mega-menu trigger */}
            <div
              ref={productsRef}
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                onClick={() => setProductsOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-all duration-200 tracking-wide ${
                  productsOpen ? 'text-ink bg-ink/8' : 'text-ink-dim hover:text-ink hover:bg-ink/5'
                }`}
              >
                Products
                <motion.svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  animate={{ rotate: productsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="opacity-50"
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>

              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[260px] rounded-2xl border border-line bg-panel shadow-xl overflow-hidden"
                    style={{ boxShadow: '0 20px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    <div className="p-3 flex gap-3">
                      {PRODUCTS_MEGA.map((col) => (
                        <div key={col.title} className="flex-1 min-w-[200px]">
                          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-ink-dull px-3 py-2">
                            {col.title}
                          </p>
                          {col.items.map((item) => (
                            <a
                              key={item.href}
                              href={item.href}
                              target={item.external ? '_blank' : undefined}
                              rel={item.external ? 'noopener noreferrer' : undefined}
                              onClick={() => setProductsOpen(false)}
                              className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-ink/5 transition-colors duration-150"
                            >
                              <span className="mt-0.5 w-6 h-6 rounded-md bg-ink/6 border border-line flex items-center justify-center flex-shrink-0 text-ink-dull group-hover:text-ink group-hover:border-line-hi transition-colors">
                                {item.icon}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-ink leading-none mb-1 flex items-center gap-1">
                                  {item.label}
                                  <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                </p>
                                <p className="text-[11px] text-ink-dull leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-line-sub px-5 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-ink-ghost tracking-wide">Built by OY Labs</span>
                      <a
                        href="https://klair.pro"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setProductsOpen(false)}
                        className="text-[11px] text-ink-dull hover:text-ink flex items-center gap-1 transition-colors"
                      >
                        Visit Klair
                        <ArrowUpRight size={10} />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            {PLAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-ink-dim hover:text-ink text-sm tracking-wide transition-colors py-3 border-b border-line-sub"
              >
                {link.label}
              </Link>
            ))}

            {/* Shopify accordion */}
            <div className="border-b border-line-sub">
              <button
                onClick={() => setMobileShopifyOpen((v) => !v)}
                className="w-full flex items-center justify-between text-ink-dim hover:text-ink text-sm tracking-wide transition-colors py-3"
              >
                Shopify Apps
                <motion.svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  animate={{ rotate: mobileShopifyOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="opacity-50"
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>
              <AnimatePresence>
                {mobileShopifyOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-3 pl-3 flex flex-col gap-1">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-ink-ghost py-1.5 font-semibold">Apps</p>
                      {SHOPIFY_MEGA[0].items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setMobileOpen(false); setMobileShopifyOpen(false); }}
                          className="flex items-center gap-2 py-2 text-ink-dim hover:text-ink text-sm transition-colors"
                        >
                          <span className="text-ink-dull">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Products accordion */}
            <div className="border-b border-line-sub">
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between text-ink-dim hover:text-ink text-sm tracking-wide transition-colors py-3"
              >
                Products
                <motion.svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  animate={{ rotate: mobileProductsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="opacity-50"
                >
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>
              <AnimatePresence>
                {mobileProductsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-3 pl-3 flex flex-col gap-1">
                      <p className="text-[10px] tracking-[0.18em] uppercase text-ink-ghost py-1.5 font-semibold">Apps</p>
                      {PRODUCTS_MEGA[0].items.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          onClick={() => { setMobileOpen(false); setMobileProductsOpen(false); }}
                          className="flex items-center gap-2 py-2 text-ink-dim hover:text-ink text-sm transition-colors"
                        >
                          <span className="text-ink-dull">{item.icon}</span>
                          {item.label}
                          <ArrowUpRight size={10} className="opacity-40 ml-0.5" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
