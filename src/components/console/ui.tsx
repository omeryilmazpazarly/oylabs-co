import Link from 'next/link';
import type { ReactNode } from 'react';

/* Shared building blocks for the staff console and the client connect flow. */

export const inputCls =
  'w-full bg-input border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-dull focus:outline-none focus:border-line-hi transition-colors';
export const labelCls = 'block text-[11px] text-ink-dim tracking-[0.14em] uppercase mb-1.5';
export const primaryBtn =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-cta text-cta-fg px-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none';
export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-line px-3.5 py-2 text-sm text-ink-dim hover:text-ink hover:border-line-hi transition disabled:opacity-40 disabled:pointer-events-none';
export const dangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition disabled:opacity-40';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] tracking-[0.2em] uppercase text-ink-dim mb-2">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink break-words">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-dim max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '' }: { title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-panel ${className}`}>
      {(title || actions) && (
        <header className="flex flex-col gap-3 border-b border-line-sub px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-ink-dim">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
  amber: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
  red:   'bg-red-500/10 text-red-500 border-red-500/25',
  blue:  'bg-sky-500/10 text-sky-500 border-sky-500/25',
  pink:  'bg-pink-500/10 text-pink-500 border-pink-500/25',
  gray:  'bg-elevated text-ink-dim border-line',
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <div className="rounded-xl border border-line bg-panel p-4 h-full hover:border-line-hi transition-colors">
      <div className="text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-ink-dim">{label}</div>
      {hint && <div className="mt-2 text-[11px] text-ink-dull">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-elevated text-ink-dim">{icon}</div>}
      <div className="text-sm font-medium text-ink">{title}</div>
      {children && <div className="mt-1 text-xs text-ink-dim max-w-sm leading-relaxed">{children}</div>}
    </div>
  );
}

export function Notice({ tone = 'gray', children }: { tone?: 'gray' | 'amber' | 'red' | 'green'; children: ReactNode }) {
  const cls = {
    gray: 'border-line bg-elevated text-ink-dim',
    amber: 'border-amber-500/30 bg-amber-500/5 text-ink',
    red: 'border-red-500/30 bg-red-500/5 text-ink',
    green: 'border-emerald-500/30 bg-emerald-500/5 text-ink',
  }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

export function Wordmark({ suffix }: { suffix?: string }) {
  return (
    <span className="flex items-center select-none">
      <span className="text-ink font-bold tracking-tight">OY</span>
      <span className="text-ink-dim font-light tracking-[0.2em] ml-1.5">LABS</span>
      {suffix && <span className="ml-2.5 rounded-md border border-line px-1.5 py-0.5 text-[10px] tracking-[0.15em] uppercase text-ink-dim">{suffix}</span>}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' });
export const formatDate = (ms: number) => dateFmt.format(new Date(ms));

export function relativeTime(ms: number, nowMs = Date.now()): string {
  const diff = Math.round((nowMs - ms) / 1000);
  const s = Math.abs(diff);
  const unit = s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`;
  return diff < 0 ? `in ${unit}` : `${unit} ago`;
}

export function ChannelBadge({ channel }: { channel: 'messenger' | 'instagram' | 'whatsapp' }) {
  if (channel === 'whatsapp') return <Badge tone="green">WhatsApp</Badge>;
  return channel === 'instagram' ? <Badge tone="pink">Instagram</Badge> : <Badge tone="blue">Messenger</Badge>;
}

export function ConnectionStatusBadge({ status }: { status: string }) {
  if (status === 'active') return <Badge tone="green">Active</Badge>;
  if (status === 'reconnect_needed') return <Badge tone="amber">Reconnect needed</Badge>;
  return <Badge>Disconnected</Badge>;
}

/* lucide-react no longer ships brand marks; these are minimal glyphs for labelling channels. */
export function FacebookIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.4.6.6-2.3-.2-.3A8 8 0 0 1 12 4zm-3.3 4.2c-.2 0-.4 0-.6.3-.2.3-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.6 4 3.5 1.9.7 2.3.6 2.8.6.4 0 1.3-.5 1.5-1.1.2-.6.2-1.1.1-1.2l-.5-.3s-1.2-.6-1.4-.7c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.6z" />
    </svg>
  );
}

export function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
