import Hero from '@/components/Hero';
import Services from '@/components/Services';
import TechStack from '@/components/TechStack';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getAllItems } from '@/lib/db';
import PortfolioGrid from '@/components/PortfolioGrid';
import SectionAtmosphere from '@/components/effects/SectionAtmosphere';
import WorkSectionHeader from '@/components/WorkSectionHeader';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const items = getAllItems().slice(0, 6);

  return (
    <>
      <Hero />
      <Services />

      {/* Selected Work */}
      <section id="work" className="relative min-h-screen py-32 px-6 overflow-hidden flex flex-col justify-center snap-start">
        <SectionAtmosphere theme="work" />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <WorkSectionHeader />
          <PortfolioGrid items={items} />
        </div>
      </section>

      <TechStack />
      {/* Contact + Footer share one snap unit so the footer is reachable */}
      <div className="snap-start">
        <Contact />
        <Footer />
      </div>
    </>
  );
}
