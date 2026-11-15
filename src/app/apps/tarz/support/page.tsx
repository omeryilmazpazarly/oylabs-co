import type { Metadata } from 'next';
import LegalPage, { Section } from '../LegalPage';

export const metadata: Metadata = {
  title: 'Support — Tarz | OY Labs',
  description: 'Get help with Tarz, the 3D product designer for Shopify.',
};

const FAQ: [string, string][] = [
  ['How do I show the options and designer on my product page?', 'In the app, open Home and follow the setup guide: add the "Product options" block to your product template and turn on the app embed in the theme editor.'],
  ['How does the 3D preview pick a shape?', 'By default it reads the product title, type and tags (English or Arabic) and picks the closest shape. If your product has its own 3D model in Shopify, Tarz uses it. You can also choose a shape in Design templates.'],
  ['Where are the print files?', 'Open Production in the app. Each order item has PNG files at real size and DPI, a PDF and a mockup, plus a ZIP download and a job sheet.'],
  ['Can customers change the price in the cart?', 'No. Prices are calculated on our server and checked again at checkout, which blocks edited carts.'],
  ['Do you take a percentage of sales?', 'No. Plans are a flat monthly price.'],
];

export default function TarzSupportPage() {
  return (
    <LegalPage crumb="Support" title="Tarz Support">
      <Section title="Contact us">
        <p>Email <a href="mailto:hello@oylabs.co" className="text-ink hover:underline">hello@oylabs.co</a> with your store address. We reply within one business day, in English or Arabic.</p>
      </Section>
      <Section title="Common questions">
        {FAQ.map(([q, answer]) => (
          <div key={q}>
            <p className="font-semibold text-ink">{q}</p>
            <p>{answer}</p>
          </div>
        ))}
      </Section>
    </LegalPage>
  );
}
