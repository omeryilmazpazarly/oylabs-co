'use client';

import { createContext, useContext } from 'react';
import { MotionValue, useMotionValue } from 'framer-motion';

/*
 * Holds a single 0–1 MotionValue representing page "lightness".
 * 0 = pitch-black dark mode  |  1 = near-white light mode
 *
 * LightSection writes to it via scroll.
 * PageBackground reads it to update document.body background at 60fps.
 * Navbar reads it to flip its text/border colours.
 */
const ThemeContext = createContext<MotionValue<number>>(null!);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const lightness = useMotionValue(0);
  return (
    <ThemeContext.Provider value={lightness}>
      {children}
    </ThemeContext.Provider>
  );
}

export function usePageLightness() {
  return useContext(ThemeContext);
}
