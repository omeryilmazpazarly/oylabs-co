'use client';

import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
}

/* Linear-style: an animated gradient "sweep" around the card border on hover.
   The border light rotates 360° giving a premium chrome feel. */
export default function ShimmerBorder({ children, className = '' }: Props) {
  return (
    <div className={`relative group ${className}`}>
      {/* Animated conic gradient border */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ zIndex: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.3) 20%, transparent 40%)',
          }}
        />
      </motion.div>

      {/* Inner mask to show only the border */}
      <div className="absolute -inset-[1px] rounded-2xl pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-[1px] rounded-2xl bg-[#111]" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
