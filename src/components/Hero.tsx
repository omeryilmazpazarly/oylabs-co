'use client';

import { useRef } from 'react';
import {
  motion, useMotionValue, useSpring, useTransform,
  MotionValue,
} from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GradientOrbs from './effects/GradientOrbs';
import MagneticButton from './effects/MagneticButton';

const EASE = [0.16, 1, 0.3, 1] as const;

function fadeUp(delay = 0) {
  return {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };
}

const MARQUEE = [
  'Systems Architecture', 'Serverless Automation', 'Mobile Applications',
  'API Engineering', 'E-Commerce Platforms', 'Cloud Infrastructure',
  'Zoho Integration', 'Headless Commerce',
];

/* ── Graph data ───────────────────────────────────────────────── */
const NODES = [
  { id: 'shopify',    label: 'Shopify',    x: 228, y:  52, color: '#10b981', r: 16 },
  { id: 'wordpress',  label: 'WordPress',  x:  68, y: 110, color: '#0ea5e9', r: 13 },
  { id: 'automation', label: 'Automation', x: 390, y: 108, color: '#f59e0b', r: 13 },
  { id: 'api',        label: 'API Layer',  x: 228, y: 185, color: '#ffffff', r: 15 },
  { id: 'crm',        label: 'CRM',        x:  72, y: 238, color: '#7c3aed', r: 13 },
  { id: 'mobile',     label: 'Mobile',     x: 390, y: 238, color: '#0ea5e9', r: 13 },
  { id: 'systems',    label: 'Systems',    x: 160, y: 310, color: '#10b981', r: 12 },
  { id: 'cloud',      label: 'Cloud',      x: 300, y: 310, color: '#7c3aed', r: 12 },
] as const;

