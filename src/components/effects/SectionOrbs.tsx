'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* Same parallax-on-cursor logic as GradientOrbs but gentler — these sit behind
   dense content sections so the influence is halved. */

type Variant = 'indigo-teal' | 'violet-amber' | 'teal-violet';

const PRESETS: Record<
  Variant,
  {
    color: string;
    size: number;
    base: { x: string; y: string };
    drift: { x: string[]; y: string[] };
    dur: number;
    /* How many px the orb shifts at full cursor deflection */
    strength: number;
    /* false = follows cursor, true = counter-drifts */
    counter: boolean;
  }[]
> = {
  'indigo-teal': [
    {
      color: 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 70%)',
      size: 520, dur: 28, strength: 38, counter: false,
      base:  { x: '8%',  y: '15%' },
      drift: { x: ['8%', '15%', '5%', '8%'],  y: ['15%', '28%', '8%', '15%'] },
    },
    {
      color: 'radial-gradient(ellipse, rgba(20,184,166,0.07) 0%, transparent 70%)',
      size: 440, dur: 36, strength: 28, counter: true,
      base:  { x: '75%', y: '25%' },
      drift: { x: ['75%', '65%', '78%', '75%'], y: ['25%', '12%', '38%', '25%'] },
    },
  ],
  'violet-amber': [
    {
      color: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
      size: 500, dur: 30, strength: 35, counter: false,
      base:  { x: '12%', y: '20%' },
      drift: { x: ['12%', '20%', '8%', '12%'],  y: ['20%', '35%', '10%', '20%'] },
    },
    {
      color: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
      size: 400, dur: 38, strength: 24, counter: true,
      base:  { x: '70%', y: '60%' },
      drift: { x: ['70%', '60%', '74%', '70%'], y: ['60%', '45%', '70%', '60%'] },
    },
  ],
  'teal-violet': [
    {
      color: 'radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)',
      size: 480, dur: 32, strength: 32, counter: false,
      base:  { x: '5%',  y: '50%' },
      drift: { x: ['5%',  '14%', '3%',  '5%'],  y: ['50%', '38%', '62%', '50%'] },
    },
    {
      color: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)',
      size: 420, dur: 26, strength: 22, counter: true,
      base:  { x: '80%', y: '20%' },
      drift: { x: ['80%', '70%', '82%', '80%'], y: ['20%', '32%', '10%', '20%'] },
    },
  ],
};

/* One component per orb — needed so each can call its own useTransform */
function Orb({
  orb,
  sX,
  sY,
}: {
  orb: (typeof PRESETS)[Variant][number];
  sX: ReturnType<typeof useSpring>;
  sY: ReturnType<typeof useSpring>;
}) {
  const half  = orb.strength;
  const sign  = orb.counter ? 1 : -1;

  const ox = useTransform(sX, [0, 1], [sign * half, -sign * half]);
  const oy = useTransform(sY, [0, 1], [sign * half * 0.7, -sign * half * 0.7]);

  return (
    <motion.div
      initial={{ x: orb.base.x, y: orb.base.y }}
      animate={{ x: orb.drift.x, y: orb.drift.y }}
      transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        x: ox, y: oy,
        width:      orb.size,
        height:     orb.size,
        background: orb.color,
        filter:     'blur(80px)',
        translateX: '-50%',
        translateY: '-50%',
      }}
      className="absolute"
    />
  );
}

export default function SectionOrbs({ variant = 'indigo-teal' }: { variant?: Variant }) {
  const curX = useMotionValue(0.5);
  const curY = useMotionValue(0.5);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      curX.set(e.clientX / window.innerWidth);
      curY.set(e.clientY / window.innerHeight);
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [curX, curY]);

  /* Slower springs than GradientOrbs — these are background elements */
  const sX = useSpring(curX, { stiffness: 22, damping: 24, mass: 2.5 });
  const sY = useSpring(curY, { stiffness: 22, damping: 24, mass: 2.5 });

  const orbs = PRESETS[variant];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {orbs.map((orb, i) => (
        <Orb key={i} orb={orb} sX={sX} sY={sY} />
      ))}
    </div>
  );
}
