import Hero from '@/components/Hero';
import Services from '@/components/Services';
import TechStack from '@/components/TechStack';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';
import LightSection from '@/components/effects/LightSection';
import SectionOrbs from '@/components/effects/SectionOrbs';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const items = getAllItems().slice(0, 6);

  return (
    <>
      <Hero />
      <Services />

      {/* Featured Work — violet/amber orb tint */}
      <section id="work" className="relative py-32 px-6 border-t border-[#111] overflow-hidden">
        <SectionOrbs variant="violet-amber" />
        <div className="relative z-10 max-w-7xl mx-auto">
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

      {/* Mercury-style: scrolls from dark → light → dark */}
      <LightSection className="relative">
        {/* Edge feathers so the white never cuts hard against the black page */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <TechStack />
      </LightSection>

      {/* Contact — teal/violet orb tint */}
      <section id="contact-wrap" className="relative overflow-hidden">
        <SectionOrbs variant="teal-violet" />
        <div className="relative z-10">
          <Contact />
        </div>
      </section>

      <Footer />
    </>
  );
}
