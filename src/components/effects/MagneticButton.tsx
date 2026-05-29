'use client';

import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/* Mercury-style: button subtly "magnetises" toward the cursor when nearby.
   High damping kills oscillation; displacement is capped so it never dances. */
export default function MagneticButton({ children, className = '', strength = 0.18 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Heavily damped spring — snaps back without bouncing
  const x = useSpring(0, { stiffness: 140, damping: 30, mass: 0.5 });
  const y = useSpring(0, { stiffness: 140, damping: 30, mass: 0.5 });

  const MAX_PX = 7; // hard ceiling so wide buttons can't travel far

  function clamp(v: number) {
    return Math.max(-MAX_PX, Math.min(MAX_PX, v));
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    x.set(clamp(dx * strength));
    y.set(clamp(dy * strength));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
