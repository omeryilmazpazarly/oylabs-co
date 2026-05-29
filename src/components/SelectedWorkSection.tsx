'use client';

import { motion, useTransform } from 'framer-motion';
import { usePageLightness } from '@/contexts/ThemeContext';
import LightSection from './effects/LightSection';
import SectionOrbs from './effects/SectionOrbs';
import PortfolioGrid from './PortfolioGrid';
import type { PortfolioItem } from '@/types/portfolio';

/*
 * Wraps the "Selected Work" grid in a LightSection so the entire page
 * transitions dark → white → dark as you scroll through it.
 * Heading, border, and "View all" link are theme-aware via MotionValues.
 */
export default function SelectedWorkSection({ items }: { items: PortfolioItem[] }) {
  const lightness = usePageLightness();

  const headingColor  = useTransform(lightness, [0, 1], ['#ffffff', '#09090b']);
  const borderColor   = useTransform(lightness, [0, 1], ['rgb(17,17,17)', 'rgb(228,228,231)']);
  const viewAllColor  = useTransform(lightness, [0, 1], ['#71717a', '#52525b']);
  const viewAllBorder = useTransform(lightness, [0, 1], ['#333333', '#d4d4d8']);

  return (
    <LightSection>
      <motion.section
        id="work"
        style={{ borderTopColor: borderColor }}
        className="relative py-32 px-6 border-t overflow-hidden"
      >
        <SectionOrbs variant="violet-amber" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">
                Selected Work
              </span>
              <motion.h2
                style={{ color: headingColor }}
                className="mt-3 text-4xl md:text-5xl font-bold tracking-tight"
              >
                Recent <span className="text-[#71717a]">Projects</span>
              </motion.h2>
            </div>

            <motion.a
              href="/portfolio"
              style={{ color: viewAllColor, borderBottomColor: viewAllBorder }}
              className="text-sm tracking-wide transition-opacity border-b pb-0.5 whitespace-nowrap hover:opacity-70"
            >
              View all projects →
            </motion.a>
          </div>

          <PortfolioGrid items={items} />
        </div>
      </motion.section>
    </LightSection>
  );
}