const EDGES: [string, string][] = [
  ['shopify',    'wordpress'],
  ['shopify',    'automation'],
  ['shopify',    'api'],
  ['wordpress',  'api'],
  ['wordpress',  'crm'],
  ['automation', 'api'],
  ['automation', 'mobile'],
  ['api',        'crm'],
  ['api',        'mobile'],
  ['api',        'systems'],
  ['api',        'cloud'],
  ['crm',        'systems'],
  ['mobile',     'cloud'],
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-16">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--_grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--_grid-line) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <GradientOrbs />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,255,255,0.04), transparent)' }} />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-10 lg:gap-16 items-center">

            {/* Left */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            >
              <motion.p variants={fadeUp(0)}
                className="text-[11px] text-ink-dull tracking-[0.28em] uppercase mb-8 select-none">
                Technical Agency&nbsp;&nbsp;·&nbsp;&nbsp;Shopify Partner
              </motion.p>

              <motion.h1
                variants={fadeUp(1)}
                className="font-bold tracking-tight leading-[0.93] mb-6"
                style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
              >
                <span className="block text-ink-dim">We Build</span>
                <span className="block text-ink-dim">Systems That</span>
                <span className="block text-ink" style={{ fontSize: '1.12em' }}>Scale.</span>
              </motion.h1>

              <motion.p variants={fadeUp(2)}
                className="text-base sm:text-lg text-ink-dim leading-relaxed mb-9"
                style={{ maxWidth: '52ch' }}>
                Custom web and mobile applications, serverless automation
                workflows, and enterprise system integrations — engineered
                for velocity and built to last.
              </motion.p>

              <motion.div variants={fadeUp(3)}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
                <MagneticButton>
                  <Link href="/portfolio"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-opacity duration-200 active:scale-95">
                    View Our Work
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-line-hi text-ink text-sm font-medium tracking-wide hover:border-ink-dull transition-colors duration-200"
                    style={{ backgroundColor: 'var(--_overlay)' }}>
                    Start a Project
                  </Link>
                </MagneticButton>
              </motion.div>

              <motion.div variants={fadeUp(4)} className="flex items-center gap-6 sm:gap-8">
                {[
                  { value: '50+',   label: 'Projects Delivered' },
                  { value: '12+',   label: 'Enterprise Clients'  },
                  { value: '99.9%', label: 'Uptime SLA'          },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-6 sm:gap-8">
                    {i > 0 && (
                      <span className="w-px h-8 flex-shrink-0" style={{ background: 'var(--_line-hi)' }} />
                    )}
                    <div>
                      <p className="text-2xl font-bold text-ink tabular-nums tracking-tight leading-none">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-ink-dull mt-1 tracking-wide leading-none">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — systems graph */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className="hidden lg:block"
            >
              <SystemsGraph />
            </motion.div>

          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--_page), transparent)' }} />

      <div className="relative z-10 border-t border-line-sub overflow-hidden py-4">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="text-xs text-ink-faint tracking-[0.3em] uppercase font-medium">
              {item}<span className="ml-12 text-ink-ghost">◆</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Systems graph ────────────────────────────────────────────── */
function SystemsGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const cfg = { stiffness: 65, damping: 20, mass: 1 };
  const sX  = useSpring(rawX, cfg);
  const sY  = useSpring(rawY, cfg);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sY, [-0.5, 0.5], [5, -5]);

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left  - rect.width  / 2) / rect.width);
    rawY.set((e.clientY - rect.top   - rect.height / 2) / rect.height);
  }
  function onMouseLeave() { rawX.set(0); rawY.set(0); }

  /* Stagger each node's entrance */
  const nodeDelays = [0.55, 0.65, 0.70, 0.80, 0.90, 0.95, 1.0, 1.05];

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative select-none cursor-default"
      style={{ height: 420, perspective: 960 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="w-full h-full"
      >
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--_panel)',
            border: '1px solid var(--_line-hi)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.35)',
          }}
        >
          {/* Dot-grid background */}
          <div className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--_line-hi) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Chrome bar */}
          <div
            className="absolute top-0 inset-x-0 h-9 flex items-center px-4 gap-2 border-b"
            style={{ background: 'var(--_elevated)', borderColor: 'var(--_line)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[11px] font-mono text-ink-dull tracking-wide">
              systems.architecture — live
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#10b981]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] font-mono text-ink-dull">connected</span>
            </div>
          </div>

          {/* SVG graph — starts right under the chrome bar */}
          <svg
            viewBox="0 0 460 356"
            className="absolute left-0 right-0"
            style={{ top: 36, bottom: 36, height: 'calc(100% - 72px)', width: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Edges — rendered behind nodes */}
            {EDGES.map(([aId, bId], i) => {
              const a = NODES.find(n => n.id === aId)!;
              const b = NODES.find(n => n.id === bId)!;
              const len = Math.hypot(b.x - a.x, b.y - a.y);
              const dashLen   = len * 0.12;
              const gapLen    = len - dashLen;
              return (
                <g key={i}>
                  {/* Static base line */}
                  <line
                    x1={a.x} y1={a.y}
                    x2={b.x} y2={b.y}
                    stroke="var(--_line-hi)"
                    strokeWidth="0.75"
                  />
                  {/* Flowing particle */}
                  <motion.line
                    x1={a.x} y1={a.y}
                    x2={b.x} y2={b.y}
                    stroke={a.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.55"
                    strokeDasharray={`${dashLen} ${gapLen}`}
                    animate={{ strokeDashoffset: [0, -len] }}
                    transition={{
                      duration: 1.8 + (i % 5) * 0.35,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.18,
                    }}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node, idx) => (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: nodeDelays[idx] }}
                style={{ originX: `${node.x}px`, originY: `${node.y}px` }}
              >
                {/* Outer pulse ring */}
                <motion.circle
                  cx={node.x} cy={node.y}
                  r={node.r + 8}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="0.75"
                  animate={{ r: [node.r + 6, node.r + 16], opacity: [0.25, 0] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: idx * 0.4,
                  }}
                />
                {/* Node fill */}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.r}
                  fill="var(--_elevated)"
                  stroke={node.color}
                  strokeWidth="1.25"
                  strokeOpacity="0.6"
                />
                {/* Inner glow disc */}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.r * 0.45}
                  fill={node.color}
                  fillOpacity="0.25"
                />
                {/* Center dot — pulses independently */}
                <motion.circle
                  cx={node.x} cy={node.y}
                  r={node.r * 0.2}
                  fill={node.color}
                  animate={{ opacity: [1, 0.35, 1], r: [node.r * 0.2, node.r * 0.28, node.r * 0.2] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + node.r + 13}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.04em"
                  fill="var(--_ink-dull)"
                >
                  {node.label}
                </text>
              </motion.g>
            ))}
          </svg>

          {/* Status footer */}
          <div
            className="absolute bottom-0 inset-x-0 h-9 flex items-center px-4 gap-3 border-t"
            style={{ background: 'var(--_elevated)', borderColor: 'var(--_line)' }}
          >
            <span className="text-[10px] font-mono text-ink-ghost">8 services</span>
            <span className="text-[10px] font-mono text-ink-ghost">·</span>
            <span className="text-[10px] font-mono text-ink-ghost">13 integrations</span>
            <span className="ml-auto flex items-center gap-1.5">
              {(['#10b981', '#0ea5e9', '#f59e0b', '#7c3aed'] as const).map((c, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
              ))}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
