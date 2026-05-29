'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

const MARQUEE_ITEMS = [
  'Systems Architecture',
  'Serverless Automation',
  'Mobile Applications',
  'API Engineering',
  'E-Commerce Platforms',
  'Cloud Infrastructure',
  'Zoho Integration',
  'Headless Commerce',
];

function container(delay = 0) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
  };
}

function fadeUp(i = 0) {
  return {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: i * 0.05 } },
  };
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

      <motion.div
        variants={container(0.2)}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp(0)} className="inline-flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#222] bg-[#111] text-xs text-[#71717a] tracking-widest uppercase font-medium">
            <Zap size={11} className="text-white" />
            Technical Systems Architecture
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp(1)}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6"
        >
          <span className="block text-white">We Build</span>
          <span className="block text-white">Systems That</span>
          <span className="block bg-gradient-to-r from-white via-[#d4d4d8] to-[#71717a] bg-clip-text text-transparent">
            Scale.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp(2)}
          className="text-lg md:text-xl text-[#71717a] max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Custom web and mobile applications, serverless automation workflows, and enterprise system
          integrations — engineered for velocity and built to last.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp(3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/portfolio"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all duration-200 active:scale-95"
          >
            View Our Work
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/#contact"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-[#333] bg-transparent text-white text-sm font-medium tracking-wide hover:border-[#555] hover:bg-white/4 transition-all duration-200"
          >
            Start a Project
          </Link>
        </motion.div>

        {/* Stats row */}
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
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#111] overflow-hidden py-4 bg-gradient-to-r from-[#000] via-transparent to-[#000]">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-xs text-[#3f3f46] tracking-[0.3em] uppercase font-medium">
              {item}
              <span className="ml-12 text-[#222]">◆</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
