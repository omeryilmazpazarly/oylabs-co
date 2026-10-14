'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { inputCls, labelCls } from '@/components/console/ui';

/** Uploads an image for the app and keeps its URL in a hidden input named `name`. */
export function ImageField({ appId, name, label, defaultValue, hint, aspect = 'aspect-[16/9]' }: {
  appId: number;
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? '');
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
export function BrandingEditor({ colors, radius, buttonStyle, wordmark, logoUrl, appId }: {
  colors: PreviewColors;
  radius: number;
  buttonStyle: 'rounded' | 'pill' | 'square';
  wordmark: string;
  logoUrl: string | null;
  appId: number;
}) {
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
  const btnRadius = style === 'pill' ? 999 : style === 'square' ? 2 : r;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <label htmlFor="wordmark" className={labelCls}>Name shown in the header</label>
          <input id="wordmark" name="branding.wordmark" value={word} onChange={(e) => setWord(e.target.value)} maxLength={24} className={inputCls} />
          <p className="mt-1.5 text-xs text-ink-dim">Used when there&apos;s no logo image.</p>
        </div>
        <ImageField appId={appId} name="branding.logoUrl" label="Header logo (optional)" defaultValue={logoUrl} aspect="aspect-[4/1]"
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

      <div aria-label="Preview" className="mx-auto w-[260px] overflow-hidden rounded-[32px] border-[7px] border-neutral-900 shadow-xl" style={{ background: c.background }}>
        <div className="flex h-10 items-center justify-center text-[11px] font-semibold tracking-[0.3em]" style={{ color: c.text }}>
          {word || 'STORE'}
        </div>
        <div className="mx-3 h-24 rounded" style={{ background: c.canvas, borderRadius: r }} />
        <div className="grid grid-cols-2 gap-2 p-3">
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="relative h-24" style={{ background: c.canvas, borderRadius: r }}>
                <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white" style={{ background: c.sale }}>−20%</span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold" style={{ color: c.text }}>Product name</div>
              <div className="text-[11px] font-semibold" style={{ color: c.sale }}>EGP 699</div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3">
          <div className="text-[10px] underline" style={{ color: c.accent }}>See all</div>
          <div className="mt-2 flex h-9 items-center justify-center text-[11px] font-semibold text-white" style={{ background: c.primary, borderRadius: btnRadius }}>
            Add to bag
          </div>
        </div>
        <div className="flex justify-around border-t py-2 text-[9px]" style={{ borderColor: c.canvas, color: c.text }}>
          <span style={{ color: c.primary, fontWeight: 600 }}>Home</span><span>Shop</span><span>Bag</span><span>Account</span>
        </div>
      </div>
    </div>
  );
}
