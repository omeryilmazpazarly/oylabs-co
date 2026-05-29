'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PortfolioItem, MainCategory } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import TiltCard from './effects/TiltCard';
import { CATEGORY_COLORS, COVER_GRADIENTS } from '@/lib/portfolioConstants';

export { CATEGORY_COLORS, COVER_GRADIENTS };

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;
const EASE   = { type: 'spring', stiffness: 90,  damping: 22, mass: 0.8 } as const;

type FilterKey = 'ALL' | MainCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',                   label: 'All'                  },
  { key: 'WEBSITES',              label: 'Websites'             },
  { key: 'APPS_PLUGINS',          label: 'Apps & Plugins'       },
  { key: 'SYSTEM_IMPLEMENTATION', label: 'System Implementation'},
  { key: 'MOBILE_APPS',           label: 'Mobile Apps'          },
];

function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  const cardRef   = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<React.CSSProperties>({});
  const accent = CATEGORY_COLORS[item.mainCategory];

  /* Scroll reveal — smooth both ways */
  const isInView = useInView(revealRef, { margin: '-60px 0px', once: false });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setGlow({
      background: `radial-gradient(320px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, ${accent}22, transparent 65%)`,
    });
  }, [accent]);

  return (
    /* Outer div drives scroll-reveal opacity/y */
    <motion.div
      ref={revealRef}
      initial={{ opacity: 0, y: 44, scale: 0.96 }}
      animate={isInView
        ? { opacity: 1, y: 0,  scale: 1    }
        : { opacity: 0, y: 44, scale: 0.96 }}
      transition={{ ...EASE, delay: index * 0.06 }}
    >
      <TiltCard maxTilt={7} scaleOnHover={1.02}>
        <Link href={`/portfolio/${item.id}`} className="block">
          {/* Inner motion.div handles layout/filter-change animation only */}
          <motion.div
            ref={cardRef}
            layout
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={SPRING}
            onMouseMove={onMove}
            onMouseLeave={() => setGlow({})}
            className="relative group rounded-2xl border border-[#222] bg-[#111] overflow-hidden hover:border-[#333] transition-colors duration-300 cursor-pointer"
          >
            {/* Mouse glow */}
            <div className="absolute inset-0 pointer-events-none z-10 transition-all duration-200" style={glow} />

            {/* Shimmer border sweep on hover */}
            <div
              className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 180deg at 50% 50%, transparent 60%, ${accent}55 80%, transparent 100%)` }}
            />
            <div className="absolute inset-[1px] rounded-2xl bg-[#111] z-[1]" />

            {/* Card content */}
            <div className="relative z-[2]">
              {/* Cover */}
              <div className={`relative h-52 bg-gradient-to-br ${COVER_GRADIENTS[item.mainCategory]} overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-32 h-32 rounded-3xl border opacity-10" style={{ borderColor: accent }} />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-20 h-20 rounded-2xl border opacity-20" style={{ borderColor: accent }} />
                  <div className="w-9 h-9 rounded-xl opacity-30" style={{ background: accent }} />
                </div>
                <div className="absolute top-4 left-4 text-xs font-mono tracking-widest text-white/20">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full font-medium tracking-wide"
                  style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
                  {CATEGORY_LABELS[item.mainCategory]}
                </div>
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#111] to-transparent" />
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <ArrowUpRight size={16} className="flex-shrink-0 text-[#71717a] opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                </div>
                <p className="text-sm text-[#71717a] leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-xs text-[#71717a] border border-[#1e1e1e] rounded px-2 py-0.5 bg-[#0a0a0a] tracking-wide group-hover:border-[#2a2a2a] transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-[#71717a] group-hover:text-white transition-colors duration-200">
                  View Case Study
                  <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const filtered = activeFilter === 'ALL' ? items : items.filter((i) => i.mainCategory === activeFilter);

  return (
    <div>
      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="flex flex-wrap gap-2 mb-10"
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 ${
              activeFilter === f.key
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-[#71717a] border-[#222] hover:border-[#444] hover:text-white'
            }`}
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span className={`ml-1.5 text-[10px] ${activeFilter === f.key ? 'text-black/50' : 'text-[#3f3f46]'}`}>
                {items.filter((i) => i.mainCategory === f.key).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <PortfolioCard key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 text-[#3f3f46] text-sm">
          No projects in this category yet.
        </motion.div>
      )}
    </div>
  );
}
