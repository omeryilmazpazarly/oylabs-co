import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { marked } from 'marked';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Messaging API guide — OY Labs',
  description: 'Receive Messenger and Instagram messages with signed webhooks and reply through the OY Labs Send API.',
};
// Rendered at build time from docs/client-integration.md (the file isn't shipped in the standalone server).
export const dynamic = 'force-static';

export default function MessagingApiGuide() {
  const markdown = fs.readFileSync(path.join(process.cwd(), 'docs', 'client-integration.md'), 'utf8');
  const html = marked.parse(markdown, { async: false, gfm: true });
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="mb-8 flex items-center gap-2 text-xs text-ink-dull">
          <Link href="/" className="hover:text-ink">OY Labs</Link><span>/</span>
          <Link href="/tech-provider" className="hover:text-ink">Messaging</Link><span>/</span>
          <span className="text-ink-dim">API guide</span>
        </div>
        <article className="api-guide" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <Footer />
    </>
  );
}
