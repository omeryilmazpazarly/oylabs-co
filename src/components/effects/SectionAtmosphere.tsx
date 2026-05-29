'use client';

import { motion } from 'framer-motion';

/*
 * SectionAtmosphere — gives each section a distinct colour identity.
 *
 * Three layers (all absolutely-positioned, pointer-events-none):
 *  1. Top-edge bloom   — a wide radial gradient that radiates DOWN from the
 *                        section border; immediately visible when you scroll in.
 *  2. Ambient orbs     — two large blurred blobs that drift slowly.
 *  3. Background tint  — an almost-invisible colour wash (~1.5 % opacity).
 *
 * Usage:
 *   <section className="relative overflow-hidden ...">
 *     <SectionAtmosphere theme="services" />
 *     <div className="relative z-10">…</div>
 *   </section>
 *
 * The component assumes the parent has  position:relative  and
 * overflow:hidden  (both needed to clip the large blobs).
 */

export type AtmosphereTheme = 'services' | 'work' | 'techstack' | 'contact';

interface ThemeDef {
  /** Hex colour used for the top-edge bloom line and bloom glow */
  primary:   string;
  /** Secondary colour for the second orb */
  secondary: string;
  /** Very-low-opacity rgba used as background wash */
  tint:      string;
}

const THEMES: Record<AtmosphereTheme, ThemeDef> = {
  services: {
    primary:   '#6366f1',   // indigo
    secondary: '#06b6d4',   // cyan
    tint:      'rgba(99,102,241,0.018)',
  },
  work: {
    primary:   '#8b5cf6',   // violet
    secondary: '#f59e0b',   // amber
    tint:      'rgba(139,92,246,0.018)',
  },
  techstack: {
    primary:   '#14b8a6',   // teal
    secondary: '#a78bfa',   // purple
    tint:      'rgba(20,184,166,0.018)',
  },
  contact: {
    primary:   '#f97316',   // orange
    secondary: '#fb7185',   // rose
    tint:      'rgba(249,115,22,0.015)',
  },
};

interface Props {
  theme: AtmosphereTheme;
  /** Show a coloured top-edge line + bloom (default true).
   *  Set false if the parent already renders its own border. */
  showTopEdge?: boolean;
}

export default function SectionAtmosphere({ theme, showTopEdge = true }: Props) {
  const t = THEMES[theme];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

      {/* 1 ─ Background colour wash */}
      <div className="absolute inset-0" style={{ background: t.tint }} />

      {/* 2 ─ Top-edge bloom (border line + radial glow downward) */}
      {showTopEdge && (
        <>
          {/* The glowing 1-px border line */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{
              background: `linear-gradient(90deg,
                transparent 0%,
                ${t.primary}55 20%,
                ${t.primary}99 50%,
                ${t.primary}55 80%,
                transparent 100%)`,
            }}
          />
          {/* Wide radial bloom that pours down from that line */}
          <div
            className="absolute top-0 inset-x-0"
            style={{
              height: 320,
              background: `radial-gradient(ellipse 75% 320px at 50% 0px, ${t.primary}1a, transparent 70%)`,
            }}
          />
        </>
      )}

      {/* 3 ─ Primary orb — upper-left drift */}
      <motion.div
        animate={{
          x: ['0%',  '4%',  '-2%', '0%'],
          y: ['0%',  '6%',  '-3%', '0%'],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '25%', left: '5%',
          width: 640, height: 640,
          background: `radial-gradient(ellipse, ${t.primary}1f 0%, transparent 68%)`,
          filter: 'blur(90px)',
        }}
      />

      {/* 4 ─ Secondary orb — lower-right drift */}
      <motion.div
        animate={{
          x: ['0%', '-5%',  '3%', '0%'],
          y: ['0%',  '-4%', '5%', '0%'],
        }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '60%', left: '80%',
          width: 520, height: 520,
          background: `radial-gradient(ellipse, ${t.secondary}18 0%, transparent 68%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* 5 ─ Subtle accent spot — top-right corner */}
      <motion.div
        animate={{
          x: ['0%', '-3%', '2%', '0%'],
          y: ['0%',  '4%', '-3%','0%'],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '15%', left: '88%',
          width: 380, height: 380,
          background: `radial-gradient(ellipse, ${t.primary}12 0%, transparent 68%)`,
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
}
