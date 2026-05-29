import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio — OY Labs',
  description: 'A curated selection of our technical systems, applications, and platform engineering work.',
};

export default function PortfolioPage() {
  const items = getAllItems();

  return (
    <>
      <div className="min-h-screen pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Our Work</span>
            <h1 className="mt-3 text-5xl md:text-6xl font-bold tracking-tight text-white leading-none">
              Portfolio
            </h1>
            <p className="mt-4 text-[#71717a] max-w-xl leading-relaxed">
              A curated selection of technical systems, custom applications, and platform engineering projects — each scoped, built, and shipped to production standard.
            </p>
          </div>

          <PortfolioGrid items={items} />
        </div>
      </div>
      <Footer />
    </>
  );
}
