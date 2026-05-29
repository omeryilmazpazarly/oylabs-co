'use client';

import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

const STACK_ROWS = [
  {
    category: 'Frontend',
    items: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    category: 'Backend',
    items: ['Node.js', 'AWS Lambda', 'Cloudflare Workers', 'REST & GraphQL', 'PostgreSQL'],
  },
  {
    category: 'Commerce',
    items: ['Shopify API', 'Headless Commerce', 'Stripe', 'WordPress', 'WooCommerce'],
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

/*
 * Styled for the LightSection wrapper — uses dark text so it "materialises"
 * naturally as the background transitions from black → near-white.
 */
export default function TechStack() {
  return (
    <section id="stack" className="py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="mb-16"
        >
          <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">
            Technical Arsenal
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-[#09090b]">
            The Core <span className="text-[#71717a]">Stack</span>
          </h2>
          <p className="mt-4 text-[#52525b] max-w-xl leading-relaxed text-sm">
            Technologies we've shipped real production systems with — no toy frameworks,
            no experimental dependencies.
          </p>
        </motion.div>

        <div className="space-y-0">
          {STACK_ROWS.map((row, i) => (
            <motion.div
              key={row.category}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING, delay: i * 0.07 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5 border-b border-[#e4e4e7] group"
            >
              <div className="w-36 flex-shrink-0">
                <span className="text-[11px] text-[#a1a1aa] tracking-[0.2em] uppercase font-semibold group-hover:text-[#71717a] transition-colors">
                  {row.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {row.items.map((item) => (
                  <span
                    key={item}
                    className="text-sm text-[#3f3f46] hover:text-[#09090b] transition-colors cursor-default tracking-wide font-medium border border-[#e4e4e7] rounded-lg px-3 py-1 bg-white hover:border-[#d4d4d8] hover:shadow-sm transition-all"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="mt-16 h-px bg-gradient-to-r from-[#09090b] via-[#71717a] to-transparent origin-left"
        />
      </div>
    </section>
  );
}
