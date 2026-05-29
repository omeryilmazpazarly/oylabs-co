import Hero from '@/components/Hero';
import Services from '@/components/Services';
import TechStack from '@/components/TechStack';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const items = getAllItems().slice(0, 6);

  return (
    <>
      <Hero />
      <Services />

      {/* Featured Work teaser */}
      <section id="work" className="py-32 px-6 border-t border-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Selected Work</span>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white">
                Recent <span className="text-[#71717a]">Projects</span>
              </h2>
            </div>
            <a
              href="/portfolio"
              className="text-sm text-[#71717a] hover:text-white tracking-wide transition-colors border-b border-[#333] pb-0.5 hover:border-white whitespace-nowrap"
            >
              View all projects →
            </a>
          </div>
          <PortfolioGrid items={items} />
        </div>
      </section>

      <TechStack />
      <Contact />
      <Footer />
    </>
  );
}
