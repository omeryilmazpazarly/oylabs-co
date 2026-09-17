'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Camera, ShieldCheck, Inbox } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

function Connector({ delay }: { delay: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex items-center justify-center h-10 w-px md:h-px md:w-full md:self-center" aria-hidden>
      <div className="absolute inset-0 bg-line-hi" />
      {!reduce && (
        <>
          <motion.span
            className="absolute hidden md:block w-1.5 h-1.5 rounded-full bg-ink top-1/2 -translate-y-1/2"
            initial={{ left: '0%', opacity: 0 }}
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
          />
          <motion.span
            className="absolute md:hidden w-1.5 h-1.5 rounded-full bg-ink left-1/2 -translate-x-1/2"
            initial={{ top: '0%', opacity: 0 }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
          />
        </>
      )}
    </div>
  );
}

function Node({
  icon,
  title,
  caption,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.15 + index * 0.1 }}
      className="w-full rounded-2xl border border-line bg-panel px-5 py-4 flex items-center gap-3 md:flex-col md:text-center md:py-6"
    >
      <div className="w-10 h-10 shrink-0 rounded-xl bg-elevated border border-line flex items-center justify-center text-ink">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-dim leading-relaxed mt-0.5">{caption}</p>
      </div>
    </motion.div>
  );
}

/** Simple illustration of how a message travels from Meta to the business inbox. */
export default function MessageFlow() {
  return (
    <figure className="mt-12 sm:mt-16">
      <div className="flex flex-col items-center md:grid md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)_3rem_minmax(0,1fr)] md:items-stretch lg:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_5rem_minmax(0,1fr)]">
        <Node
          index={0}
          icon={<span className="flex -space-x-1"><MessageCircle size={16} /><Camera size={16} /></span>}
          title="Your customers"
          caption="Message your Page on Messenger or your Instagram account in Direct"
        />
        <Connector delay={0} />
        <Node
          index={1}
          icon={<ShieldCheck size={18} />}
          title="OY Labs"
          caption="Verifies each event from Meta and delivers it securely"
        />
        <Connector delay={1.2} />
        <Node
          index={2}
          icon={<Inbox size={18} />}
          title="Your inbox or CRM"
          caption="Your staff read the conversation and reply from one place"
        />
      </div>
      <figcaption className="sr-only">
        Customer messages sent to your Facebook Page or Instagram account are received by OY Labs, verified,
        and delivered to your own inbox. Replies travel back the same way.
      </figcaption>
    </figure>
  );
}
