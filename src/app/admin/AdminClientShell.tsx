'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, LayoutGrid, Database } from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import AdminTable from '@/components/admin/AdminTable';
import AdminForm from '@/components/admin/AdminForm';

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? '0y1abs';

interface Props {
  initialItems: PortfolioItem[];
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('oy_admin', '1');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
      setPin('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#000]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.8 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center mx-auto mb-5">
            <Lock size={18} className="text-[#71717a]" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-white font-bold">OY</span>
            <span className="text-[#71717a] tracking-[0.2em] ml-1 text-sm">LABS</span>
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Admin Access</h1>
          <p className="text-sm text-[#71717a] mt-1">Enter your access PIN to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              className={`w-full bg-[#111] border rounded-xl px-5 py-4 text-center text-lg font-mono text-white placeholder-[#3f3f46] focus:outline-none transition-colors tracking-[0.3em] ${
                error ? 'border-red-500/60 bg-red-500/5' : 'border-[#222] focus:border-[#444]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3f3f46] hover:text-[#71717a] transition-colors"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400 text-center"
              >
                Incorrect PIN. Try again.
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all active:scale-[0.98]"
          >
            Unlock Dashboard
          </button>
        </form>
        <p className="text-xs text-[#3f3f46] text-center mt-6">
          Default PIN: <code className="text-[#71717a]">0y1abs</code> — set{' '}
          <code className="text-[#71717a]">NEXT_PUBLIC_ADMIN_PIN</code> to override.
        </p>
      </motion.div>
    </div>
  );
}

export default function AdminClientShell({ initialItems }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioItem | null | undefined>(undefined);
  const showForm = editTarget !== undefined;

  useEffect(() => {
    if (sessionStorage.getItem('oy_admin') === '1') setUnlocked(true);
  }, []);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-[#000] pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#111] border border-[#222] flex items-center justify-center">
                <Database size={12} className="text-[#71717a]" />
              </div>
              <span className="text-xs text-[#71717a] tracking-[0.2em] uppercase">Admin</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Control Engine</h1>
            <p className="text-sm text-[#71717a] mt-1">Manage portfolio projects, categories, and ordering.</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#222] text-xs text-[#71717a] hover:text-white hover:border-[#444] transition-all"
            >
              <LayoutGrid size={12} />
              View Site
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Projects', value: initialItems.length },
            { label: 'System Implementations', value: initialItems.filter((i) => i.mainCategory === 'SYSTEM_IMPLEMENTATION').length },
            { label: 'Websites', value: initialItems.filter((i) => i.mainCategory === 'WEBSITES').length },
            { label: 'Apps & Mobile', value: initialItems.filter((i) => i.mainCategory === 'APPS_PLUGINS' || i.mainCategory === 'MOBILE_APPS').length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5">
              <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-[#71717a] mt-1 tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
          <AdminTable
            items={initialItems}
            onEdit={(item) => setEditTarget(item)}
            onNew={() => setEditTarget(null)}
          />
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <AdminForm
          item={editTarget}
          onClose={() => setEditTarget(undefined)}
        />
      )}
    </div>
  );
}
