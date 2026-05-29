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
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6 border-b border-[#111] group hover:border-[#1a1a1a] transition-colors"
    >
      <div className="w-36 flex-shrink-0">
        <span className="text-[11px] text-[#3f3f46] tracking-[0.2em] uppercase font-medium group-hover:text-[#71717a] transition-colors">
          {row.category}
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {row.items.map((item) => (
          <span key={item} className="text-sm text-[#71717a] hover:text-white transition-colors cursor-default tracking-wide">
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function TechStack() {
  return (
    <section id="stack" className="relative py-32 px-6 overflow-hidden">
      <SectionAtmosphere theme="techstack" />
      <div className="relative z-10 max-w-7xl mx-auto">

        <div className="mb-16 space-y-2">
          <ScrollReveal direction="down">
            <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">
              Technical Arsenal
            </span>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.07}>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              The Core <span className="text-[#71717a]">Stack</span>
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
