'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Globe, Cpu, Puzzle, Smartphone } from 'lucide-react';
import type { PortfolioItem, MainCategory } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import TiltCard from './effects/TiltCard';
import { CATEGORY_COLORS, COVER_GRADIENTS } from '@/lib/portfolioConstants';

export { CATEGORY_COLORS, COVER_GRADIENTS };

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

/* Short label + icon shown on the card badge */
const CATEGORY_BADGE: Record<MainCategory, { label: string; Icon: React.FC<{ size?: number }> }> = {
  SYSTEM_IMPLEMENTATION: { label: 'Integration',  Icon: Cpu        },
  WEBSITES:              { label: 'Website',       Icon: Globe      },
  APPS_PLUGINS:          { label: 'App / Plugin',  Icon: Puzzle     },
  MOBILE_APPS:           { label: 'Mobile App',    Icon: Smartphone },
};
const SLIDE  = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 } as const;

const CARDS_PER_PAGE = 3;

type FilterKey = 'ALL' | MainCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',                   label: 'All'                  },
  { key: 'WEBSITES',              label: 'Websites'             },
  { key: 'APPS_PLUGINS',          label: 'Apps & Plugins'       },
  { key: 'SYSTEM_IMPLEMENTATION', label: 'System Implementation'},
  { key: 'MOBILE_APPS',           label: 'Mobile Apps'          },
];

