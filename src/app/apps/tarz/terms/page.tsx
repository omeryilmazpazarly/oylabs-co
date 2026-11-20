import type { Metadata } from 'next';
import LegalPage, { Section } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — Tarz | OY Labs',
  description: 'Terms of service for Tarz, the 3D product designer for Shopify.',
};

export default function TarzTermsPage() {
  return (
    <LegalPage crumb="Terms of Service" title="Tarz Terms of Service" updated="November 2026">
      <Section title="1. The service">
        <p>Tarz is a Shopify app operated by OY Labs Ltd that lets merchants offer product options, a product designer with 3D preview, AI design tools and production files. By installing the app you agree to these terms and to Shopify&rsquo;s terms of service.</p>
      </Section>
      <Section title="2. Plans and billing">
        <p>Paid plans are billed monthly through Shopify at the price shown when you choose a plan. AI usage above the credits included in your plan is billed through Shopify as usage. We do not charge a percentage of your sales. You can change or cancel your plan at any time from the app; charges already billed are not refunded except where Shopify&rsquo;s policies or the law require it.</p>
      </Section>
      <Section title="3. Your content and your customers' content">
        <p>You and your customers keep ownership of designs, images and text. You give us permission to store and process them only to run the app for you. You are responsible for making sure the products you sell, and the designs your customers submit, do not infringe anyone&rsquo;s rights or break the law.</p>
      </Section>
      <Section title="4. AI features">
        <p>AI results can be imperfect. Review designs before production. Prompts that break the AI providers&rsquo; policies are blocked. When you use your own AI keys, you are responsible for that provider&rsquo;s charges and terms.</p>
      </Section>
      <Section title="5. Previews and production files">
        <p>3D and flat previews are guides; real colours, sizes and placement can differ slightly. Check print files before producing an order.</p>
      </Section>
      <Section title="6. Availability and changes">
        <p>We work to keep the app available and secure but do not guarantee uninterrupted service. We may change or improve features; we will give notice of changes that materially reduce what your plan includes.</p>
      </Section>
      <Section title="7. Liability">
        <p>To the extent the law allows, OY Labs Ltd is not liable for indirect or consequential losses, and our total liability is limited to the fees you paid for the app in the three months before the claim.</p>
      </Section>
      <Section title="8. Ending the service">
        <p>You can uninstall the app at any time. We delete your shop&rsquo;s data as described in the privacy policy. We may suspend accounts that abuse the service or break these terms.</p>
      </Section>
      <Section title="9. Contact">
        <p>Questions: <a href="mailto:hi@oylabs.co" className="text-ink hover:underline">hi@oylabs.co</a></p>
      </Section>
    </LegalPage>
  );
}
