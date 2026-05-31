'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GradientOrbs from './effects/GradientOrbs';
import MagneticButton from './effects/MagneticButton';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

const MARQUEE_ITEMS = [
  'Systems Architecture', 'Serverless Automation', 'Mobile Applications',
  'API Engineering', 'E-Commerce Platforms', 'Cloud Infrastructure',
  'Zoho Integration', 'Headless Commerce',
];

function fadeUp(delay = 0) {
  return {
    hidden:  { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { ...SPRING, delay } },
  };
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 px-4 sm:px-6 snap-start">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--_grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--_grid-line) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <GradientOrbs />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,rgba(255,255,255,0.05),transparent)]" />
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--_page), transparent)' }} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
        className="relative z-10 max-w-5xl mx-auto px-0 text-center"
      >
        <motion.div variants={fadeUp(0)} className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-panel/80 backdrop-blur-sm text-[10px] sm:text-xs text-ink-dim tracking-widest uppercase font-medium">
            Technical Systems Architecture
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold tracking-wider"
            style={{ backgroundColor: 'rgba(0,128,96,0.18)', color: '#00c48c', border: '1px solid rgba(0,196,140,0.28)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c48c] animate-pulse" />
            Shopify Partner
          </div>
        </motion.div>

        <motion.h1
          variants={fadeUp(1)}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] font-bold tracking-tight leading-[0.95] mb-5 sm:mb-6"
        >
          <span className="block text-ink">We Build</span>
          <span className="block text-ink">Systems That</span>
          <span className="block bg-gradient-to-r from-ink via-ink-dim to-ink-dull bg-clip-text text-transparent pb-2">
            Scale.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp(2)}
          className="text-base sm:text-lg md:text-xl text-ink-dim max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12"
        >
          Custom web and mobile applications, serverless automation workflows, and enterprise
          system integrations — engineered for velocity and built to last.
        </motion.p>

        <motion.div variants={fadeUp(3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton>
            <Link
              href="/portfolio"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-colors duration-200 active:scale-95"
            >
              View Our Work
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link
              href="/#contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-line-hi text-ink text-sm font-medium tracking-wide hover:border-ink-dull transition-all duration-200"
              style={{ backgroundColor: 'var(--_overlay)' }}
            >
              Start a Project
            </Link>
          </MagneticButton>
        </motion.div>

        <motion.div
          variants={fadeUp(4)}
          className="mt-12 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto border-t border-line-sub pt-8 sm:pt-10"
        >
          {[
            { value: '50+', label: 'Projects Delivered' },
            { value: '12+', label: 'Enterprise Clients' },
            { value: '99.9%', label: 'Uptime SLA' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-ink tracking-tight">{stat.value}</div>
              <div className="text-xs text-ink-dim tracking-wide mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-line-sub overflow-hidden py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
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