/* ── Single card ─────────────────────────────────────────────────────── */
function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<React.CSSProperties>({});
  const accent = CATEGORY_COLORS[item.mainCategory];

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setGlow({
      background: `radial-gradient(320px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, ${accent}22, transparent 65%)`,
    });
  }, [accent]);

  return (
    /* Staggered fade-up on card entry */
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.07 }}
    >
      <TiltCard maxTilt={7} scaleOnHover={1.02}>
        <Link href={`/portfolio/${item.id}`} className="block">
          <motion.div
            ref={cardRef}
            layout
            onMouseMove={onMove}
            onMouseLeave={() => setGlow({})}
            className="relative group rounded-2xl border border-line bg-panel overflow-hidden hover:border-line-hi transition-colors duration-300 cursor-pointer"
          >
            {/* Mouse glow */}
            <div className="absolute inset-0 pointer-events-none z-10 transition-all duration-200" style={glow} />

            {/* Shimmer border sweep on hover */}
            <div
              className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `conic-gradient(from 180deg at 50% 50%, transparent 60%, ${accent}55 80%, transparent 100%)` }}
            />
            <div className="absolute inset-[1px] rounded-2xl bg-panel z-[1]" />

            <div className="relative z-[2]">
              {/* Cover */}
              <div className={`relative h-44 sm:h-52 bg-gradient-to-br ${COVER_GRADIENTS[item.mainCategory]} overflow-hidden`}>
                {/* Real cover photo — shown when available */}
                {item.coverImage && (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Animated placeholder — shown only when no cover image */}
                {!item.coverImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                      className="absolute w-32 h-32 rounded-3xl border opacity-10" style={{ borderColor: accent }} />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                      className="absolute w-20 h-20 rounded-2xl border opacity-20" style={{ borderColor: accent }} />
                    <div className="w-9 h-9 rounded-xl opacity-30" style={{ background: accent }} />
                  </div>
                )}
                {/* Dark scrim so badges are always legible over photos */}
                {item.coverImage && (
                  <div className="absolute inset-0 bg-black/30" />
                )}
                {/* Overlay badges — always shown on top */}
                <div className="absolute top-3.5 left-3.5 text-[10px] font-mono tracking-widest text-white/40 drop-shadow-md tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </div>
                {/* Category badge — icon + short label, accent-tinted glassy pill */}
                {(() => {
                  const { label, Icon } = CATEGORY_BADGE[item.mainCategory];
                  return (
                    <div
                      className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide backdrop-blur-md"
                      style={{
                        backgroundColor: `${accent}22`,
                        border: `1px solid ${accent}55`,
                        color: accent,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      <Icon size={11} />
                      {label}
                    </div>
                  );
                })()}
                <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, var(--_panel), transparent)' }} />
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-ink tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <ArrowUpRight size={16} className="flex-shrink-0 text-ink-dim opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                </div>
                <p className="text-sm text-ink-dim leading-relaxed mb-4 line-clamp-2">{item.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium rounded-md px-2.5 py-1 tracking-wide transition-all duration-200"
                      style={{
                        backgroundColor: `${accent}0f`,
                        border: `1px solid ${accent}28`,
                        color: `${accent}cc`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-dim group-hover:text-ink transition-colors duration-200">
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

/* ── Main grid (carousel or full) ───────────────────────────────────── */
export default function PortfolioGrid({
  items,
  carousel = true,
}: {
  items: PortfolioItem[];
  carousel?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [page,      setPage]      = useState(0);
  const [direction, setDirection] = useState(1);
  const dragStartX = useRef(0);

  const filtered   = activeFilter === 'ALL' ? items : items.filter((i) => i.mainCategory === activeFilter);
  const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
  const visible    = filtered.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  /* Reset to page 0 whenever the filter changes */
  useEffect(() => { setPage(0); setDirection(1); }, [activeFilter]);

  /* Infinite loop — wraps around */
  function goNext() { setDirection(1);  setPage((p) => (p + 1) % totalPages); }
  function goPrev() { setDirection(-1); setPage((p) => (p - 1 + totalPages) % totalPages); }
  function goTo(i: number) { setDirection(i > page ? 1 : -1); setPage(i); }

  /* Drag / swipe handlers */
  function onDragStart(e: React.PointerEvent) { dragStartX.current = e.clientX; }
  function onDragEnd(e: React.PointerEvent) {
    const delta = e.clientX - dragStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
  }

  /* Slide variants — direction drives which side items enter/exit from */
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ?  60 : -60, opacity: 0 }),
    center:              () => ({ x: 0,                   opacity: 1 }),
    exit:   (dir: number) => ({ x: dir > 0 ? -60 :  60, opacity: 0 }),
  };

  /* ── Filter pill bar (shared between both modes) ─────────────── */
  const FilterBar = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="flex gap-2 mb-10 overflow-x-auto pb-0.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {FILTERS.map((f) => {
        const isActive  = activeFilter === f.key;
        const accent    = f.key !== 'ALL' ? CATEGORY_COLORS[f.key as MainCategory] : null;
        const count     = f.key !== 'ALL' ? items.filter((i) => i.mainCategory === f.key).length : null;

        const style: React.CSSProperties = accent
          ? isActive
            ? { backgroundColor: `${accent}18`, borderColor: `${accent}55`, color: accent }
            : { backgroundColor: 'transparent', borderColor: `${accent}30`, color: `${accent}99` }
          : {};

        const baseClass =
          'flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide border transition-all duration-200 whitespace-nowrap cursor-pointer';

        const neutralClass = !accent
          ? isActive
            ? 'bg-ink/8 border-ink/25 text-ink'
            : 'bg-transparent border-line text-ink-dim hover:border-line-hi hover:text-ink'
          : isActive
            ? 'hover:opacity-90'
            : 'hover:opacity-80';

        return (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`${baseClass} ${neutralClass}`}
            style={style}
          >
            {/* Coloured dot for category filters */}
            {accent && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: isActive ? accent : `${accent}70` }}
              />
            )}
            {f.label}
            {count !== null && (
              <span
                className="text-[10px] tabular-nums font-normal"
                style={{ color: accent ? (isActive ? `${accent}aa` : `${accent}55`) : undefined }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </motion.div>
  );

  /* ── Full grid mode (portfolio page) ────────────────────────── */
  if (!carousel) {
    return (
      <div>
        {FilterBar}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, i) => (
            <PortfolioCard key={item.id} item={item} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 text-ink-dull text-sm">
            No projects in this category yet.
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div>
      {FilterBar}

      {/* Carousel — drag/swipe to navigate */}
      <div
        className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${activeFilter}-${page}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SLIDE}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {visible.map((item, i) => (
              <PortfolioCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination — only shown if there's more than 1 page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-10">

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative h-1.5 rounded-full transition-all duration-300 focus:outline-none"
                style={{ width: i === page ? 28 : 6, background: i === page ? 'var(--_ink)' : 'var(--_line-hi)' }}
                aria-label={`Page ${i + 1}`}
              />
            ))}
            <span className="ml-3 text-[11px] text-ink-dull tracking-widest tabular-nums">
              {page + 1} / {totalPages}
            </span>
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-hi transition-all duration-200"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={goNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-line text-ink-dim hover:text-ink hover:border-line-hi transition-all duration-200"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 text-ink-dull text-sm">
          No projects in this category yet.
        </motion.div>
      )}
    </div>
  );
}
