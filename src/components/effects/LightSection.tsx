'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/*
 * Mercury-style scroll transition: as this section enters the viewport the
 * background smoothly goes from pitch-black → near-white, then darkens again
 * as you scroll out. Content inside should use light-mode colours (dark text)
 * so it "materialises" naturally as the background brightens.
 */
export default function LightSection({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    // start transition when element top hits 90 % of viewport height,
    // finish when element bottom clears 10 % of viewport height
    offset: ['start 90%', 'end 10%'],
  });

  // Spring-smooth the raw scroll value — removes any choppiness
  const smooth = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001,
  });

  // Background: dark → light → dark
  const backgroundColor = useTransform(
    smooth,
    [0, 0.2, 0.8, 1],
    ['#000000', '#f4f4f5', '#f4f4f5', '#000000']
  );

  return (
    <motion.div ref={ref} style={{ backgroundColor }} className={className}>
      {children}
    </motion.div>
  );
}
