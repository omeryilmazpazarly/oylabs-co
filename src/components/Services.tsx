'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Package, Code2, Workflow, Building2, Cloud,
  ChevronLeft, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import SectionAtmosphere from './effects/SectionAtmosphere';
import ScrollReveal from './effects/ScrollReveal';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;
const SLIDE  = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 } as const;

const CARDS_PER_PAGE = 3;

interface Service {
  icon:        React.ReactNode;
  label:       string;
  title:       string;
  description: string;
  tags:        string[];
  badge?:      string; // optional highlight badge on the card
}

const SERVICES: Service[] = [
  {
    icon:        <ShoppingCart size={22} />,
    label:       '01',
    title:       'E-Commerce Engineering',
    description: 'Headless Shopify storefronts and high-performance WordPress/WooCommerce architectures — conversion-optimised, mobile-first, and built for scale.',
    tags:        ['Shopify', 'Headless Commerce', 'WooCommerce', 'Next.js', 'PWA'],
    badge:       'Shopify Partner',
  },
  {
    icon:        <Package size={22} />,
    label:       '02',
    title:       'Custom Shopify Apps',
    description: 'Private and public Shopify apps engineered to extend store functionality — custom admin UIs, Shopify Functions, checkout extensions, and webhook integrations.',
    tags:        ['Shopify API', 'Shopify Functions', 'Checkout Extensions', 'Admin UI'],
    badge:       'Shopify Partner',
  },
  {
    icon:        <Code2 size={22} />,
    label:       '03',
    title:       'WordPress Plugins & Themes',
    description: 'Bespoke WordPress plugins, custom themes, and WooCommerce extensions — built to exact specification with clean architecture and long-term maintainability.',
    tags:        ['WordPress', 'WooCommerce', 'Custom Plugins', 'PHP', 'ACF'],
  },
  {
    icon:        <Workflow size={22} />,
    label:       '04',
    title:       'Workflow Orchestration',
    description: 'End-to-end process automation connecting disparate systems via intelligent serverless pipelines — n8n, webhooks, and custom API bridges.',
    tags:        ['n8n', 'Zapier', 'Webhooks', 'REST APIs'],
  },
  {
    icon:        <Building2 size={22} />,
    label:       '05',
    title:       'Enterprise Automation',
    description: 'Full-stack Zoho One implementations unifying CRM, ERP, finance, and operations into a single high-availability instance.',
    tags:        ['Zoho One', 'CRM', 'ERP', 'Finance'],
  },
  {
    icon:        <Cloud size={22} />,
    label:       '06',
    title:       'Cloud Infrastructure',
    description: 'Serverless and containerised deployments on AWS and Cloudflare — designed for elastic scale and zero-downtime CI/CD pipelines.',
    tags:        ['AWS Lambda', 'Cloudflare Workers', 'Docker', 'CI/CD'],
  },
];

/* ── Single service card ─────────────────────────────────────────────── */
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setGlowStyle({
      background: `radial-gradient(400px circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, rgba(255,255,255,0.06), transparent 70%)`,
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.07 }}
      className="h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setGlowStyle({})}
        className="relative group rounded-2xl border border-[#222] bg-[#111] p-8 overflow-hidden cursor-default h-full flex flex-col hover:border-[#333] transition-colors duration-300"
      >
        {/* Mouse glow */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-300" style={glowStyle} />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />

        <div className="relative z-10 flex flex-col flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white group-hover:border-[#333] transition-colors">
                {service.icon}
              </div>
              <span className="text-xs text-[#3f3f46] font-mono tracking-widest">{service.label}</span>
            </div>
            <ArrowUpRight size={16} className="text-[#3f3f46] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{service.title}</h3>
          <p className="text-sm text-[#71717a] leading-relaxed mb-6 flex-1">{service.description}</p>

          {/* Shopify Partner badge */}
          {service.badge && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(0,128,96,0.15)', color: '#00c48c', border: '1px solid rgba(0,196,140,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c]" />
                {service.badge}
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <span key={tag} className="text-xs text-[#71717a] border border-[#222] rounded-md px-2.5 py-1 bg-[#0a0a0a] tracking-wide group-hover:border-[#333] transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Carousel ────────────────────────────────────────────────────────── */
export default function Services() {
  const [page,      setPage]      = useState(0);
  const [direction, setDirection] = useState(1);

  const totalPages = Math.ceil(SERVICES.length / CARDS_PER_PAGE);
  const visible    = SERVICES.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  function goNext() {
    if (page >= totalPages - 1) return;
    setDirection(1); setPage((p) => p + 1);
  }
  function goPrev() {
    if (page <= 0) return;
    setDirection(-1); setPage((p) => p - 1);
  }
  function goTo(i: number) {
    setDirection(i > page ? 1 : -1); setPage(i);
  }

  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ?  60 : -60, opacity: 0 }),
    center:              () => ({ x: 0,                   opacity: 1 }),
    exit:   (dir: number) => ({ x: dir > 0 ? -60 :  60, opacity: 0 }),
  };

  return (
    <section id="systems" className="relative min-h-screen py-32 px-6 overflow-hidden flex flex-col justify-center snap-start">
      <SectionAtmosphere theme="services" />
      <div className="relative z-10 max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="mb-16 space-y-2">
          <ScrollReveal direction="down">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Core Capabilities</span>
              {/* Shopify Partner badge */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(0,128,96,0.15)', color: '#00c48c', border: '1px solid rgba(0,196,140,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c] animate-pulse" />
                Shopify Partner
              </span>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.07}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              What We <span className="text-[#71717a]">Engineer</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.13}>
            <p className="text-[#71717a] max-w-xl leading-relaxed pt-2">
              Six specialisation domains — from custom Shopify apps and WordPress plugins to enterprise automation — each built to production-grade standards.
            </p>
          </ScrollReveal>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {visible.map((service, i) => (
                <ServiceCard key={service.label} service={service} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-10">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative h-1.5 rounded-full transition-all duration-300 focus:outline-none"
                  style={{ width: i === page ? 28 : 6, background: i === page ? '#fff' : '#333' }}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
              <span className="ml-3 text-[11px] text-[#3f3f46] tracking-widest tabular-nums">
                {page + 1} / {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goPrev} disabled={page === 0}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
                <ChevronLeft size={15} />
              </button>
              <button onClick={goNext} disabled={page >= totalPages - 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#222] text-[#71717a] hover:text-white hover:border-[#444] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
