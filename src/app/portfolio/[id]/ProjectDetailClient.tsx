'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import { CATEGORY_LABELS } from '@/types/portfolio';
import { CATEGORY_COLORS, COVER_GRADIENTS } from '@/lib/portfolioConstants';
import TiltCard from '@/components/effects/TiltCard';
import MagneticButton from '@/components/effects/MagneticButton';
import Footer from '@/components/Footer';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

interface Props {
  item:     PortfolioItem;
  related:  PortfolioItem[];
  nextItem: PortfolioItem;
}

export default function ProjectDetailClient({ item, related, nextItem }: Props) {
  const accent = CATEGORY_COLORS[item.mainCategory];

  return (
    <>
      <div className="min-h-screen bg-[#000]">

        {/* ── Hero cover ─────────────────────────────────────────────── */}
        <div className={`relative h-[55vh] min-h-[400px] bg-gradient-to-br ${COVER_GRADIENTS[item.mainCategory]} overflow-hidden`}>
          {/* Ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
            style={{ background: `radial-gradient(ellipse, ${accent}70 0%, transparent 70%)`, filter: 'blur(72px)' }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Rotating rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute w-64 h-64 rounded-full border opacity-[0.12]" style={{ borderColor: accent }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute w-44 h-44 rounded-full border opacity-[0.18]" style={{ borderColor: accent }} />
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl opacity-40" style={{ background: accent }} />
          </div>

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
            <span
              className="text-xs px-3 py-1.5 rounded-full font-medium tracking-widest uppercase"
              style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
            >
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
          </div>

          {/* Two-column */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-16 pt-16">

            {/* LEFT */}
            <div className="space-y-14">

              {/* Overview */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-4">
                  Project Overview
                </p>
                <p className="text-[#a1a1aa] leading-[1.85] text-[17px]">{item.longDescription}</p>
              </div>

              {/* Tech stack */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-5">
                  Technology Stack
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="group relative inline-block px-4 py-2 rounded-xl border border-[#222] bg-[#0d0d0d] text-sm text-white font-medium tracking-wide hover:border-[#333] transition-colors cursor-default overflow-hidden"
                    >
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                        style={{ background: `radial-gradient(circle at center, ${accent}14, transparent 70%)` }}
                      />
                      <span className="relative z-10">{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <p className="text-[10px] text-[#71717a] tracking-[0.3em] uppercase font-medium mb-5">
                  Delivery Highlights
                </p>
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
                {[
                  { label: 'Category', value: CATEGORY_LABELS[item.mainCategory] },
                  { label: 'Domain',   value: item.tags[0] ?? '—' },
                  { label: 'Stack',    value: `${item.tags.length} technologies` },
                  { label: 'Status',   value: 'Delivered ✓' },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4 flex items-center justify-between gap-4">
                    <span className="text-[11px] text-[#3f3f46] tracking-widest uppercase">{label}</span>
                    <span className="text-sm text-white font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Accent divider */}
              <div className="h-px" style={{ background: `linear-gradient(90deg, ${accent}50, transparent)` }} />

              {/* CTA */}
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
                <p className="text-xs text-[#71717a] leading-relaxed mb-4">
                  Interested in a similar system for your business?
                </p>
                <MagneticButton className="w-full">
                  <Link
                    href="/#contact"
                    className="group flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-colors"
                  >
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
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(400px at 50% 50%, ${ra}09, transparent)` }}
                          />
                          <span
                            className="inline-block text-xs px-2.5 py-1 rounded-full font-medium tracking-wide mb-3"
                            style={{ backgroundColor: `${ra}18`, color: ra, border: `1px solid ${ra}25` }}
                          >
                            {CATEGORY_LABELS[rel.mainCategory]}
                          </span>
                          <h3 className="text-base font-semibold text-white tracking-tight leading-snug mb-2">
                            {rel.title}
                          </h3>
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
