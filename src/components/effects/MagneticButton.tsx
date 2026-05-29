'use client';

import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/* Mercury-style: button subtly "magnetises" toward the cursor when nearby.
   Gives a tactile, alive feel to primary CTAs. */
export default function MagneticButton({ children, className = '', strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x   = useSpring(0, { stiffness: 180, damping: 14, mass: 0.5 });
  const y   = useSpring(0, { stiffness: 180, damping: 14, mass: 0.5 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
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
