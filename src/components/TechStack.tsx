'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './effects/ScrollReveal';
import SectionAtmosphere from './effects/SectionAtmosphere';

const EASE = { type: 'spring', stiffness: 90, damping: 22, mass: 0.8 } as const;

const STACK_ROWS = [
  { category: 'Frontend',       items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
  { category: 'Backend',        items: ['Node.js', 'AWS Lambda', 'Cloudflare Workers', 'REST & GraphQL', 'PostgreSQL'] },
  { category: 'Commerce',       items: ['Shopify API', 'Headless Commerce', 'Stripe', 'WordPress', 'WooCommerce'] },
  { category: 'Automation',     items: ['n8n', 'Zoho One', 'Zapier', 'Webhooks', 'Serverless Pipelines'] },
  { category: 'Infrastructure', items: ['AWS EC2', 'Vercel', 'Docker', 'GitHub Actions', 'Cloudflare CDN'] },
];

function StackRow({ row, index }: { row: typeof STACK_ROWS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: '-72px 0px', once: false });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -36 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -36 }}
      transition={{ ...EASE, delay: index * 0.06 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 py-5 sm:py-6 border-b border-line-sub group hover:border-line transition-colors"
    >
      <div className="w-full sm:w-36 flex-shrink-0">
        <span className="text-[11px] text-ink-dull tracking-[0.2em] uppercase font-medium group-hover:text-ink-dim transition-colors">
          {row.category}
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {row.items.map((item) => (
          <span key={item} className="text-sm text-ink-dim hover:text-ink transition-colors cursor-default tracking-wide">
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function TechStack() {
  return (
    <section id="stack" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 overflow-hidden flex flex-col justify-center snap-start">
      <SectionAtmosphere theme="techstack" />
      <div className="relative z-10 max-w-7xl mx-auto w-full">

        <div className="mb-10 sm:mb-16 space-y-2">
          <ScrollReveal direction="down">
            <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">
              Technical Arsenal
            </span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.07}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink">
              The Core <span className="text-ink-dim">Stack</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="space-y-0">
          {STACK_ROWS.map((row, i) => (
            <StackRow key={row.category} row={row} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
