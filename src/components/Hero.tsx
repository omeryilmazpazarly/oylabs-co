'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import GradientOrbs from './effects/GradientOrbs';
import MagneticButton from './effects/MagneticButton';

const EASE = [0.16, 1, 0.3, 1] as const;

function fadeUp(delay = 0) {
  return {
    hidden:  { opacity: 0, y: 28 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.7, ease: EASE, delay },
    },
  };
}

/* Real project cover images already in the database */
const STACK = [
  {
    title:    'Carmen Perfumes',
    client:   'carmenperfumes.ae',
    type:     'Shopify Store',
    accent:   '#0ea5e9',
    image:    'https://omeryilmaz.xyz/uploads/project-1769553834432-78891718.jpg',
  },
  {
    title:    'Liberty Pack',
    client:   'libertypack.qa',
    type:     'E-commerce',
    accent:   '#10b981',
    image:    'https://omeryilmaz.xyz/uploads/project-1769553807042-8096702.png',
  },
  {
    title:    'Lase Tech',
    client:   'lasetech.com',
    type:     'Framer Site',
    accent:   '#7c3aed',
    image:    'https://omeryilmaz.xyz/uploads/project-1769553818706-277315509.png',
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

      {/* Background */}
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

      {/* ── Main two-column content ─────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px] gap-10 lg:gap-16 items-center">

            {/* ── Left: headline + copy + CTAs ───────────────────── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            >
              <motion.p variants={fadeUp(0)}
                className="text-[11px] text-ink-dull tracking-[0.28em] uppercase mb-8 select-none">
                Technical Agency&nbsp;&nbsp;·&nbsp;&nbsp;Shopify Partner
              </motion.p>

              {/*
                Headline: "We Build" and "Systems That" carry the setup;
                "Scale." lands as the payload — larger, full white, period
                makes it definitive. No gradient; emphasis through size + color.
              */}
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
                  <Link
                    href="/portfolio"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-opacity duration-200 active:scale-95"
                  >
                    View Our Work
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link
                    href="/#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-line-hi text-ink text-sm font-medium tracking-wide hover:border-ink-dull transition-colors duration-200"
                    style={{ backgroundColor: 'var(--_overlay)' }}
                  >
                    Start a Project
                  </Link>
                </MagneticButton>
              </motion.div>

              {/* Social proof — prose, not big-number template */}
              <motion.div variants={fadeUp(4)}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-dull">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-ink-dull/60" />
                  50+ projects delivered
                </span>
                <span className="text-line hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-ink-dull/60" />
                  12+ enterprise clients
                </span>
                <span className="text-line hidden sm:inline">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-ink-dull/60" />
                  99.9% uptime SLA
                </span>
              </motion.div>
            </motion.div>

            {/* ── Right: stacked project preview cards ───────────── */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
              className="relative hidden lg:block"
              style={{ height: 360 }}
            >
              {/* Back card */}
              <div className="absolute inset-x-10 top-10"
                style={{ transform: 'rotate(-5deg)', transformOrigin: 'center bottom', zIndex: 1 }}>
                <PreviewCard project={STACK[2]} />
              </div>

              {/* Mid card */}
              <div className="absolute inset-x-5 top-5"
                style={{ transform: 'rotate(-2.5deg)', transformOrigin: 'center bottom', zIndex: 2 }}>
                <PreviewCard project={STACK[1]} />
              </div>

              {/* Front card — floats gently */}
              <motion.div
                className="absolute inset-x-0 top-0"
                style={{ zIndex: 3 }}
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <PreviewCard project={STACK[0]} featured />
              </motion.div>

              {/* "Live" status chip — top right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
                className="absolute -right-5 top-20 z-10 flex items-center gap-2 px-3 py-2 rounded-xl border border-line bg-panel/95 shadow-sm"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-medium text-ink-dim whitespace-nowrap">All systems live</span>
              </motion.div>

              {/* Recent delivery chip — bottom left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 1.1 }}
                className="absolute -left-5 bottom-6 z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-line bg-panel/95 shadow-sm"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <div className="w-5 h-5 rounded-md bg-[#0ea5e9]/15 border border-[#0ea5e9]/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-[#0ea5e9] font-bold">↑</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-ink leading-none">Carmen Perfumes</p>
                  <p className="text-[10px] text-ink-dull mt-0.5 leading-none">Deployed 3 days ago</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--_page), transparent)' }} />

      {/* Marquee strip */}
      <div className="relative z-10 border-t border-line-sub overflow-hidden py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="text-xs text-ink-faint tracking-[0.3em] uppercase font-medium">
              {item}
              <span className="ml-12 text-ink-ghost">◆</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Preview card ─────────────────────────────────────────────── */
function PreviewCard({
  project,
  featured = false,
}: {
  project: (typeof STACK)[number];
  featured?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${featured ? 'var(--_line-hi)' : 'var(--_line)'}`,
        background: 'var(--_panel)',
        boxShadow: featured
          ? '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Cover image */}
      <div className="relative overflow-hidden" style={{ height: 176 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />

        {/* Type badge — dark glass, clean */}
        <div
          className="absolute top-3 right-3 text-[10px] font-medium px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.11)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {project.type}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ borderTop: `1px solid var(--_line-sub)` }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{project.title}</p>
          <p className="text-[11px] text-ink-dull mt-0.5 truncate">{project.client}</p>
        </div>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.accent }}
        />
      </div>
    </div>
  );
}
