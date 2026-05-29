'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Building2, ShoppingCart, Cloud, ArrowUpRight } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

interface Service {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  tags: string[];
  span?: string;
}

const SERVICES: Service[] = [
  {
    icon: <Workflow size={22} />,
    label: '01',
    title: 'Workflow Orchestration',
    description:
      'End-to-end process automation connecting disparate systems via intelligent serverless pipelines — n8n, webhooks, and custom API bridges.',
    tags: ['n8n', 'Zapier', 'Webhooks', 'REST APIs'],
    span: 'col-span-2',
  },
  {
    icon: <Building2 size={22} />,
    label: '02',
    title: 'Enterprise Automation',
    description:
      'Full-stack Zoho One implementations unifying CRM, ERP, finance, and operations into a single high-availability instance.',
    tags: ['Zoho One', 'CRM', 'ERP', 'Finance'],
  },
  {
    icon: <ShoppingCart size={22} />,
    label: '03',
    title: 'E-Commerce Engineering',
    description:
      'Headless Shopify and WordPress architectures optimized for conversion, performance, and mobile-first experiences.',
    tags: ['Shopify', 'Next.js', 'Headless', 'PWA'],
  },
  {
    icon: <Cloud size={22} />,
    label: '04',
    title: 'Cloud Infrastructure',
    description:
      'Serverless and containerized cloud deployments on AWS and Cloudflare — built for elastic scale and zero-downtime deployments.',
    tags: ['AWS Lambda', 'Cloudflare Workers', 'Docker', 'CI/CD'],
    span: 'col-span-2',
  },
];

function GlowCard({ service, index }: { service: Service; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlowStyle({
      background: `radial-gradient(400px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 70%)`,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGlowStyle({});
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ ...SPRING, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl border border-[#222] bg-[#111] p-8 overflow-hidden cursor-default ${service.span ?? ''}`}
    >
      {/* Mouse glow */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-300" style={glowStyle} />

      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white group-hover:border-[#333] transition-colors">
              {service.icon}
            </div>
            <span className="text-xs text-[#3f3f46] font-mono tracking-widest">{service.label}</span>
          </div>
          <ArrowUpRight
            size={16}
            className="text-[#3f3f46] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
          />
        </div>

        <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{service.title}</h3>
        <p className="text-sm text-[#71717a] leading-relaxed mb-6">{service.description}</p>

        <div className="flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-[#71717a] border border-[#222] rounded-md px-2.5 py-1 bg-[#0a0a0a] tracking-wide group-hover:border-[#333] transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Services() {
  return (
    <section id="systems" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="mb-16"
        >
          <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Core Capabilities</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white">
            What We <span className="text-[#71717a]">Engineer</span>
          </h2>
          <p className="mt-4 text-[#71717a] max-w-xl leading-relaxed">
            Four specialization domains, one integrated architecture practice — each built to production-grade standards.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {SERVICES.map((service, i) => (
            <GlowCard key={service.label} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
