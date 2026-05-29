import Hero from '@/components/Hero';
import Services from '@/components/Services';
import TechStack from '@/components/TechStack';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import { getAllItems } from '@/lib/db';
import LightSection from '@/components/effects/LightSection';
import SectionOrbs from '@/components/effects/SectionOrbs';
import SelectedWorkSection from '@/components/SelectedWorkSection';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const items = getAllItems().slice(0, 6);

  return (
    <>
      <Hero />
      <Services />

      {/* Selected Work — full page goes white as you scroll through */}
      <SelectedWorkSection items={items} />

      {/* The Core Stack — same Mercury transition */}
      <LightSection>
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
