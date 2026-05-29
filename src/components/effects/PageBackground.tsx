'use client';

import { useEffect } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { usePageLightness } from '@/contexts/ThemeContext';

/*
 * Renders nothing — purely a side-effect component.
 * On every scroll frame it writes the interpolated colour directly to
 * document.body.style.backgroundColor (zero React re-renders, 60fps smooth).
 * Since the body background IS the page canvas, this makes the ENTIRE
 * viewport transition — behind the navbar, behind every section, everything.
 */
export default function PageBackground() {
  const lightness = usePageLightness();

  // Initialise body to black on mount so there's no flash
  useEffect(() => {
    document.body.style.backgroundColor = 'rgb(0,0,0)';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useMotionValueEvent(lightness, 'change', (v) => {
    // Interpolate  #000000 (0,0,0)  →  #f7f7f8 (247,247,248)
    const r = Math.round(v * 247);
    const g = Math.round(v * 247);
    const b = Math.round(v * 248);
    document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
  });

  return null;
}
