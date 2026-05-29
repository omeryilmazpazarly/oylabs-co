'use client';

import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;
const VP     = { once: false, margin: '-80px' } as const;

export default function WorkSectionHeader() {
  return (
    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ ...SPRING, delay: 0 }}
          className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium"
        >
          Selected Work
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ ...SPRING, delay: 0.07 }}
          className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white"
        >
          Recent <span className="text-[#71717a]">Projects</span>
        </motion.h2>
      </div>

      <motion.a
        href="/portfolio"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={VP}
        transition={{ ...SPRING, delay: 0.12 }}
        className="text-sm text-[#71717a] hover:text-white tracking-wide transition-colors border-b border-[#333] pb-0.5 hover:border-white whitespace-nowrap"
      >
        View all projects →
      </motion.a>
    </div>
  );
}
