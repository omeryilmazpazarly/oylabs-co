'use client';

import { useEffect, useRef } from 'react';

/* Linear-style: a giant radial spotlight that follows the cursor
   across the ENTIRE page background — very subtle, pure magic. */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.setProperty('--x', `${e.clientX}px`);
      ref.current.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 pointer-events-none z-20"
      style={{
        background:
          'radial-gradient(700px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.025), transparent 60%)',
        willChange: 'background',
      }}
    />
  );
}
