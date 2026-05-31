'use client';

import { useRef } from 'react';
import {
  motion, useMotionValue, useSpring, useTransform,
  MotionValue,
} from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import GradientOrbs from './effects/GradientOrbs';
import MagneticButton from './effects/MagneticButton';

const EASE = [0.16, 1, 0.3, 1] as const;

function fadeUp(delay = 0) {
  return {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };
}

const STACK = [
  {
    title:  'Carmen Perfumes',
    client: 'carmenperfumes.ae',
    type:   'Shopify Store',
    accent: '#0ea5e9',
    image:  'https://omeryilmaz.xyz/uploads/project-1769553834432-78891718.jpg',
  },
  {
    title:  'Liberty Pack',
    client: 'libertypack.qa',
    type:   'E-commerce',
    accent: '#10b981',
    image:  'https://omeryilmaz.xyz/uploads/project-1769553807042-8096702.png',
  },
  {
    title:  'Lase Tech',
    client: 'lasetech.com',
    type:   'Framer Site',
    accent: '#7c3aed',
    image:  'https://omeryilmaz.xyz/uploads/project-1769553818706-277315509.png',
  },
];

const MARQUEE = [
  'Systems Architecture', 'Serverless Automation', 'Mobile Applications',
  'API Engineering', 'E-Commerce Platforms', 'Cloud Infrastructure',
  'Zoho Integration', 'Headless Commerce',
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-16">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--_grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--_grid-line) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <GradientOrbs />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,255,255,0.04), transparent)' }} />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-10 lg:gap-16 items-center">

            {/* Left */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            >
              <motion.p variants={fadeUp(0)}
                className="text-[11px] text-ink-dull tracking-[0.28em] uppercase mb-8 select-none">
                Technical Agency&nbsp;&nbsp;·&nbsp;&nbsp;Shopify Partner
              </motion.p>

              <motion.h1
                variants={fadeUp(1)}
                className="font-bold tracking-tight leading-[0.93] mb-6"
                style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
              >
                <span className="block text-ink-dim">We Build</span>
                <span className="block text-ink-dim">Systems That</span>
                <span className="block text-ink" style={{ fontSize: '1.12em' }}>Scale.</span>
              </motion.h1>

              <motion.p variants={fadeUp(2)}
                className="text-base sm:text-lg text-ink-dim leading-relaxed mb-9"
                style={{ maxWidth: '52ch' }}>
                Custom web and mobile applications, serverless automation
                workflows, and enterprise system integrations — engineered
                for velocity and built to last.
              </motion.p>

              <motion.div variants={fadeUp(3)}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
                <MagneticButton>
                  <Link href="/portfolio"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-opacity duration-200 active:scale-95">
                    View Our Work
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-line-hi text-ink text-sm font-medium tracking-wide hover:border-ink-dull transition-colors duration-200"
                    style={{ backgroundColor: 'var(--_overlay)' }}>
                    Start a Project
                  </Link>
                </MagneticButton>
              </motion.div>

              <motion.div variants={fadeUp(4)}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-dull">
                {['50+ projects delivered', '12+ enterprise clients', '99.9% uptime SLA'].map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-ink-dull/50" />
                    {s}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — interactive card stack */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className="hidden lg:block"
            >
              <CardStack />
            </motion.div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--_page), transparent)' }} />

      <div className="relative z-10 border-t border-line-sub overflow-hidden py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="text-xs text-ink-faint tracking-[0.3em] uppercase font-medium">
              {item}<span className="ml-12 text-ink-ghost">◆</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Interactive 3-D card stack ───────────────────────────────── */
function CardStack() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Normalised mouse offset: ±0.5 relative to container centre */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  /* Spring-smooth for weighted, physical feel */
  const cfg = { stiffness: 85, damping: 18, mass: 0.9 };
  const sX  = useSpring(rawX, cfg);
  const sY  = useSpring(rawY, cfg);

  /* Whole-stack 3-D tilt */
  const rotateY = useTransform(sX, [-0.5, 0.5], [-10,  10]);
  const rotateX = useTransform(sY, [-0.5, 0.5], [  7,  -7]);

  /* Per-depth parallax: front card moves most */
  const pFX = useTransform(sX, [-0.5, 0.5], [-22, 22]);
  const pFY = useTransform(sY, [-0.5, 0.5], [-14, 14]);
  const pMX = useTransform(sX, [-0.5, 0.5], [-10, 10]);
  const pMY = useTransform(sY, [-0.5, 0.5], [ -6,  6]);
  const pBX = useTransform(sX, [-0.5, 0.5], [ -4,  4]);
  const pBY = useTransform(sY, [-0.5, 0.5], [ -2,  2]);

  /* Glare — radial highlight that chases the cursor on the front card */
  const glareX = useTransform(sX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(sY, [-0.5, 0.5], [0, 100]);
  const glareBg = useTransform(
    [glareX, glareY] as MotionValue<number>[],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.09) 0%, transparent 58%)`,
  );

  /* Chips float on a separate plane — opposite direction */
  const chipRX = useTransform(sX, [-0.5, 0.5], [ 16, -16]);
  const chipRY = useTransform(sY, [-0.5, 0.5], [ 10, -10]);
  const chipLX = useTransform(sX, [-0.5, 0.5], [-12,  12]);
  const chipLY = useTransform(sY, [-0.5, 0.5], [ -8,   8]);

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left  - rect.width  / 2) / rect.width);
    rawY.set((e.clientY - rect.top   - rect.height / 2) / rect.height);
  }
  function onMouseLeave() { rawX.set(0); rawY.set(0); }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative select-none cursor-default"
      style={{ height: 380, perspective: 1000 }}
    >
      {/* Tilting wrapper */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* Back card */}
        <motion.div style={{ x: pBX, y: pBY, zIndex: 1 }}
          className="absolute inset-x-10 top-10">
          <PreviewCard project={STACK[2]} />
        </motion.div>

        {/* Mid card */}
        <motion.div style={{ x: pMX, y: pMY, zIndex: 2 }}
          className="absolute inset-x-5 top-5">
          <PreviewCard project={STACK[1]} />
        </motion.div>

        {/* Front card — with glare */}
        <motion.div style={{ x: pFX, y: pFY, zIndex: 3 }}
          className="absolute inset-x-0 top-0">
          <PreviewCard project={STACK[0]} featured glareBg={glareBg} />
        </motion.div>
      </motion.div>

      {/* Context chips — floating in front of the stack */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
        style={{
          x: chipRX, y: chipRY,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        className="absolute -right-4 top-20 z-20 flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-panel/95 shadow-md"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse flex-shrink-0" />
        <span className="text-[11px] font-medium text-ink-dim whitespace-nowrap">All systems live</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 1.1 }}
        style={{
          x: chipLX, y: chipLY,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        className="absolute -left-4 bottom-8 z-20 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-line bg-panel/95 shadow-md"
      >
        <div className="w-5 h-5 rounded-md bg-[#0ea5e9]/15 border border-[#0ea5e9]/25 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] text-[#0ea5e9] font-bold leading-none">↑</span>
        </div>
        <div>
          <p className="text-[11px] font-medium text-ink leading-none">Carmen Perfumes</p>
          <p className="text-[10px] text-ink-dull mt-0.5 leading-none">Deployed 3 days ago</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Single preview card ──────────────────────────────────────── */
function PreviewCard({
  project,
  featured = false,
  glareBg,
}: {
  project: (typeof STACK)[number];
  featured?: boolean;
  glareBg?: MotionValue<string>;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border:     `1px solid ${featured ? 'var(--_line-hi)' : 'var(--_line)'}`,
        background: 'var(--_panel)',
        boxShadow:  featured
          ? '0 24px 64px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.35)'
          : '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="relative overflow-hidden" style={{ height: 178 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.image} alt={project.title}
          className="w-full h-full object-cover" />

        {/* Gradient scrim */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />

        {/* Specular glare — front card only, follows mouse */}
        {featured && glareBg && (
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: glareBg }} />
        )}

        {/* Type badge */}
        <div
          className="absolute top-3 right-3 text-[10px] font-medium px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter:  'blur(8px)',
            border:          '1px solid rgba(255,255,255,0.11)',
            color:           'rgba(255,255,255,0.85)',
          }}
        >
          {project.type}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--_line-sub)' }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{project.title}</p>
          <p className="text-[11px] text-ink-dull mt-0.5 truncate">{project.client}</p>
        </div>
        <span className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.accent }} />
      </div>
    </div>
  );
}
