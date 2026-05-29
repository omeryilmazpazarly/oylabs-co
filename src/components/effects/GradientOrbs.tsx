'use client';

import { motion } from 'framer-motion';

/* Linear-style: slow-drifting blurred colour orbs in the hero background.
   Each orb has a random drift path looped forever with slightly different timings. */
const ORBS = [
  {
    color: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
    size: 700,
    initial: { x: '10%',  y: '5%'  },
    animate: { x: ['10%', '18%', '8%',  '10%'], y: ['5%',  '15%', '0%',  '5%']  },
    duration: 22,
  },
  {
    color: 'radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 70%)',
    size: 600,
    initial: { x: '65%', y: '20%' },
    animate: { x: ['65%', '55%', '70%', '65%'], y: ['20%', '8%',  '30%', '20%'] },
    duration: 28,
  },
  {
    color: 'radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, transparent 70%)',
    size: 500,
    initial: { x: '40%', y: '60%' },
    animate: { x: ['40%', '48%', '35%', '40%'], y: ['60%', '52%', '68%', '60%'] },
    duration: 34,
  },
];

export default function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          initial={orb.initial}
          animate={orb.animate}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            width:  orb.size,
            height: orb.size,
            background: orb.color,
            filter: 'blur(60px)',
          }}
        />
      ))}
    </div>
  );
}
