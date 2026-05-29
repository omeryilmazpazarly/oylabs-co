'use client';

import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

interface Props {
  text: string;
  className?: string;
  trigger?: boolean;
  speed?: number;
}

/* Linear-style: characters scramble through random glyphs then settle
   into the final text — triggered on mount or on a boolean prop. */
export default function TextScramble({ text, className = '', trigger = true, speed = 40 }: Props) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const raf   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trigger) return;
    let iteration = 0;
    const total = text.length * 3;

    function step() {
      setDisplay(
        text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iteration / 3) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      iteration++;
      if (iteration < total) {
        raf.current = setTimeout(step, speed);
      } else {
        setDisplay(text);
      }
    }

    raf.current = setTimeout(step, 120);
    return () => { if (raf.current) clearTimeout(raf.current); };
  }, [text, trigger, speed]);

  return (
    <span className={`font-mono ${className}`} aria-label={text}>
      {display}
    </span>
  );
}
