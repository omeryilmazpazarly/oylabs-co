import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Tarz — 3D Product Designer for Shopify | OY Labs',
  description: 'Arabic-first product designer for Shopify with a live 3D preview, product options with tamper-proof pricing, AI design help and print-ready production files.',
};

const FEATURES = [
  ['Live 3D preview', 'Shoppers rotate the product in 3D while they design. T-shirts, hoodies, abayas and blazers built in, or your own 3D model.'],
  ['Arabic-first designer', 'Right-to-left layout, joined Arabic text and Arabic fonts, plus English.'],
  ['Options and pricing', 'Fabric, packaging, logo method and more, with conditional rules and a checkout check that blocks edited prices.'],
  ['Print-ready files', 'PNG at real size and DPI, PDF and mockups for every order, on a production board.'],
  ['AI design help', 'Generate artwork, remove backgrounds, upscale, vectorize and get slogan ideas.'],
  ['No % of sales', 'One flat monthly price.'],
];

export default function TarzPage() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        <div className="flex items-center gap-5 mb-8">
          <Image src="/apps/tarz/icon.png" alt="Tarz icon" width={80} height={80} className="rounded-2xl" />
          <div>
            <h1 className="text-4xl font-bold">Tarz</h1>
            <p className="text-ink-dim">3D Product Designer for Shopify</p>
          </div>
        </div>
        <p className="text-lg text-ink-dim max-w-2xl mb-12">
          Let customers design their own products in Arabic or English and see the result in 3D before they buy. You receive print-ready files with every order.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="font-semibold mb-2">{title}</h2>
              <p className="text-sm text-ink-dim">{body}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/apps/tarz/support" className="underline">Support</Link>
          <Link href="/apps/tarz/privacy" className="underline">Privacy policy</Link>
          <Link href="/apps/tarz/terms" className="underline">Terms of service</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
