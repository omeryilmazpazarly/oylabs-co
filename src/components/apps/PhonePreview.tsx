'use client';

import { useEffect, useRef } from 'react';

import { APP_PREVIEW_ORIGIN } from '@/lib/apps/preview-urls';

/**
 * A phone running the real app. `draft` is sent to it whenever it changes, so unsaved
 * dashboard edits (colours, logo, texts) show without saving; the app applies them
 * and redraws.
 */
export function PhonePreview({ src, draft, className = '' }: { src: string; draft?: unknown; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const serialized = draft === undefined ? undefined : JSON.stringify(draft);

  const send = () => {
    if (serialized === undefined) return;
    frame.current?.contentWindow?.postMessage({ type: 'oylabs:draft', settings: JSON.parse(serialized) }, APP_PREVIEW_ORIGIN);
  };

  useEffect(() => {
    const timer = setTimeout(send, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return (
    <div className={`mx-auto w-[300px] max-w-full rounded-[44px] border-[10px] border-neutral-900 bg-neutral-900 shadow-xl ${className}`}>
      <iframe ref={frame} src={src} title="Your app" className="block h-[600px] w-full rounded-[34px] bg-white" onLoad={send} />
    </div>
  );
}
