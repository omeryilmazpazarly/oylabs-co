'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* Each orb tracks the cursor with a different spring — heavier orbs lag further
   behind, creating a sense of depth. Some counter-drift (negative range) for
   a more alive, non-uniform feel. */
export default function GradientOrbs() {
  /* Normalised cursor 0→1 across the viewport */
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

  /* Three different spring configs — lightest chases hardest, heaviest barely moves */
  const fast   = { stiffness: 50,  damping: 30, mass: 1.2 };
  const mid    = { stiffness: 28,  damping: 26, mass: 2.0 };
  const slow   = { stiffness: 16,  damping: 22, mass: 3.2 };

  const sXf = useSpring(curX, fast);  const sYf = useSpring(curY, fast);
  const sXm = useSpring(curX, mid);   const sYm = useSpring(curY, mid);
  const sXs = useSpring(curX, slow);  const sYs = useSpring(curY, slow);

  /* Pixel offsets added on top of the ambient position.
     Odd orbs follow, even orbs counter-drift. */
  const o1x = useTransform(sXf, [0, 1], [-55, 55]);
  const o1y = useTransform(sYf, [0, 1], [-40, 40]);

  const o2x = useTransform(sXm, [0, 1], [40, -40]);   /* counter */
  const o2y = useTransform(sYm, [0, 1], [30, -30]);   /* counter */

  const o3x = useTransform(sXs, [0, 1], [-28, 28]);
  const o3y = useTransform(sYs, [0, 1], [-20, 20]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>

      {/* Orb 1 — indigo, top-left */}
      <motion.div
        initial={{ x: '10%',  y: '5%'  }}
        animate={{ x: ['10%', '18%', '8%',  '10%'], y: ['5%',  '15%', '0%',  '5%']  }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          x: o1x, y: o1y,
          width: 700, height: 700,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute"
      />

      {/* Orb 2 — teal, top-right */}
      <motion.div
        initial={{ x: '65%', y: '20%' }}
        animate={{ x: ['65%', '55%', '70%', '65%'], y: ['20%', '8%',  '30%', '20%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          x: o2x, y: o2y,
          width: 600, height: 600,
          background: 'radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute"
      />

      {/* Orb 3 — violet, bottom-center */}
      <motion.div
        initial={{ x: '40%', y: '60%' }}
        animate={{ x: ['40%', '48%', '35%', '40%'], y: ['60%', '52%', '68%', '60%'] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          x: o3x, y: o3y,
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, transparent 70%)',
          filter: 'blur(60px)',
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="absolute"
      />

    </div>
  );
}
