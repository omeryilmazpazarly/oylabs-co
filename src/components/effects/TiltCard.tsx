'use client';

import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scaleOnHover?: number;
}

/* Mercury-style: 3D perspective tilt that follows the cursor inside the card.
   Uses Framer Motion springs so the tilt snaps back with physics. */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 9,
  scaleOnHover = 1.025,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useSpring(0, { stiffness: 140, damping: 20, mass: 0.6 });
  const rotateY = useSpring(0, { stiffness: 140, damping: 20, mass: 0.6 });
  const scale   = useSpring(1,  { stiffness: 140, damping: 20, mass: 0.6 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    rotateY.set( dx * maxTilt);
    rotateX.set(-dy * maxTilt);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, scale, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseEnter={() => scale.set(scaleOnHover)}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}
