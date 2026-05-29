import Hero from '@/components/Hero';
import Services from '@/components/Services';
import TechStack from '@/components/TechStack';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';
import SectionOrbs from '@/components/effects/SectionOrbs';
import WorkSectionHeader from '@/components/WorkSectionHeader';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const items = getAllItems().slice(0, 6);

  return (
    <>
      <Hero />
      <Services />

      {/* Selected Work */}
      <section id="work" className="relative py-32 px-6 border-t border-[#111] overflow-hidden">
        <SectionOrbs variant="violet-amber" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <WorkSectionHeader />
          <PortfolioGrid items={items} />
        </div>
      </section>

      <TechStack />
      <Contact />
      <Footer />
    </>
  );
}
