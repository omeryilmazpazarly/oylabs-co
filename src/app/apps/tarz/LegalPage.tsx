import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3 text-ink">{title}</h2>
      <div className="text-ink-dim leading-relaxed space-y-3 text-[15px]">{children}</div>
    </div>
  );
}

// Shared shell for Tarz's legal and support pages.
export default function LegalPage({ crumb, title, updated, summary, children }: { crumb: string; title: string; updated?: string; summary?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="flex items-center gap-2 text-xs text-ink-dull mb-10">
          <Link href="/" className="hover:text-ink transition-colors">OY Labs</Link>
          <span>/</span>
          <Link href="/apps/tarz" className="hover:text-ink transition-colors">Tarz</Link>
          <span>/</span>
          <span className="text-ink-dim">{crumb}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-ink-dull text-sm mb-10">
          {updated ? <>Last updated: {updated} · </> : null}Operated by <strong className="text-ink-dim">OY Labs Ltd</strong>
        </p>
        {summary ? <div className="rounded-2xl border border-line bg-panel p-6 mb-10 text-sm text-ink-dim">{summary}</div> : null}
        {children}
      </div>
      <Footer />
    </div>
  );
}
