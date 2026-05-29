'use client';

import { useRef } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { usePageLightness } from '@/contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/*
 * Invisible wrapper — no background of its own.
 * Watches its scroll position and writes a 0–1 lightness value into the
 * global ThemeContext. PageBackground then paints that colour on document.body
 * so the ENTIRE viewport (including the navbar) transitions together.
 */
export default function LightSection({ children, className = '' }: Props) {
  const ref   = useRef<HTMLDivElement>(null);
  const lightness = usePageLightness();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // full enter-to-exit range
  });

  // Triangle wave — peak at centre (section fully in view)
  const sectionLightness = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0,  0,    1,   0,    0]
  );

  // Push to global — PageBackground + Navbar both react to this
  useMotionValueEvent(sectionLightness, 'change', (v) => {
    lightness.set(v);
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
