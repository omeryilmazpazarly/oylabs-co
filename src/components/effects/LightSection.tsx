'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/*
 * Mercury-style scroll-driven light section.
 *
 * Key design decisions:
 *  - offset ['start end', 'end start'] = full enter-to-exit viewport range.
 *    This gives the maximum possible scroll distance for the transition.
 *  - NO useSpring — springs add lag, making the color change happen AFTER
 *    you scroll instead of WITH your scroll. Direct MotionValue is the right
 *    primitive for scroll-linked effects.
 *  - Peak whiteness at progress 0.5 = when section is vertically centred.
 *  - Content uses dark text so it "materialises" as the white arrives.
 */
export default function LightSection({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],   // full range: first pixel enters → last pixel leaves
  });

  // Ramp: dark → white centred on the section → dark
  // Using RGB strings for reliable Framer Motion colour interpolation
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [
      'rgb(0,   0,   0)',
      'rgb(0,   0,   0)',
      'rgb(247, 247, 248)',
      'rgb(0,   0,   0)',
      'rgb(0,   0,   0)',
    ]
  );

  return (
    <motion.div ref={ref} style={{ backgroundColor }} className={className}>
      {children}
    </motion.div>
  );
}
