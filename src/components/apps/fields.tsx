'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { inputCls, labelCls } from '@/components/console/ui';
import { LAYOUTS, LAYOUT_IDS, type LayoutId } from '@/lib/apps/layouts';
import { appPreviewUrl, PhonePreview } from './PhonePreview';

/** Uploads an image for the app and keeps its URL in a hidden input named `name`. */
export function ImageField({ appId, name, label, defaultValue, hint, aspect = 'aspect-[16/9]', onChange }: {
  appId: number;
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  aspect?: string;
  onChange?: (url: string) => void;
}) {
  const [value, setStored] = useState(defaultValue ?? '');
  const setValue = (v: string) => {
    setStored(v);
    onChange?.(v);
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.set('appId', String(appId));
    fd.set('file', file);
    try {
      const res = await fetch('/api/mobile/upload', { method: 'POST', body: fd });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? 'Upload failed.');
      setValue(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={labelCls}>{label}</div>
      <input type="hidden" name={name} value={value} />
      <div className={`relative ${aspect} w-full max-w-sm overflow-hidden rounded-xl border border-dashed border-line bg-input`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-dim">No image</div>
        )}
        {value && (
          <button type="button" onClick={() => setValue('')} className="absolute right-2 top-2 rounded-full bg-panel/90 p-1 text-ink-dim hover:text-ink" aria-label="Remove image">
            <X size={14} />
          </button>
        )}
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-dim hover:text-ink">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
        {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {hint && <p className="mt-1.5 text-xs text-ink-dim">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** English and Arabic inputs side by side for one piece of copy. */
export function LocalizedField({ name, label, value, multiline, maxLength, placeholder }: {
  name: string;
  label: string;
  value?: { en?: string; ar?: string };
  multiline?: boolean;
  maxLength?: number;
  placeholder?: { en?: string; ar?: string };
}) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div>
      <div className={labelCls}>{label}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Tag name={`${name}.en`} defaultValue={value?.en ?? ''} maxLength={maxLength} placeholder={placeholder?.en ?? 'English'} className={inputCls} rows={multiline ? 2 : undefined} />
        <Tag name={`${name}.ar`} defaultValue={value?.ar ?? ''} maxLength={maxLength} placeholder={placeholder?.ar ?? 'العربية'} dir="rtl" className={inputCls} rows={multiline ? 2 : undefined} />
      </div>
    </div>
  );
}

export interface PreviewColors {
  primary: string;
  accent: string;
  background: string;
  canvas: string;
  text: string;
  sale: string;
}

/** Colour pickers that drive a live phone preview, so the merchant sees the result before saving. */
export function BrandingEditor({ colors, radius, buttonStyle, wordmark, logoUrl, appId, appKey, layout }: {
  colors: PreviewColors;
  radius: number;
  buttonStyle: 'rounded' | 'pill' | 'square';
  wordmark: string;
  logoUrl: string | null;
  appId: number;
  appKey: string;
  layout: LayoutId;
}) {
  const [logo, setLogo] = useState(logoUrl ?? '');
  const [lay, setLay] = useState(layout);
  const [c, setC] = useState(colors);
  const [r, setR] = useState(radius);
  const [style, setStyle] = useState(buttonStyle);
  const [word, setWord] = useState(wordmark);
  const fields: { key: keyof PreviewColors; label: string }[] = [
    { key: 'primary', label: 'Buttons & active tabs' },
    { key: 'accent', label: 'Links & highlights' },
    { key: 'background', label: 'Background' },
    { key: 'canvas', label: 'Secondary background' },
    { key: 'text', label: 'Text' },
    { key: 'sale', label: 'Sale prices' },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div>
          <div className={labelCls}>Layout</div>
          <input type="hidden" name="layout" value={lay} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LAYOUT_IDS.map((id) => (
              <button key={id} type="button" onClick={() => setLay(id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm ${lay === id ? 'border-ink text-ink' : 'border-line text-ink-dim hover:text-ink'}`}>
                <div className="font-semibold">{LAYOUTS[id].name.en}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug">{LAYOUTS[id].description.en}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="wordmark" className={labelCls}>Name shown in the header</label>
          <input id="wordmark" name="branding.wordmark" value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} className={inputCls} />
          <p className="mt-1.5 text-xs text-ink-dim">Used when there&apos;s no logo image.</p>
        </div>
        <ImageField appId={appId} name="branding.logoUrl" label="Header logo (optional)" defaultValue={logoUrl} aspect="aspect-[4/1]" onChange={setLogo}
          hint="A transparent PNG works best, at least 600 px wide." />
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls} htmlFor={`c-${key}`}>{label}</label>
              <div className="flex items-center gap-2">
                <input id={`c-${key}`} type="color" value={c[key]} onChange={(e) => setC({ ...c, [key]: e.target.value.toUpperCase() })} className="h-10 w-12 cursor-pointer rounded-md border border-line bg-input" />
                <input name={`branding.colors.${key}`} value={c[key]} onChange={(e) => setC({ ...c, [key]: e.target.value })} pattern="#[0-9A-Fa-f]{6}" className={`${inputCls} font-mono`} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="buttonStyle" className={labelCls}>Button shape</label>
            <select id="buttonStyle" name="branding.buttonStyle" value={style} onChange={(e) => setStyle(e.target.value as typeof style)} className={inputCls}>
              <option value="rounded">Rounded</option>
              <option value="pill">Pill</option>
              <option value="square">Square</option>
            </select>
          </div>
          <div>
            <label htmlFor="radius" className={labelCls}>Corner roundness ({r}px)</label>
            <input id="radius" name="branding.radius" type="range" min={0} max={20} value={r} onChange={(e) => setR(Number(e.target.value))} className="w-full accent-current" />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <PhonePreview
          src={appPreviewUrl(appKey)}
          draft={{ layout: lay, branding: { wordmark: word, logoUrl: logo || null, colors: c, buttonStyle: style, radius: r } }}
        />
        <p className="mt-3 text-center text-xs text-ink-dim">Your real app, with your products. Changes show here before you save.</p>
      </div>
    </div>
  );
}
