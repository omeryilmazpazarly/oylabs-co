'use client';

import { useEffect, useRef } from 'react';

/** The web build of the real app (storefront-app demo client), served next to the landing page. */
export const APP_PREVIEW_ORIGIN = 'https://dev1024.oylabs.co';
const BASE = `${APP_PREVIEW_ORIGIN}/app-preview`;

export const storePreviewUrl = (store: string, layout: string) => `${BASE}/preview?store=${encodeURIComponent(store)}&layout=${encodeURIComponent(layout)}`;
export const appPreviewUrl = (appKey: string) => `${BASE}/preview?key=${encodeURIComponent(appKey)}`;

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
