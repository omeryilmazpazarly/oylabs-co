'use client';

import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

const STACK_ROWS = [
  {
    category: 'Frontend',
    items: ['Next.js 14', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    category: 'Backend',
    items: ['Node.js', 'AWS Lambda', 'Cloudflare Workers', 'REST & GraphQL', 'PostgreSQL'],
  },
  {
    category: 'Commerce',
    items: ['Shopify API', 'Headless Commerce', 'Stripe', 'WordPress Core', 'WooCommerce'],
  },
  {
    category: 'Automation',
    items: ['n8n', 'Zoho One', 'Zapier', 'Webhooks', 'Serverless Pipelines'],
  },
  {
    category: 'Infrastructure',
    items: ['AWS EC2', 'Vercel', 'Docker', 'GitHub Actions', 'Cloudflare CDN'],
  },
];

export default function TechStack() {
  return (
    <section id="stack" className="py-32 px-6 border-t border-[#111]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="mb-16"
        >
          <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Technical Arsenal</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white">
            The Core <span className="text-[#71717a]">Stack</span>
          </h2>
        </motion.div>

        <div className="space-y-0">
          {STACK_ROWS.map((row, i) => (
            <motion.div
              key={row.category}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING, delay: i * 0.08 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6 border-b border-[#111] group hover:border-[#1a1a1a] transition-colors"
            >
              <div className="w-32 flex-shrink-0">
                <span className="text-xs text-[#3f3f46] tracking-[0.2em] uppercase font-medium group-hover:text-[#71717a] transition-colors">
                  {row.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {row.items.map((item) => (
                  <span
                    key={item}
                    className="text-sm text-[#71717a] hover:text-white transition-colors cursor-default tracking-wide"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
