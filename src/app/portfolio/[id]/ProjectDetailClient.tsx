'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, ArrowUpRight,
  Globe, Building2, Play, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import { CATEGORY_COLORS, COVER_GRADIENTS } from '@/lib/portfolioConstants';
import TiltCard from '@/components/effects/TiltCard';
import MagneticButton from '@/components/effects/MagneticButton';
import Footer from '@/components/Footer';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;
const SLIDE  = { type: 'spring', stiffness: 300, damping: 34, mass: 0.8 } as const;

interface Props {
  item:     PortfolioItem;
  related:  PortfolioItem[];
  nextItem: PortfolioItem;
}

/* ── Lightbox ────────────────────────────────────────────────────────── */
function Lightbox({
  images, startIndex, onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [dir,   setDir]   = useState(0);

  const goNext = useCallback(() => {
    setDir(1); setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setDir(-1); setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  /* Keyboard navigation */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  goNext();
      if (e.key === 'ArrowLeft')   goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goNext, goPrev]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center:             () => ({ x: 0, opacity: 1 }),
    exit:   (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-[#333] text-[#71717a] hover:text-white hover:border-[#555] transition-all bg-black/60"
      >
        <X size={16} />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-[#71717a] tracking-widest tabular-nums">
        {index + 1} / {images.length}
      </div>

      {/* Prev arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-4 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-[#333] text-[#71717a] hover:text-white hover:border-[#555] transition-all bg-black/60"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Image */}
      <div
        className="relative w-full max-w-5xl mx-16 aspect-video overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.img
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SLIDE}
            src={images[index]}
            alt={`Screenshot ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Next arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-[#333] text-[#71717a] hover:text-white hover:border-[#555] transition-all bg-black/60"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setDir(i > index ? 1 : -1); setIndex(i); }}
            className="h-1.5 rounded-full transition-all duration-300 focus:outline-none"
            style={{ width: i === index ? 24 : 6, background: i === index ? '#fff' : '#444' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function ProjectDetailClient({ item, related, nextItem }: Props) {
  const accent = CATEGORY_COLORS[item.mainCategory];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={item.images}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#000]">

        {/* ── Hero cover ─────────────────────────────────────────────── */}
        <div className={`relative h-[55vh] min-h-[400px] overflow-hidden ${item.coverImage ? '' : `bg-gradient-to-br ${COVER_GRADIENTS[item.mainCategory]}`}`}>

          {item.coverImage && (
            <img src={item.coverImage} alt={item.title}
              className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {!item.coverImage && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
                style={{ background: `radial-gradient(ellipse, ${accent}70 0%, transparent 70%)`, filter: 'blur(72px)' }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-64 h-64 rounded-full border opacity-[0.12]" style={{ borderColor: accent }} />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-44 h-44 rounded-full border opacity-[0.18]" style={{ borderColor: accent }} />
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl opacity-40" style={{ background: accent }} />
              </div>
            </>
          )}

          {/* Breadcrumb */}
          <div className="absolute top-28 left-0 right-0 px-6 max-w-7xl mx-auto">
            <Link href="/portfolio"
              className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-white transition-colors tracking-wide group">
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              Portfolio
            </Link>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-8 left-0 right-0 px-6 max-w-7xl mx-auto">
            <span className="text-xs px-3 py-1.5 rounded-full font-medium tracking-widest uppercase"
              style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}>
              {CATEGORY_LABELS[item.mainCategory]}
            </span>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#000] to-transparent pointer-events-none" />
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pb-24">

          {/* Title block */}
          <div className="pt-12 pb-16 border-b border-[#111]">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl">
              {item.title}
            </h1>
            <p className="mt-5 text-xl text-[#71717a] max-w-2xl leading-relaxed">
              {item.description}
            </p>

            {/* Client + Live Preview */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {item.clientName && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Building2 size={14} className="text-[#3f3f46]" />
                  <span className="text-[#3f3f46] tracking-widest uppercase text-[10px] font-medium">Client</span>
                  {item.websiteUrl ? (
                    <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-1 text-white font-medium hover:text-[#a1a1aa] transition-colors">
                      {item.clientName}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-white font-medium">{item.clientName}</span>
                  )}
                </div>
              )}
              {item.clientName && item.liveUrl && <span className="w-1 h-1 rounded-full bg-[#2a2a2a]" />}
              {item.liveUrl && (
                <a href={item.liveUrl} target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium tracking-wide transition-all duration-200 hover:bg-white hover:text-black hover:border-white"
                  style={{ borderColor: `${accent}60`, color: accent }}>
                  <Play size={11} className="fill-current" />
                  Live Preview
                  <ArrowUpRight size={12} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              )}
            </div>
          </div>

          {/* Two-column */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-16 pt-16">

            {/* LEFT */}
            <div className="space-y-14">

              {/* Overview */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-4">Project Overview</p>
                <p className="text-[#a1a1aa] leading-[1.85] text-[17px]">{item.longDescription}</p>
              </div>

              {/* Tech stack */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-5">Technology Stack</p>
                <div className="flex flex-wrap gap-2.5">
                  {item.tags.map((tag) => (
                    <span key={tag}
                      className="group relative inline-block px-4 py-2 rounded-xl border border-[#222] bg-[#0d0d0d] text-sm text-white font-medium tracking-wide hover:border-[#333] transition-colors cursor-default overflow-hidden">
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                        style={{ background: `radial-gradient(circle at center, ${accent}14, transparent 70%)` }} />
                      <span className="relative z-10">{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Gallery — click opens lightbox */}
              {item.images && item.images.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-5">Project Gallery</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxIndex(i)}
                        className="group relative rounded-xl overflow-hidden border border-[#1a1a1a] hover:border-[#333] transition-colors aspect-video block bg-[#0d0d0d] w-full"
                      >
                        <img
                          src={src}
                          alt={`${item.title} screenshot ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                        {/* Expand icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-white" />
                          </div>
                        </div>
                        {/* Index chip */}
                        <div className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-white/40 tracking-widest">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-5">Delivery Highlights</p>
                <div className="space-y-4">
                  {[
                    'Production-grade architecture with full system documentation',
                    'Zero-downtime deployment pipeline established from day one',
                    'Performance benchmarked and validated pre-launch across all metrics',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-[9px] flex-shrink-0" style={{ background: accent }} />
                      <p className="text-[#71717a] leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT sidebar */}
            <aside className="space-y-5">

              {/* Meta card */}
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] divide-y divide-[#141414] overflow-hidden">

                {/* Category */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#3f3f46] tracking-widest uppercase shrink-0">Category</span>
                  <span className="text-sm text-white font-medium text-right">{CATEGORY_LABELS[item.mainCategory]}</span>
                </div>

                {/* Year */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#3f3f46] tracking-widest uppercase shrink-0">Year</span>
                  <span className="text-sm text-white font-medium text-right">
                    {new Date(item.createdAt).getFullYear()}
                  </span>
                </div>

                {/* Scope */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#3f3f46] tracking-widest uppercase shrink-0">Scope</span>
                  <span className="text-sm text-white font-medium text-right">
                    {{
                      WEBSITES:              'Full Build',
                      APPS_PLUGINS:          'Custom Development',
                      SYSTEM_IMPLEMENTATION: 'System Integration',
                      MOBILE_APPS:           'Mobile Build',
                    }[item.mainCategory]}
                  </span>
                </div>

                {/* Built with — actual tag pills */}
                {item.tags.length > 0 && (
                  <div className="px-5 py-4">
                    <span className="text-[11px] text-[#3f3f46] tracking-widest uppercase block mb-3">Built with</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2.5 py-1 rounded-md font-medium tracking-wide border"
                          style={{ backgroundColor: `${accent}12`, color: accent, borderColor: `${accent}30` }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accent divider */}
              <div className="h-px" style={{ background: `linear-gradient(90deg, ${accent}50, transparent)` }} />

              {/* Visit Website only (Live Preview is already in title block) */}
              {item.websiteUrl && (
                <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 w-full px-4 py-3 rounded-xl border border-[#222] bg-[#0d0d0d] text-sm text-[#a1a1aa] hover:text-white hover:border-[#333] transition-all">
                  <Globe size={14} className="flex-shrink-0" style={{ color: accent }} />
                  <span className="flex-1 truncate">Visit Website</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              )}

              {/* CTA */}
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
                <p className="text-xs text-[#71717a] leading-relaxed mb-4">
                  Interested in a similar system for your business?
                </p>
                <MagneticButton className="w-full">
                  <Link href="/#contact"
                    className="group flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-colors">
                    Start a Project
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </MagneticButton>
              </div>

              <p className="text-[11px] text-[#2a2a2a] leading-relaxed px-1">
                OY Labs Ltd — all projects delivered to production standard with full handoff documentation.
              </p>
            </aside>
          </div>

          {/* ── Related ────────────────────────────────────────────────── */}
          {(related.length > 0 || nextItem) && (
            <div className="mt-24 pt-16 border-t border-[#111]">
              <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-10">
                {related.length > 0 ? 'Related Projects' : 'Next Project'}
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {(related.length > 0 ? related : [nextItem]).map((rel) => {
                  const ra = CATEGORY_COLORS[rel.mainCategory];
                  return (
                    <TiltCard key={rel.id} maxTilt={5}>
                      <Link href={`/portfolio/${rel.id}`}>
                        <div className="group relative rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6 hover:border-[#2a2a2a] transition-all duration-300 overflow-hidden">
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(400px at 50% 50%, ${ra}09, transparent)` }} />
                          <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium tracking-wide mb-3"
                            style={{ backgroundColor: `${ra}18`, color: ra, border: `1px solid ${ra}25` }}>
                            {CATEGORY_LABELS[rel.mainCategory]}
                          </span>
                          <h3 className="text-base font-semibold text-white tracking-tight leading-snug mb-2">{rel.title}</h3>
                          <p className="text-xs text-[#71717a] line-clamp-2 mb-4">{rel.description}</p>
                          <span className="inline-flex items-center gap-1 text-xs text-[#71717a] group-hover:text-white transition-colors">
                            View Case Study <ArrowUpRight size={11} />
                          </span>
                        </div>
                      </Link>
                    </TiltCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
