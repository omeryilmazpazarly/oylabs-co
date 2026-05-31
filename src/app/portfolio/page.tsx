import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';
import Footer from '@/components/Footer';
import SectionAtmosphere from '@/components/effects/SectionAtmosphere';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio — OY Labs',
  description: 'A curated selection of our technical systems, applications, and platform engineering work.',
};

export default function PortfolioPage() {
  const items = getAllItems();

  return (
    <>
      <div className="relative min-h-screen pt-24 sm:pt-32 pb-16 px-4 sm:px-6 overflow-hidden">
        <SectionAtmosphere theme="work" showTopEdge={false} />
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 sm:mb-16">
            <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">Our Work</span>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink leading-none">
              Portfolio
            </h1>
            <p className="mt-4 text-ink-dim max-w-xl leading-relaxed">
              A curated selection of technical systems, custom applications, and platform engineering projects — each scoped, built, and shipped to production standard.
            </p>
          </div>

          <PortfolioGrid items={items} carousel={false} />
        </div>
      </div>
      <Footer />
    </>
  );
}
