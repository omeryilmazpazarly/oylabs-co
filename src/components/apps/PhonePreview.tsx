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

  // The app runs at a real phone size (390×844) and is scaled down to fit the frame,
  // so text and images look as they do on a phone instead of zoomed in.
  return (
    <div className={`mx-auto w-[300px] rounded-[44px] border-[10px] border-neutral-900 bg-neutral-900 shadow-xl ${className}`}>
      <div className="relative h-[607px] w-[280px] overflow-hidden rounded-[34px] bg-white">
        <iframe
          ref={frame}
          src={src}
          title="Your app"
          onLoad={send}
          className="absolute left-0 top-0 block border-0 bg-white"
          style={{ width: 390, height: 844, transform: `scale(${280 / 390})`, transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}
