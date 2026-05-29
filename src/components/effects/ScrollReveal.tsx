'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

type Dir = 'up' | 'down' | 'left' | 'right' | 'scale';

interface Props {
  children: React.ReactNode;
  delay?:     number;
  direction?: Dir;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}

import type { TargetAndTransition } from 'framer-motion';

/* Hidden state per direction */
const HIDDEN: Record<Dir, TargetAndTransition> = {
  up:    { opacity: 0, y:  44, scale: 0.97 },
  down:  { opacity: 0, y: -28               },
  left:  { opacity: 0, x: -36               },
  right: { opacity: 0, x:  28               },
  scale: { opacity: 0, scale: 0.88          },
};
const VISIBLE = { opacity: 1, y: 0, x: 0, scale: 1 };

const EASE = { type: 'spring', stiffness: 90, damping: 22, mass: 0.8 } as const;

/*
 * Wraps children in a motion.div that:
 *  - animates IN (hidden → visible) when the element enters the viewport
 *  - animates OUT (visible → hidden) when the element leaves the viewport
 *
 * Uses useInView (not whileInView) so BOTH directions have a real transition.
 */
export default function ScrollReveal({
  children,
  delay     = 0,
  direction = 'up',
  className = '',
}: Props) {
  const ref      = useRef<HTMLDivElement>(null);
  /* margin: slightly shrink the effective viewport so the animation fires
     just after the element becomes visible, not right at the edge */
  const isInView = useInView(ref, { margin: '-72px 0px', once: false });

  return (
    <motion.div
      ref={ref}
      initial={HIDDEN[direction]}
      animate={isInView ? VISIBLE : HIDDEN[direction]}
      transition={{ ...EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
