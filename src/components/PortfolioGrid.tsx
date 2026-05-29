'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioItem, MainCategory } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

type FilterKey = 'ALL' | MainCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'WEBSITES', label: 'Websites' },
  { key: 'APPS_PLUGINS', label: 'Apps & Plugins' },
  { key: 'SYSTEM_IMPLEMENTATION', label: 'System Implementation' },
  { key: 'MOBILE_APPS', label: 'Mobile Apps' },
];

const CATEGORY_COLORS: Record<MainCategory, string> = {
  SYSTEM_IMPLEMENTATION: '#7c3aed',
  WEBSITES: '#0ea5e9',
  APPS_PLUGINS: '#10b981',
  MOBILE_APPS: '#f59e0b',
};

const COVER_GRADIENTS: Record<MainCategory, string> = {
  SYSTEM_IMPLEMENTATION: 'from-[#1a0a2e] via-[#0f0f1a] to-[#111]',
  WEBSITES: 'from-[#0a1a2e] via-[#0f0f1a] to-[#111]',
  APPS_PLUGINS: 'from-[#0a2e1a] via-[#0f0f1a] to-[#111]',
  MOBILE_APPS: 'from-[#2e1a0a] via-[#0f0f1a] to-[#111]',
};

function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlowStyle({
      background: `radial-gradient(350px circle at ${x}px ${y}px, ${CATEGORY_COLORS[item.mainCategory]}18, transparent 65%)`,
    });
  }, [item.mainCategory]);

  const handleMouseLeave = useCallback(() => setGlowStyle({}), []);

  const accentColor = CATEGORY_COLORS[item.mainCategory];

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 10 }}
      transition={SPRING}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative group rounded-2xl border border-[#222] bg-[#111] overflow-hidden cursor-default hover:border-[#333] transition-all duration-300"
    >
      {/* Mouse glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-300 z-10" style={glowStyle} />

      {/* Cover mockup area */}
      <div className={`relative h-52 bg-gradient-to-br ${COVER_GRADIENTS[item.mainCategory]} overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-24 h-24 rounded-2xl border border-current" style={{ color: accentColor }} />
          <div className="absolute w-16 h-16 rounded-xl border border-current" style={{ color: accentColor }} />
          <div className="absolute w-8 h-8 rounded-lg bg-current opacity-40" style={{ color: accentColor }} />
        </div>
        {/* Number overlay */}
        <div className="absolute top-4 left-4 text-xs font-mono tracking-widest text-white/20">
          {String(index + 1).padStart(2, '0')}
        </div>
        {/* Category badge */}
        <div
          className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full font-medium tracking-wide"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
        >
          {CATEGORY_LABELS[item.mainCategory]}
        </div>
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <h3 className="text-base font-semibold text-white tracking-tight mb-2 group-hover:text-white transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-sm text-[#71717a] leading-relaxed mb-4 line-clamp-2">{item.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-[#71717a] border border-[#1e1e1e] rounded px-2 py-0.5 bg-[#0a0a0a] tracking-wide group-hover:border-[#2a2a2a] transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const filtered =
    activeFilter === 'ALL' ? items : items.filter((item) => item.mainCategory === activeFilter);

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 text-[#3f3f46] text-sm"
        >
          No projects in this category yet.
        </motion.div>
      )}
    </div>
  );
}
