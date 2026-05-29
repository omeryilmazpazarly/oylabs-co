'use client';

import { motion } from 'framer-motion';

/* Subtle ambient colour orbs for non-hero sections.
   Same concept as GradientOrbs in the hero, but lower opacity and slower drift
   so they don't compete with the content. */

type Variant = 'indigo-teal' | 'violet-amber' | 'teal-violet';

const PRESETS: Record<Variant, { color: string; size: number; from: { x: string; y: string }; path: { x: string[]; y: string[] }; dur: number }[]> = {
  'indigo-teal': [
    {
      color: 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 70%)',
      size: 520,
      from: { x: '8%',  y: '15%' },
      path: { x: ['8%', '15%', '5%', '8%'],  y: ['15%', '28%', '8%', '15%']  },
      dur: 28,
    },
    {
      color: 'radial-gradient(ellipse, rgba(20,184,166,0.07) 0%, transparent 70%)',
      size: 440,
      from: { x: '75%', y: '25%' },
      path: { x: ['75%', '65%', '78%', '75%'], y: ['25%', '12%', '38%', '25%'] },
      dur: 36,
    },
  ],
  'violet-amber': [
    {
      color: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
      size: 500,
      from: { x: '12%', y: '20%' },
      path: { x: ['12%', '20%', '8%', '12%'],  y: ['20%', '35%', '10%', '20%'] },
      dur: 30,
    },
    {
      color: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
      size: 400,
      from: { x: '70%', y: '60%' },
      path: { x: ['70%', '60%', '74%', '70%'], y: ['60%', '45%', '70%', '60%'] },
      dur: 38,
    },
  ],
  'teal-violet': [
    {
      color: 'radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)',
      size: 480,
      from: { x: '5%',  y: '50%' },
      path: { x: ['5%',  '14%', '3%',  '5%'],  y: ['50%', '38%', '62%', '50%'] },
      dur: 32,
    },
    {
      color: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)',
      size: 420,
      from: { x: '80%', y: '20%' },
      path: { x: ['80%', '70%', '82%', '80%'], y: ['20%', '32%', '10%', '20%'] },
      dur: 26,
    },
  ],
};

interface Props {
  variant?: Variant;
}

export default function SectionOrbs({ variant = 'indigo-teal' }: Props) {
  const orbs = PRESETS[variant];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          initial={{ x: orb.from.x, y: orb.from.y }}
          animate={{ x: orb.path.x, y: orb.path.y }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            width:      orb.size,
            height:     orb.size,
            background: orb.color,
            filter:     'blur(80px)',
          }}
        />
      ))}
    </div>
  );
}
