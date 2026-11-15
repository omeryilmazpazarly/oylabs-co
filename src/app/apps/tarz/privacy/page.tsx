import type { Metadata } from 'next';
import LegalPage, { Section } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — Tarz | OY Labs',
  description: 'How Tarz, the 3D product designer for Shopify, collects, uses and deletes merchant and customer data.',
};

const a = 'text-ink hover:underline';

export default function TarzPrivacyPage() {
  return (
    <LegalPage
      crumb="Privacy Policy"
      title="Tarz Privacy Policy"
      updated="November 2026"
      summary={<><strong className="text-ink">Summary:</strong> Tarz keeps only what it needs to show product options, save designs and produce print files. We never collect payment details or customers&rsquo; names, emails or addresses, and we never sell data.</>}
    >
      <Section title="1. Who we are">
        <p>Tarz (&ldquo;the app&rdquo;) is a Shopify application developed and operated by <strong className="text-ink">OY Labs Ltd</strong>.</p>
        <p>Contact: <a href="mailto:hello@oylabs.co" className={a}>hello@oylabs.co</a> · Website: <a href="https://oylabs.co" className={a}>https://oylabs.co</a></p>
      </Section>
      <Section title="2. Data we collect from merchants">
        <ul className="list-disc pl-5 space-y-1">
          <li>Shop domain, shop name, contact email and currency.</li>
          <li>Products, collections and variants the merchant sets up in the app.</li>
          <li>Orders that contain customized items: line items, quantities, the order name, and the options and designs chosen.</li>
        </ul>
      </Section>
      <Section title="3. Data we collect from shoppers">
        <ul className="list-disc pl-5 space-y-1">
          <li>Designs they create: text, images they upload and the options they pick.</li>
          <li>If they are logged in to the store, their Shopify customer ID, so they can see their saved designs. Guests get a random token stored in their own browser.</li>
          <li>For AI features: the prompts they type, a random session ID and their IP address, used only for usage limits and abuse prevention.</li>
        </ul>
        <p>We do not collect payment details, passwords, or shoppers&rsquo; names, emails, phone numbers or addresses.</p>
      </Section>
      <Section title="4. How we use data">
        <ul className="list-disc pl-5 space-y-1">
          <li>To show product options, calculate prices and protect checkout prices from tampering.</li>
          <li>To save designs, create print files and mockups, and show them to the merchant for production.</li>
          <li>To run AI features and keep them safe: prompts are checked by a moderation service before images are generated.</li>
          <li>To bill the merchant through Shopify and to answer support requests.</li>
        </ul>
        <p>We do not sell, rent or share data for advertising.</p>
      </Section>
      <Section title="5. Service providers">
        <ul className="list-disc pl-5 space-y-1">
          <li>Hosting and database for the app.</li>
          <li>File storage for uploads, designs and print files.</li>
          <li>AI providers, only when the merchant turns AI features on: OpenAI, Google (Gemini), Anthropic and fal.ai. Prompts and images are sent to them to produce results. When a merchant uses their own API keys, the merchant&rsquo;s agreement with that provider applies.</li>
        </ul>
      </Section>
      <Section title="6. Retention and deletion">
        <ul className="list-disc pl-5 space-y-1">
          <li>Designs and files are kept while the merchant has the app installed, so customers can reorder.</li>
          <li>When a shopper asks a store to delete their data, Shopify tells us and we delete their designs and uploads and anonymise their production records.</li>
          <li>48 hours after a merchant uninstalls the app, Shopify asks us to erase the shop&rsquo;s data and we delete all of it, including stored files.</li>
          <li>AI usage records keep counts and costs, not images.</li>
        </ul>
      </Section>
      <Section title="7. Security">
        <p>All traffic uses HTTPS. Merchants&rsquo; AI keys are encrypted at rest and never sent to browsers. Requests from Shopify are signature-verified, and access to production systems is limited to OY Labs staff who need it.</p>
      </Section>
      <Section title="8. Your rights">
        <p>Shoppers should contact the store they bought from; the store can make requests through Shopify. Merchants can contact <a href="mailto:hello@oylabs.co" className={a}>hello@oylabs.co</a> to access, correct or delete their data.</p>
      </Section>
      <Section title="9. Changes">
        <p>We will post any changes on this page and update the date above.</p>
      </Section>
    </LegalPage>
  );
}
