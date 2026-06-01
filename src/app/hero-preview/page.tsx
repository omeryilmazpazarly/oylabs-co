'use client';

import { useRef } from 'react';
import {
  motion, useMotionValue, useSpring, useTransform, MotionValue,
  AnimatePresence,
} from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GradientOrbs from '@/components/effects/GradientOrbs';
import MagneticButton from '@/components/effects/MagneticButton';

const EASE = [0.16, 1, 0.3, 1] as const;

function fadeUp(delay = 0) {
  return {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };
}

const STATS = [
  { value: '50+',   label: 'Projects Delivered' },
  { value: '12+',   label: 'Enterprise Clients'  },
  { value: '99.9%', label: 'Uptime SLA'          },
];

/* ── Shared left column ─────────────────────────────────────────── */
function HeroLeft() {
  return (
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
        {STATS.map((stat, i) => (
          <div key={i} className="flex items-center gap-6 sm:gap-8">
            {i > 0 && <span className="w-px h-8 flex-shrink-0" style={{ background: 'var(--_line-hi)' }} />}
            <div>
              <p className="text-2xl font-bold text-ink tabular-nums tracking-tight leading-none">{stat.value}</p>
              <p className="text-[11px] text-ink-dull mt-1 tracking-wide leading-none">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Shared section wrapper ─────────────────────────────────────── */
function HeroSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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

      {/* Option label */}
      <div className="relative z-20 flex justify-center pt-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-line-hi text-[11px] font-medium text-ink-dull tracking-[0.2em] uppercase"
          style={{ background: 'var(--_panel)' }}>
          {label}
        </span>
      </div>

      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] gap-10 lg:gap-16 items-center">
            <HeroLeft />
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className="hidden lg:block"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--_page), transparent)' }} />

      {/* Divider */}
      <div className="relative z-10 border-t border-line-hi" />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OPTION A — Systems Graph
   SVG node diagram showing connected services with animated lines
═══════════════════════════════════════════════════════════════════ */

const NODES = [
  { id: 'shopify',   label: 'Shopify',    x: 220, y:  60, color: '#10b981' },
  { id: 'mobile',    label: 'Mobile App', x: 380, y: 130, color: '#0ea5e9' },
  { id: 'api',       label: 'API Layer',  x: 240, y: 210, color: '#f59e0b' },
  { id: 'zoho',      label: 'Zoho CRM',  x:  80, y: 160, color: '#7c3aed' },
  { id: 'cloud',     label: 'Cloud',      x: 140, y:  60, color: '#0ea5e9' },
  { id: 'headless',  label: 'Headless',   x: 360, y: 270, color: '#10b981' },
];

const EDGES = [
  ['shopify',  'api'],
  ['shopify',  'mobile'],
  ['cloud',    'shopify'],
  ['cloud',    'zoho'],
  ['zoho',     'api'],
  ['api',      'mobile'],
  ['api',      'headless'],
  ['mobile',   'headless'],
];

function SystemsGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const cfg = { stiffness: 60, damping: 20, mass: 1 };
  const sX = useSpring(rawX, cfg);
  const sY = useSpring(rawY, cfg);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-8, 8]);
  const rotateX = useTransform(sY, [-0.5, 0.5], [6, -6]);

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    rawY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  }
  function onMouseLeave() { rawX.set(0); rawY.set(0); }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative select-none"
      style={{ height: 380, perspective: 900 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* Background panel */}
        <div
          className="absolute inset-0 rounded-2xl border border-line overflow-hidden"
          style={{ background: 'var(--_panel)' }}
        >
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(var(--_line) 1px, transparent 1px), linear-gradient(90deg, var(--_line) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Header bar */}
          <div className="absolute top-0 inset-x-0 h-10 border-b border-line flex items-center px-4 gap-1.5"
            style={{ background: 'var(--_elevated)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[11px] text-ink-dull font-mono tracking-wide">systems.architecture</span>
          </div>

          {/* SVG canvas */}
          <svg
            viewBox="0 0 460 320"
            className="absolute inset-0 w-full h-full"
            style={{ paddingTop: 40 }}
          >
            {/* Edges */}
            {EDGES.map(([a, b], i) => {
              const na = NODES.find(n => n.id === a)!;
              const nb = NODES.find(n => n.id === b)!;
              const len = Math.hypot(nb.x - na.x, nb.y - na.y);
              return (
                <g key={i}>
                  {/* Base line */}
                  <line
                    x1={na.x} y1={na.y + 40}
                    x2={nb.x} y2={nb.y + 40}
                    stroke="var(--_line-hi)"
                    strokeWidth="1"
                  />
                  {/* Animated flow dash */}
                  <motion.line
                    x1={na.x} y1={na.y + 40}
                    x2={nb.x} y2={nb.y + 40}
                    stroke={na.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    strokeDasharray={`${len * 0.15} ${len * 0.85}`}
                    animate={{ strokeDashoffset: [0, -len] }}
                    transition={{
                      duration: 2 + i * 0.4,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.3,
                    }}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => (
              <g key={node.id}>
                {/* Outer pulse ring */}
                <motion.circle
                  cx={node.x} cy={node.y + 40} r={18}
                  fill="none"
                  stroke={node.color}
                  strokeWidth="1"
                  strokeOpacity="0.2"
                  animate={{ r: [18, 24], opacity: [0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: Math.random() * 2 }}
                />
                {/* Node circle */}
                <circle
                  cx={node.x} cy={node.y + 40} r={14}
                  fill="var(--_panel)"
                  stroke={node.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
                {/* Inner glow */}
                <circle
                  cx={node.x} cy={node.y + 40} r={6}
                  fill={node.color}
                  fillOpacity="0.35"
                />
                {/* Center dot */}
                <motion.circle
                  cx={node.x} cy={node.y + 40} r={3}
                  fill={node.color}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 2 }}
                />
                {/* Label */}
                <text
                  x={node.x} y={node.y + 40 + 28}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--_ink-dull)"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.05em"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Footer */}
          <div className="absolute bottom-0 inset-x-0 h-9 border-t border-line flex items-center px-4 gap-2"
            style={{ background: 'var(--_elevated)' }}>
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#10b981]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono text-ink-dull">6 services connected · all healthy</span>
            <span className="ml-auto text-[10px] font-mono text-ink-ghost">v2.4.1</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OPTION B — Browser Stack
   Stacked browser-chrome window frames with real screenshots
═══════════════════════════════════════════════════════════════════ */

const PROJECTS = [
  { title: 'Carmen Perfumes', url: 'carmenperfumes.ae', image: 'https://omeryilmaz.xyz/uploads/project-1769553834432-78891718.jpg',  rotate: -4, offsetX: -24, offsetY: 20,  z: 1  },
  { title: 'Liberty Pack',    url: 'libertypack.qa',   image: 'https://omeryilmaz.xyz/uploads/project-1769553807042-8096702.png',    rotate:  1, offsetX: -10, offsetY: 10,  z: 2  },
  { title: 'Lase Tech',       url: 'lasetech.com',     image: 'https://omeryilmaz.xyz/uploads/project-1769553818706-277315509.png',  rotate:  3, offsetX:   0, offsetY:  0,  z: 3  },
];

function BrowserStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const cfg = { stiffness: 85, damping: 18, mass: 0.9 };
  const sX = useSpring(rawX, cfg);
  const sY = useSpring(rawY, cfg);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(sY, [-0.5, 0.5], [7, -7]);

  // Front card parallax
  const pFX = useTransform(sX, [-0.5, 0.5], [-18, 18]);
  const pFY = useTransform(sY, [-0.5, 0.5], [-10, 10]);
  const pMX = useTransform(sX, [-0.5, 0.5], [-8, 8]);
  const pMY = useTransform(sY, [-0.5, 0.5], [-5, 5]);

  // Glare on front card
  const glareX = useTransform(sX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(sY, [-0.5, 0.5], [0, 100]);
  const glareBg = useTransform(
    [glareX, glareY] as MotionValue<number>[],
    ([gx, gy]: number[]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.07) 0%, transparent 55%)`,
  );

  function onMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    rawY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  }
  function onMouseLeave() { rawX.set(0); rawY.set(0); }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative select-none cursor-default"
      style={{ height: 400, perspective: 1000 }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative w-full h-full">

        {/* Back window */}
        <motion.div
          className="absolute"
          style={{
            x: pMX, y: pMY,
            zIndex: 1,
            top: 40,
            left: -24,
            right: 24,
            rotate: PROJECTS[0].rotate,
            opacity: 0.55,
          }}
        >
          <BrowserWindow project={PROJECTS[0]} />
        </motion.div>

        {/* Mid window */}
        <motion.div
          className="absolute"
          style={{
            x: pMX, y: pMY,
            zIndex: 2,
            top: 20,
            left: -12,
            right: 12,
            rotate: PROJECTS[1].rotate,
            opacity: 0.8,
          }}
        >
          <BrowserWindow project={PROJECTS[1]} />
        </motion.div>

        {/* Front window — full size + glare */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{ x: pFX, y: pFY, zIndex: 3, rotate: PROJECTS[2].rotate }}
        >
          <BrowserWindow project={PROJECTS[2]} featured glareBg={glareBg} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function BrowserWindow({
  project,
  featured = false,
  glareBg,
}: {
  project: (typeof PROJECTS)[number];
  featured?: boolean;
  glareBg?: MotionValue<string>;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${featured ? 'var(--_line-hi)' : 'var(--_line)'}`,
        background: 'var(--_panel)',
        boxShadow: featured
          ? '0 28px 70px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 6px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-line"
        style={{ background: 'var(--_elevated)' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="flex-1 mx-2 h-5 rounded-md flex items-center px-2.5 gap-1.5"
          style={{ background: 'var(--_input)', border: '1px solid var(--_line)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
          <span className="text-[10px] text-ink-dull font-mono truncate">{project.url}</span>
        </div>
      </div>

      {/* Screenshot */}
      <div className="relative overflow-hidden" style={{ height: featured ? 240 : 200 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
        {featured && glareBg && (
          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: glareBg }} />
        )}
        {featured && (
          <div className="absolute bottom-3 left-3">
            <p className="text-sm font-semibold text-white leading-none">{project.title}</p>
            <p className="text-[11px] text-white/60 mt-0.5">{project.url}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OPTION C — Bento Panel
   Asymmetric grid: screenshot + live status + deploys + tech stack
═══════════════════════════════════════════════════════════════════ */

const DEPLOYS = [
  { project: 'Carmen Perfumes', action: 'Shopify deploy', time: '3d ago',  color: '#10b981' },
  { project: 'Liberty Pack',    action: 'API update',     time: '5d ago',  color: '#0ea5e9' },
  { project: 'Lase Tech',       action: 'Framer publish', time: '12d ago', color: '#7c3aed' },
];

const TECH_TAGS = [
  { label: 'Shopify',    color: '#10b981' },
  { label: 'Next.js',   color: '#0ea5e9' },
  { label: 'Zoho',      color: '#7c3aed' },
  { label: 'React Native', color: '#f59e0b' },
  { label: 'Node.js',   color: '#10b981' },
  { label: 'Serverless', color: '#0ea5e9' },
  { label: 'AWS',        color: '#f59e0b' },
  { label: 'Framer',     color: '#7c3aed' },
];

function BentoPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
      className="grid gap-3"
      style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto' }}
    >
      {/* A — Large project image */}
      <div
        className="relative rounded-xl overflow-hidden col-span-1"
        style={{
          height: 220,
          border: '1px solid var(--_line-hi)',
          gridColumn: '1',
          gridRow: '1 / span 2',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://omeryilmaz.xyz/uploads/project-1769553834432-78891718.jpg"
          alt="Carmen Perfumes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-semibold text-white leading-none">Carmen Perfumes</p>
          <p className="text-[10px] text-white/50 mt-0.5">carmenperfumes.ae</p>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] text-white/70 font-medium">Live</span>
        </div>
      </div>

      {/* B — Uptime card */}
      <div
        className="rounded-xl p-4 flex flex-col justify-between"
        style={{
          background: 'var(--_panel)',
          border: '1px solid var(--_line)',
          height: 104,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-ink-dull tracking-wide uppercase font-medium">Uptime SLA</p>
          <motion.span
            className="w-2 h-2 rounded-full bg-[#10b981]"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </div>
        <div>
          <p className="text-3xl font-bold text-ink tabular-nums tracking-tight leading-none">99.9%</p>
          <p className="text-[10px] text-ink-dull mt-1">all systems nominal</p>
        </div>
      </div>

      {/* C — Deploy feed */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--_panel)',
          border: '1px solid var(--_line)',
          height: 104,
        }}
      >
        <div className="px-3 pt-3 pb-2 border-b border-line-sub flex items-center gap-1.5">
          <span className="text-[10px] text-ink-dull font-medium tracking-wide uppercase">Recent Deploys</span>
        </div>
        <div className="divide-y divide-line-sub">
          {DEPLOYS.slice(0, 2).map((d, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[11px] text-ink truncate flex-1">{d.project}</span>
              <span className="text-[10px] text-ink-ghost flex-shrink-0">{d.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* D — Tech stack tags — full width bottom row */}
      <div
        className="col-span-2 rounded-xl p-3.5"
        style={{
          background: 'var(--_panel)',
          border: '1px solid var(--_line)',
        }}
      >
        <p className="text-[10px] text-ink-dull tracking-wide uppercase mb-2.5">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {TECH_TAGS.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{
                background: `${tag.color}12`,
                border: `1px solid ${tag.color}28`,
                color: tag.color,
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function HeroPreviewPage() {
  return (
    <div>
      <HeroSection label="Option A — Systems Graph">
        <SystemsGraph />
      </HeroSection>

      <HeroSection label="Option B — Browser Stack">
        <BrowserStack />
      </HeroSection>

      <HeroSection label="Option C — Bento Panel">
        <BentoPanel />
      </HeroSection>
    </div>
  );
}
