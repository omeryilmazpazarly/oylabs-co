'use client';

import ScrollReveal from './effects/ScrollReveal';

export default function WorkSectionHeader() {
  return (
    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <ScrollReveal direction="down" delay={0}>
          <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">
            Selected Work
          </span>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.07}>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-ink">
            Recent <span className="text-ink-dim">Projects</span>
          </h2>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="right" delay={0.12}>
        <a
          href="/portfolio"
          className="text-sm text-ink-dim hover:text-ink tracking-wide transition-colors border-b border-line-hi pb-0.5 hover:border-ink-dull whitespace-nowrap"
        >
          View all projects →
        </a>
      </ScrollReveal>
    </div>
  );
}
