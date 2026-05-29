'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GradientOrbs from './effects/GradientOrbs';
import MagneticButton from './effects/MagneticButton';
import TextScramble from './effects/TextScramble';

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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 snap-start">
      {/* Linear-style grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Mercury/Linear-style drifting orbs */}
      <GradientOrbs />

      {/* Radial vignette on top of orbs */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,rgba(255,255,255,0.05),transparent)]" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#000] to-transparent pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Eyebrow chip */}
        <motion.div variants={fadeUp(0)} className="inline-flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#222] bg-[#111]/80 backdrop-blur-sm text-xs text-[#71717a] tracking-widest uppercase font-medium">
            Technical Systems Architecture
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={fadeUp(1)}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-bold tracking-tight leading-[0.95] mb-6"
        >
          <span className="block text-white">We Build</span>
          <span className="block text-white">Systems That</span>
          {/* Mercury-style gradient text */}
          <span className="block bg-gradient-to-r from-white via-[#a1a1aa] to-[#52525b] bg-clip-text text-transparent pb-2">
            Scale.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp(2)}
          className="text-lg md:text-xl text-[#71717a] max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Custom web and mobile applications, serverless automation workflows, and enterprise
          system integrations — engineered for velocity and built to last.
        </motion.p>

        {/* CTAs with magnetic effect */}
        <motion.div variants={fadeUp(3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton>
            <Link
              href="/portfolio"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-colors duration-200 active:scale-95"
            >
              View Our Work
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link
              href="/#contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#333] bg-transparent text-white text-sm font-medium tracking-wide hover:border-[#555] hover:bg-white/[0.04] transition-all duration-200"
            >
              Start a Project
            </Link>
          </MagneticButton>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={fadeUp(4)}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto border-t border-[#1a1a1a] pt-10"
        >
          {[
            { value: '50+', label: 'Projects Delivered' },
            { value: '12+', label: 'Enterprise Clients' },
            { value: '99.9%', label: 'Uptime SLA' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-[#71717a] tracking-wide mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scrolling marquee */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#111]/80 overflow-hidden py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-xs text-[#2a2a2a] tracking-[0.3em] uppercase font-medium">
              {item}
              <span className="ml-12 text-[#1a1a1a]">◆</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
